import { describe, it, expect, vi } from 'vitest';
import { synthesise, buildJobs } from '../tools/generate-clips.mjs';

const KEY = 'test-secret-key-123';
const job = { file: 'ee-1.mp3', ssml: '<speak/>' };
const cfg = { key: KEY, region: 'southeastasia' };
const opts = fetchImpl => ({ fetchImpl, retryDelayMs: 0 });
const audioRes = () => new Response(new Uint8Array(2000), { status: 200 });
const errRes = (status, body = '') => new Response(body, { status });

describe('buildJobs', () => {
  it('creates one job per sound with a stable hash', () => {
    const a = buildJobs('en-US-JennyNeural', null);
    expect(a).toHaveLength(111);
    expect(buildJobs('en-US-JennyNeural', null)[0].hash).toBe(a[0].hash);
    expect(buildJobs('en-US-AvaNeural', null)[0].hash).not.toBe(a[0].hash);
    expect(buildJobs('en-US-JennyNeural', new Set(['ee'])).map(j => j.file)).toEqual(['ee-1.mp3']);
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
