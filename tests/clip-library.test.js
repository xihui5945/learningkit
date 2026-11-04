import { describe, it, expect, vi } from 'vitest';
import { ClipLibrary, clipKey, CLIP_FILE_PATTERN, findAudibleRange } from '../clip-library.js';
import { SOUND_FILE_PATTERN } from '../tools/azure-ipa.js';
import { SPALDING_PHONOGRAMS } from '../phonograms-data.js';
import { readFileSync, existsSync } from 'node:fs';

const json = data => new Response(JSON.stringify(data), { status: 200 });
const bytes = () => new Response(new Uint8Array(8), { status: 200 });
const fakeBuffer = () => ({ duration: 0.5, numberOfChannels: 1, sampleRate: 100, getChannelData: () => new Float32Array(50).fill(0.5) });
const fakeCtx = () => ({ decodeAudioData: vi.fn(async () => fakeBuffer()) });

describe('findAudibleRange', () => {
  it('trims leading and trailing silence, keeping small pads', () => {
    const sr = 1000;
    const ch = new Float32Array(2000);          // 2 s
    ch.fill(0.3, 200, 500);                       // sound from 0.2 s to 0.5 s
    const r = findAudibleRange([ch], sr, { padStart: 0.03, padEnd: 0.08 });
    expect(r.start).toBeCloseTo(0.17, 3);
    expect(r.start + r.duration).toBeCloseTo(0.58, 3);
  });

  it('ignores noise below the threshold and handles silent clips', () => {
    const ch = new Float32Array(1000).fill(0.001);
    expect(findAudibleRange([ch], 1000)).toEqual({ start: 0, duration: 1 });
    expect(() => findAudibleRange([], 1000)).toThrow();
  });
});

describe('ClipLibrary', () => {
  it('loads valid manifest entries and ignores unsafe file names', async () => {
    const fetchImpl = vi.fn(async () => json({ 'b#1': { file: 'sound-0123456789.mp3' }, 'x#1': { file: '../evil.mp3' } }));
    const lib = new ClipLibrary({ baseUrl: '/audio/sounds/', fetchImpl });
    await lib.load();
    await lib.load(); // loads once
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(lib.has('b#1')).toBe(true);
    expect(lib.has('x#1')).toBe(false);
  });

  it('decodes each file once and shares it between rows', async () => {
    const fetchImpl = vi.fn(async url => (url.endsWith('manifest.json') ? json({ 'n#1': { file: 'sound-aaaaaaaaaa.mp3' }, 'gn#2': { file: 'sound-aaaaaaaaaa.mp3' } }) : bytes()));
    const lib = new ClipLibrary({ baseUrl: '/a/', fetchImpl });
    await lib.load();
    const ctx = fakeCtx();
    const [x, y] = await Promise.all([lib.buffer('n#1', ctx), lib.buffer('gn#2', ctx)]);
    expect(x).toBe(y);
    expect(x).toMatchObject({ start: 0, duration: 0.5 });
    expect(ctx.decodeAudioData).toHaveBeenCalledTimes(1);
  });

  it('survives a missing manifest and retries failed clips', async () => {
    const lib = new ClipLibrary({ baseUrl: '/a/', fetchImpl: vi.fn(async () => new Response('', { status: 404 })) });
    await lib.load();
    expect(lib.has('b#1')).toBe(false);
    expect(await lib.buffer('b#1', fakeCtx())).toBeNull();

    let fail = true;
    const lib2 = new ClipLibrary({ baseUrl: '/a/', fetchImpl: vi.fn(async url => (url.endsWith('manifest.json') ? json({ 'b#1': { file: 'sound-bbbbbbbbbb.mp3' } }) : fail ? Promise.reject(new Error('offline')) : bytes())) });
    await lib2.load();
    expect(await lib2.buffer('b#1', fakeCtx())).toBeNull();
    fail = false;
    expect((await lib2.buffer('b#1', fakeCtx())).duration).toBe(0.5);
  });

  it('rejects a base URL without a trailing slash', () => {
    expect(() => new ClipLibrary({ baseUrl: '/audio/sounds' })).toThrow();
  });
});

describe('shipped clips', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/audio/sounds/manifest.json', import.meta.url), 'utf8'));

  it('cover every phonogram sound, with files present', () => {
    for (const p of SPALDING_PHONOGRAMS) {
      p.sounds.forEach((_, i) => {
        const entry = manifest[clipKey(p.id, i)];
        expect(entry, clipKey(p.id, i)).toBeTruthy();
        expect(existsSync(new URL(`../public/audio/sounds/${entry.file}`, import.meta.url)), entry.file).toBe(true);
      });
    }
  });

  it('use the same file-name rule as the generator', () => {
    expect(CLIP_FILE_PATTERN.source).toBe(SOUND_FILE_PATTERN.source);
  });
});
