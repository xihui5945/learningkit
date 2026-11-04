// Loads the generated phonogram sound clips (public/audio/sounds) and decodes
// them on demand. Dependencies are injected so it can be unit-tested.

/** Generated clips (sound-*.mp3) and recordings made in the audit tool (rec-*.m4a). */
export const CLIP_FILE_PATTERN = /^(sound-[0-9a-f]{10}\.mp3|rec-[0-9a-f]{10}\.m4a)$/;

/**
 * Finds the audible part of a clip so the generated files' padding silence
 * (≈1.5 s) isn't played. Returns seconds { start, duration }.
 * @param {Float32Array[]} channels  per-channel sample data
 */
export function findAudibleRange(channels, sampleRate, { threshold = 0.01, padStart = 0.03, padEnd = 0.08 } = {}) {
  if (!channels.length || !(sampleRate > 0)) throw new Error('findAudibleRange: need samples and a sample rate');
  const length = channels[0].length;
  const loud = i => channels.some(ch => Math.abs(ch[i]) > threshold);
  let first = 0;
  while (first < length && !loud(first)) first++;
  if (first === length) return { start: 0, duration: length / sampleRate }; // silent: play as-is
  let last = length - 1;
  while (last > first && !loud(last)) last--;
  const start = Math.max(0, first / sampleRate - padStart);
  const end = Math.min(length / sampleRate, (last + 1) / sampleRate + padEnd);
  return { start, duration: end - start };
}

/** Manifest key for a phonogram sound, matching tools/generate-clips.mjs ("ee#1"). */
export const clipKey = (phonogramId, soundIndex) => `${phonogramId}#${soundIndex + 1}`;

export class ClipLibrary {
  /**
   * @param {object} deps
   * @param {string} deps.baseUrl  folder containing manifest.json and the clips (trailing slash)
   * @param {Function} [deps.fetchImpl]
   */
  constructor({ baseUrl, fetchImpl = (...a) => globalThis.fetch(...a) }) {
    if (typeof baseUrl !== 'string' || !baseUrl.endsWith('/')) throw new Error('ClipLibrary: baseUrl must end with "/"');
    this.baseUrl = baseUrl;
    this.fetchImpl = fetchImpl;
    this.files = new Map();   // clip key → file name
    this.buffers = new Map(); // file name → Promise<AudioBuffer | null>
    this.ready = null;
  }

  /** Loads the manifest once; resolves even when clips are unavailable (callers fall back to speech). */
  load() {
    this.ready ??= (async () => {
      try {
        const res = await this.fetchImpl(`${this.baseUrl}manifest.json`);
        if (!res.ok) return;
        const manifest = await res.json();
        if (!manifest || typeof manifest !== 'object') return;
        for (const [key, entry] of Object.entries(manifest)) {
          if (typeof entry?.file === 'string' && CLIP_FILE_PATTERN.test(entry.file)) this.files.set(key, entry.file);
        }
      } catch {
        // Offline before first cache, or manifest missing: speech fallback.
      }
    })();
    return this.ready;
  }

  has(key) {
    return this.files.has(key);
  }

  /**
   * Fetches and decodes a clip once; later calls reuse the cached buffer.
   * @returns {Promise<{ buffer: AudioBuffer, start: number, duration: number }|null>}
   *   the decoded clip and its audible range; null if missing or undecodable.
   */
  buffer(key, ctx) {
    const file = this.files.get(key);
    if (!file || !ctx) return Promise.resolve(null);
    if (!this.buffers.has(file)) {
      const pending = (async () => {
        try {
          const res = await this.fetchImpl(this.baseUrl + file);
          if (!res.ok) return null;
          const buffer = await decode(ctx, await res.arrayBuffer());
          const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));
          return { buffer, ...findAudibleRange(channels, buffer.sampleRate) };
        } catch {
          return null;
        }
      })();
      // Don't cache failures, so a later attempt (e.g. back online) can succeed.
      pending.then(buf => { if (!buf) this.buffers.delete(file); });
      this.buffers.set(file, pending);
    }
    return this.buffers.get(file);
  }
}

/** decodeAudioData with the legacy callback form for older Safari. */
function decode(ctx, arrayBuffer) {
  return new Promise((resolve, reject) => {
    const maybe = ctx.decodeAudioData(arrayBuffer, resolve, reject);
    if (maybe && typeof maybe.then === 'function') maybe.then(resolve, reject);
  });
}
