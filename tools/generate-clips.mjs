#!/usr/bin/env node
// Generates one MP3 per phonogram sound from its IPA using Azure AI Speech.
// Testing/build tool only. Usage:
//   npm run clips                 # generate new or changed clips
//   npm run clips -- --only=ee,th # just these phonograms
//   npm run clips -- --force      # regenerate everything
//   npm run clips -- --dry-run    # show the SSML, no network calls
//   npm run clips -- --prune      # also delete clip files no row uses any more
// Rows that send identical voice, rate and phonemes share one clip, so every
// occurrence of a sound is the same recording.
// Credentials come from .env.local (git-ignored): AZURE_SPEECH_KEY, AZURE_SPEECH_REGION.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, access, readdir, unlink } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { SPALDING_PHONOGRAMS } from '../phonograms-data.js';
import { speakableSound } from '../phonetics.js';
import { buildSsml, soundFileName, resolveSound } from './azure-ipa.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'audio', 'sounds');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';
const CONCURRENCY = 4;
const MAX_RETRIES = 3;
const TIMEOUT_MS = 15000;

// ---------------- config ----------------
function parseArgs(argv) {
  const args = { force: false, dryRun: false, prune: false, only: null };
  for (const a of argv) {
    if (a === '--force') args.force = true;
    else if (a === '--prune') args.prune = true;
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
/** One entry per phonogram sound (row), each pointing at a shared sound id. */
export function buildRows(voice, only) {
  return SPALDING_PHONOGRAMS
    .filter(p => !only || only.has(p.id))
    .flatMap(p => p.sounds.map((s, i) => {
      const r = resolveSound(s.ipa, voice);
      const soundId = createHash('sha256').update([OUTPUT_FORMAT, r.voice, r.rate, r.ph].join('\n')).digest('hex').slice(0, 10);
      return {
        key: `${p.id}#${i + 1}`, ipa: s.ipa, azureIpa: r.ph, voice: r.voice, rate: r.rate,
        soundId, file: soundFileName(soundId), fallbackText: speakableSound(s.sound)
      };
    }));
}

/** Distinct sounds to synthesise: one job per sound id. */
export function buildJobs(voice, only) {
  const jobs = new Map();
  for (const row of buildRows(voice, only)) {
    if (!jobs.has(row.soundId)) {
      jobs.set(row.soundId, {
        soundId: row.soundId, file: row.file, azureIpa: row.azureIpa, voice: row.voice, rows: [],
        ssml: buildSsml({ ipa: row.ipa, fallbackText: row.fallbackText, voice })
      });
    }
    jobs.get(row.soundId).rows.push(row.key);
  }
  return [...jobs.values()];
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
    for (const j of jobs) console.log(`${j.file}  /${j.azureIpa}/  ${j.voice}  rows: ${j.rows.join(' ')}\n  ${j.ssml}`);
    console.log(`\n${jobs.length} distinct sound(s) for ${jobs.reduce((n, j) => n + j.rows.length, 0)} row(s).`);
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  const manifest = await readManifest();
  const todo = [];
  for (const j of jobs) {
    if (args.force || !(await exists(path.join(OUT_DIR, j.file)))) todo.push(j);
  }
  const rowCount = jobs.reduce((n, j) => n + j.rows.length, 0);
  console.log(`${rowCount} row(s) → ${jobs.length} distinct sound(s); ${todo.length} to generate, ${jobs.length - todo.length} already exist.`);

  const failures = [];
  let done = 0;
  await runPool(todo, CONCURRENCY, async job => {
    try {
      const audio = await synthesise(job, config);
      await writeFile(path.join(OUT_DIR, job.file), audio);
      console.log(`  ✓ ${String(++done).padStart(3)}/${todo.length} ${job.file} /${job.azureIpa}/ ${job.voice} (${job.rows.join(' ')})`);
    } catch (err) {
      failures.push(job);
      console.error(`  ✗ ${job.file} (${job.rows.join(' ')}): ${err.message}`);
    }
  });

  const failed = new Set(failures.map(j => j.soundId));
  for (const row of buildRows(config.voice, args.only)) {
    if (failed.has(row.soundId)) continue; // keep the previous entry (if any) for rows whose new clip failed
    manifest[row.key] = { file: row.file, ipa: row.ipa, azureIpa: row.azureIpa, voice: row.voice, rate: row.rate, hash: row.soundId };
  }
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(MANIFEST, JSON.stringify(sorted, null, 2) + '\n');

  // Clip files no row references any more (old takes, superseded tuning).
  const referenced = new Set(Object.values(sorted).map(e => e.file));
  const unused = (await readdir(OUT_DIR)).filter(f => f.endsWith('.mp3') && !referenced.has(f));
  if (unused.length && args.prune) {
    await Promise.all(unused.map(f => unlink(path.join(OUT_DIR, f))));
    console.log(`Pruned ${unused.length} unused clip file(s).`);
  } else if (unused.length) {
    console.log(`${unused.length} clip file(s) are no longer used; run with --prune to delete them.`);
  }

  if (failures.length) {
    console.error(`\n${failures.length} sound(s) failed. Re-run to retry only those.`);
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
