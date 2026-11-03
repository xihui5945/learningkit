#!/usr/bin/env node
// Generates one MP3 per phonogram sound from its IPA using Azure AI Speech.
// Testing/build tool only. Usage:
//   npm run clips                 # generate new or changed clips
//   npm run clips -- --only=ee,th # just these phonograms
//   npm run clips -- --force      # regenerate everything
//   npm run clips -- --dry-run    # show the SSML, no network calls
// Credentials come from .env.local (git-ignored): AZURE_SPEECH_KEY, AZURE_SPEECH_REGION.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { SPALDING_PHONOGRAMS } from '../phonograms-data.js';
import { speakableSound } from '../phonetics.js';
import { buildSsml, clipFileName, resolveSound } from './azure-ipa.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'sounds');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';
const CONCURRENCY = 4;
const MAX_RETRIES = 3;
const TIMEOUT_MS = 15000;

// ---------------- config ----------------
function parseArgs(argv) {
  const args = { force: false, dryRun: false, only: null };
  for (const a of argv) {
    if (a === '--force') args.force = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a.startsWith('--only=')) args.only = new Set(a.slice(7).split(',').map(s => s.trim()).filter(Boolean));
    else throw new Error(`Unknown argument: ${a}`);
  }
  return args;
}

function loadConfig({ dryRun }) {
  try {
    process.loadEnvFile(path.join(ROOT, '.env.local'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  const key = process.env.AZURE_SPEECH_KEY?.trim();
  const region = process.env.AZURE_SPEECH_REGION?.trim();
  const voice = process.env.AZURE_SPEECH_VOICE?.trim() || 'en-US-JennyNeural';
  if (!dryRun) {
    if (!key) throw new Error('AZURE_SPEECH_KEY is not set. Copy .env.example to .env.local and fill it in.');
    if (!region || !/^[a-z0-9]+$/.test(region)) throw new Error('AZURE_SPEECH_REGION is missing or invalid (e.g. southeastasia).');
  }
  return { key, region, voice };
}

// ---------------- jobs ----------------
export function buildJobs(voice, only) {
  return SPALDING_PHONOGRAMS
    .filter(p => !only || only.has(p.id))
    .flatMap(p => p.sounds.map((s, i) => {
      const ssml = buildSsml({ ipa: s.ipa, fallbackText: speakableSound(s.sound), voice });
      const resolved = resolveSound(s.ipa, voice);
      return {
        key: `${p.id}#${i + 1}`,
        file: clipFileName(p.id, i + 1),
        ipa: s.ipa,
        azureIpa: resolved.ph,
        voice: resolved.voice,
        ssml,
        hash: createHash('sha256').update(`${OUTPUT_FORMAT}\n${ssml}`).digest('hex').slice(0, 16)
      };
    }));
}

async function readManifest() {
  try {
    return JSON.parse(await readFile(MANIFEST, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw new Error(`Could not read ${MANIFEST}: ${err.message}`);
  }
}

const exists = f => access(f).then(() => true, () => false);

// ---------------- Azure ----------------
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function synthesise(job, { key, region }, { fetchImpl = fetch, retryDelayMs = 500 } = {}) {
  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetchImpl(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': OUTPUT_FORMAT,
          'User-Agent': 'phonoland-clip-generator'
        },
        body: job.ssml,
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
    } catch (err) {
      if (attempt > MAX_RETRIES) throw new Error(`network error: ${err.message}`);
      await sleep(retryDelayMs * 2 ** attempt);
      continue;
    }
    if (res.ok) {
      const audio = Buffer.from(await res.arrayBuffer());
      if (audio.length < 500) throw new Error(`suspiciously small audio (${audio.length} bytes)`);
      return audio;
    }
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt > MAX_RETRIES) {
      const detail = (await res.text().catch(() => '')).slice(0, 200);
      const hint = res.status === 401 ? ' (check AZURE_SPEECH_KEY and AZURE_SPEECH_REGION)' : '';
      throw new Error(`HTTP ${res.status}${hint}${detail ? `: ${detail}` : ''}`);
    }
    const retryAfter = Number(res.headers.get('retry-after'));
    await sleep(retryAfter > 0 ? Math.min(retryAfter, 30) * 1000 : retryDelayMs * 2 ** attempt);
  }
}

async function runPool(items, limit, worker) {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await worker(items[next++]);
  });
  await Promise.all(runners);
}

// ---------------- main ----------------
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = loadConfig(args);
  const jobs = buildJobs(config.voice, args.only);
  if (!jobs.length) throw new Error('No matching phonograms for --only.');

  if (args.dryRun) {
    for (const j of jobs) console.log(`${j.file.padEnd(12)} /${j.ipa}/ → /${j.azureIpa}/\n  ${j.ssml}`);
    console.log(`\n${jobs.length} clip(s) would be generated with ${config.voice}.`);
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  const manifest = await readManifest();
  const todo = [];
  for (const j of jobs) {
    const fresh = manifest[j.key]?.hash === j.hash && (await exists(path.join(OUT_DIR, j.file)));
    if (args.force || !fresh) todo.push(j);
  }
  console.log(`${jobs.length} sound(s); ${todo.length} to generate, ${jobs.length - todo.length} unchanged. Voice: ${config.voice}`);

  const failures = [];
  let done = 0;
  await runPool(todo, CONCURRENCY, async job => {
    try {
      const audio = await synthesise(job, config);
      await writeFile(path.join(OUT_DIR, job.file), audio);
      manifest[job.key] = { file: job.file, ipa: job.ipa, azureIpa: job.azureIpa, voice: job.voice, hash: job.hash, bytes: audio.length };
      console.log(`  ✓ ${String(++done).padStart(3)}/${todo.length} ${job.file} /${job.azureIpa}/`);
    } catch (err) {
      failures.push({ file: job.file, error: err.message });
      console.error(`  ✗ ${job.file}: ${err.message}`);
    }
  });

  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST, JSON.stringify(sorted, null, 2) + '\n');

  if (failures.length) {
    console.error(`\n${failures.length} clip(s) failed. Re-run to retry only those.`);
    process.exitCode = 1;
  } else {
    console.log(`\nDone. Clips in ${path.relative(ROOT, OUT_DIR)}/`);
  }
}

// Run only when executed directly (not when imported by tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(err => {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
  });
}
