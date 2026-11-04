// Vite dev-server plugin that saves recordings made in the audit tool into the
// project. Active only under `vite` (dev); never part of a build or preview.
//
//   GET    /__recordings              → { recordings }
//   POST   /__recordings?sound=<ipa>  body: audio/wav  → converts to AAC .m4a and saves
//   DELETE /__recordings?sound=<ipa>  → removes the recording (generated clip is used again)
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { buildRows, readJson, DEFAULT_VOICE, OUT_DIR, MANIFEST, RECORDINGS } from './generate-clips.mjs';
import { applyRecordings, recordingFileName } from './recordings.js';
import { looksLikeWav } from './wav.js';

const run = promisify(execFile);
const MAX_BYTES = 2 * 1024 * 1024;
export const AUDIT_HEADER = 'x-phonoland-audit'; // custom header → cross-site pages can't send it without CORS approval

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

/** Request checks shared by the handler and its tests. Returns an error message or null. */
export function rejectReason(req, { allowedSounds }) {
  if (req.headers[AUDIT_HEADER] !== '1') return 'missing audit header';
  const origin = req.headers.origin;
  if (origin) {
    let host;
    try { host = new URL(origin).hostname; } catch { return 'bad origin'; }
    if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(host)) return 'origin not allowed';
  }
  if (req.method === 'GET') return null;
  const sound = new URL(req.url, 'http://local').searchParams.get('sound');
  if (!sound || !allowedSounds.has(sound)) return 'unknown sound';
  if (req.method === 'POST') {
    if (!String(req.headers['content-type'] || '').startsWith('audio/wav')) return 'expected audio/wav';
    if (Number(req.headers['content-length'] || 0) > MAX_BYTES) return 'recording too large';
  } else if (req.method !== 'DELETE') {
    return 'method not allowed';
  }
  return null;
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BYTES) throw Object.assign(new Error('recording too large'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function saveRegistryAndManifest(recordings) {
  const sorted = Object.fromEntries(Object.entries(recordings).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(RECORDINGS, JSON.stringify(sorted, null, 2) + '\n');
  const manifest = applyRecordings(await readJson(MANIFEST), buildRows(DEFAULT_VOICE, null), sorted);
  await writeFile(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b))), null, 2) + '\n');
}

async function convertToM4a(wavBytes, outFile) {
  const dir = await mkdtemp(path.join(tmpdir(), 'phonoland-rec-'));
  const wav = path.join(dir, 'take.wav');
  try {
    await writeFile(wav, wavBytes);
    await run('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '64000', wav, outFile], { timeout: 15000 });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export function recordingPlugin() {
  const allowedSounds = new Set(buildRows(DEFAULT_VOICE, null).map(r => r.base));
  return {
    name: 'phonoland-recordings',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__recordings', async (req, res) => {
        const reason = rejectReason(req, { allowedSounds });
        if (reason) return json(res, reason === 'method not allowed' ? 405 : 400, { error: reason });
        try {
          const recordings = await readJson(RECORDINGS);
          if (req.method === 'GET') return json(res, 200, { recordings });

          const sound = new URL(req.url, 'http://local').searchParams.get('sound');
          const file = recordingFileName(sound);
          if (req.method === 'DELETE') {
            if (recordings[sound]) {
              delete recordings[sound];
              await unlink(path.join(OUT_DIR, file)).catch(() => {});
              await saveRegistryAndManifest(recordings);
            }
            return json(res, 200, { ok: true, recordings });
          }

          const body = await readBody(req);
          if (!looksLikeWav(body)) return json(res, 400, { error: 'not a WAV file' });
          await convertToM4a(body, path.join(OUT_DIR, file));
          recordings[sound] = { file, recordedAt: new Date().toISOString() };
          await saveRegistryAndManifest(recordings);
          return json(res, 200, { ok: true, file, recordings });
        } catch (err) {
          server.config.logger.error(`[recordings] ${err.message}`);
          return json(res, err.status || 500, { error: err.status ? err.message : 'could not save recording' });
        }
      });
    }
  };
}
