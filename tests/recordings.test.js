import { describe, it, expect } from 'vitest';
import { encodeWav, looksLikeWav, normalisePeak, toMono } from '../tools/wav.js';
import { applyRecordings, recordingFileName, RECORDING_FILE_PATTERN } from '../tools/recordings.js';
import { rejectReason, AUDIT_HEADER } from '../tools/recording-server.js';
import { groupBySound } from '../tools/record-view.js';
import { buildAuditRows } from '../tools/audit-core.js';
import { SPALDING_PHONOGRAMS } from '../phonograms-data.js';

describe('wav helpers', () => {
  it('encodes a valid 16-bit mono WAV', () => {
    const wav = new Uint8Array(encodeWav(new Float32Array([0, 1, -1, 0.5]), 24000));
    expect(wav.length).toBe(44 + 8);
    expect(looksLikeWav(wav)).toBe(true);
    const view = new DataView(wav.buffer);
    expect(view.getUint32(24, true)).toBe(24000);
    expect(view.getInt16(46, true)).toBe(32767);
    expect(view.getInt16(48, true)).toBe(-32768);
  });

  it('rejects non-WAV bytes and bad rates', () => {
    expect(looksLikeWav(new Uint8Array(100))).toBe(false);
    expect(() => encodeWav(new Float32Array(1), 0)).toThrow();
  });

  it('normalises peak with a gain cap, and mixes to mono', () => {
    expect(Math.max(...normalisePeak(new Float32Array([0.3, -0.45])).map(Math.abs))).toBeCloseTo(0.9);
    expect(Math.max(...normalisePeak(new Float32Array([0.01]), { maxGain: 8 }))).toBeCloseTo(0.08);
    expect([...toMono([new Float32Array([1, 0]), new Float32Array([0, 1])])]).toEqual([0.5, 0.5]);
  });
});

describe('applyRecordings', () => {
  const rows = [
    { key: 'n#1', base: 'n', file: 'sound-aaaaaaaaaa.mp3' },
    { key: 'gn#2', base: 'n', file: 'sound-aaaaaaaaaa.mp3' },
    { key: 'b#1', base: 'b', file: 'sound-bbbbbbbbbb.mp3' }
  ];
  const manifest = Object.fromEntries(rows.map(r => [r.key, { file: r.file, hash: 'x' }]));

  it('points every row of a recorded sound at the recording', () => {
    const rec = recordingFileName('n');
    const out = applyRecordings(manifest, rows, { n: { file: rec } });
    expect(out['n#1']).toMatchObject({ file: rec, recorded: true, generatedFile: 'sound-aaaaaaaaaa.mp3' });
    expect(out['gn#2'].file).toBe(rec);
    expect(out['b#1'].file).toBe('sound-bbbbbbbbbb.mp3');
    expect(manifest['n#1'].file).toBe('sound-aaaaaaaaaa.mp3'); // input untouched
  });

  it('restores the generated clip when a recording is removed', () => {
    const recorded = applyRecordings(manifest, rows, { n: { file: recordingFileName('n') } });
    const back = applyRecordings(recorded, rows, {});
    expect(back['n#1']).toEqual({ file: 'sound-aaaaaaaaaa.mp3', hash: 'x' });
  });

  it('ignores unsafe recording file names', () => {
    expect(applyRecordings(manifest, rows, { n: { file: '../x.m4a' } })['n#1'].file).toBe('sound-aaaaaaaaaa.mp3');
    expect(RECORDING_FILE_PATTERN.test(recordingFileName('ʒ'))).toBe(true);
  });
});

describe('recording server request checks', () => {
  const allowedSounds = new Set(['n', 'ʒ']);
  const req = (method, url, headers = {}) => ({ method, url, headers: { [AUDIT_HEADER]: '1', origin: 'http://localhost:5173', ...headers } });

  it('accepts a valid save from the local audit tool', () => {
    expect(rejectReason(req('POST', '/?sound=%CA%92', { 'content-type': 'audio/wav', 'content-length': '5000' }), { allowedSounds })).toBeNull();
    expect(rejectReason(req('GET', '/'), { allowedSounds })).toBeNull();
  });

  it.each([
    ['no audit header', req('POST', '/?sound=n', { [AUDIT_HEADER]: undefined, 'content-type': 'audio/wav' }), 'missing audit header'],
    ['another website', req('POST', '/?sound=n', { origin: 'https://evil.example', 'content-type': 'audio/wav' }), 'origin not allowed'],
    ['unknown sound', req('POST', '/?sound=../../x', { 'content-type': 'audio/wav' }), 'unknown sound'],
    ['wrong type', req('POST', '/?sound=n', { 'content-type': 'text/html' }), 'expected audio/wav'],
    ['too large', req('POST', '/?sound=n', { 'content-type': 'audio/wav', 'content-length': String(3 * 1024 * 1024) }), 'recording too large'],
    ['bad method', req('PUT', '/?sound=n'), 'method not allowed']
  ])('rejects %s', (_name, r, reason) => expect(rejectReason(r, { allowedSounds })).toBe(reason));
});

describe('groupBySound', () => {
  const rows = buildAuditRows(SPALDING_PHONOGRAMS);

  it('groups 111 rows into one entry per distinct sound', () => {
    const groups = groupBySound(rows, {});
    expect(groups.reduce((n, g) => n + g.rows.length, 0)).toBe(111);
    expect(groups.find(g => g.base === 'k').rows.map(r => r.letters).sort()).toEqual(['c', 'ch', 'ck', 'k']);
  });

  it('classifies marks: all wrong, mixed, ok', () => {
    const marks = { 'l#1': { clip: 'N' }, 'k#1': { clip: 'N' }, 'ck#1': { clip: 'Y' }, 'p#1': { clip: 'Y' } };
    const byBase = Object.fromEntries(groupBySound(rows, marks).map(g => [g.base, g.status]));
    expect(byBase.l).toBe('all-wrong');
    expect(byBase.k).toBe('mixed');
    expect(byBase.p).toBe('ok');
  });
});
