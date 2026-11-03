import { describe, it, expect, vi } from 'vitest';
import { synthesise, buildJobs, buildRows } from '../tools/generate-clips.mjs';

const KEY = 'test-secret-key-123';
const job = { file: 'ee-1.mp3', ssml: '<speak/>' };
const cfg = { key: KEY, region: 'southeastasia' };
const opts = fetchImpl => ({ fetchImpl, retryDelayMs: 0 });
const audioRes = () => new Response(new Uint8Array(2000), { status: 200 });
const errRes = (status, body = '') => new Response(body, { status });

describe('buildRows / buildJobs', () => {
  const V = 'en-US-JennyNeural';
  const rows = buildRows(V, null);
  const fileOf = key => rows.find(r => r.key === key).file;

  it('covers all 111 rows with stable ids', () => {
    expect(rows).toHaveLength(111);
    expect(buildRows(V, null).map(r => r.soundId)).toEqual(rows.map(r => r.soundId));
    expect(buildRows('en-US-AvaNeural', null)[0].soundId).not.toBe(rows[0].soundId);
  });

  it('shares one clip across rows of the same sound', () => {
    expect(fileOf('ee#1')).toBe(fileOf('e#2'));    // /iː/ tree = me
    expect(fileOf('gn#2')).toBe(fileOf('n#1'));    // /n/
    expect(fileOf('s#2')).toBe(fileOf('z#1'));     // /z/
    expect(fileOf('th#1')).not.toBe(fileOf('th#2'));
    expect(fileOf('u#3')).not.toBe(fileOf('o#3')); // /ʊ/ put ≠ /uː/ do
  });

  it('makes one job per distinct sound, listing its rows', () => {
    const jobs = buildJobs(V, null);
    expect(jobs.length).toBe(new Set(rows.map(r => r.soundId)).size);
    expect(jobs.length).toBeLessThan(60);
    expect(jobs.reduce((n, j) => n + j.rows.length, 0)).toBe(111);
    expect(jobs.find(j => j.rows.includes('ee#1')).rows).toEqual(expect.arrayContaining(['e#2', 'ea#1', 'ey#2', 'ei#1', 'ie#1']));
  });
});

describe('synthesise', () => {
  it('posts SSML to the regional endpoint with the key header', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(audioRes());
    const audio = await synthesise(job, cfg, opts(fetchImpl));
    expect(audio.length).toBe(2000);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://southeastasia.tts.speech.microsoft.com/cognitiveservices/v1');
    expect(init.headers['Ocp-Apim-Subscription-Key']).toBe(KEY);
    expect(init.body).toBe('<speak/>');
  });

  it('retries on 429 / 5xx / network errors, then succeeds', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(errRes(429))
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce(errRes(503))
      .mockResolvedValueOnce(audioRes());
    await expect(synthesise(job, cfg, opts(fetchImpl))).resolves.toHaveLength(2000);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it('does not retry auth errors and never leaks the key', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(errRes(401, 'Access denied'));
    const err = await synthesise(job, cfg, opts(fetchImpl)).catch(e => e);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(err.message).toMatch(/HTTP 401.*check AZURE_SPEECH_KEY/);
    expect(err.message).not.toContain(KEY);
  });

  it('gives up after repeated server errors', async () => {
    const fetchImpl = vi.fn().mockImplementation(async () => errRes(500));
    await expect(synthesise(job, cfg, opts(fetchImpl))).rejects.toThrow(/HTTP 500/);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it('rejects empty or truncated audio', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(new Uint8Array(10), { status: 200 }));
    await expect(synthesise(job, cfg, opts(fetchImpl))).rejects.toThrow(/small audio/);
  });
});
