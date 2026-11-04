import { describe, it, expect, vi } from 'vitest';
import { toSteps, runSequence } from '../speech-sequence.js';

const b = { id: 'b', letters: 'b', sounds: [{ sound: 'b', example: 'boat' }] };

function io(overrides = {}) {
  const log = [];
  return {
    log,
    speakText: vi.fn(async t => { log.push(`say:${t}`); }),
    playClip: vi.fn(async p => { log.push(`clip:${p.id}`); return true; }),
    speakSoundFallback: vi.fn(async p => { log.push(`fallback:${p.id}`); }),
    isCancelled: () => false,
    pause: async () => {},
    ...overrides
  };
}

describe('toSteps', () => {
  it('keeps text and sound parts, drops punctuation-only text', () => {
    expect(toSteps(['Can you feed me', { phonogram: b, soundIndex: 0 }, '?', '  '])).toEqual([
      { type: 'text', text: 'Can you feed me' },
      { type: 'sound', phonogram: b, soundIndex: 0 }
    ]);
  });

  it('rejects malformed parts', () => {
    expect(() => toSteps('x')).toThrow();
    expect(() => toSteps([{ phonogram: b }])).toThrow();
  });
});

describe('runSequence', () => {
  it('plays speech and clips in order — never sends the sound to speech when a clip exists', async () => {
    const x = io();
    const r = await runSequence(toSteps(['Can you feed me', { phonogram: b, soundIndex: 0 }, '?']), x);
    expect(x.log).toEqual(['say:Can you feed me', 'clip:b']);
    expect(x.speakSoundFallback).not.toHaveBeenCalled();
    expect(r).toEqual({ cancelled: false });
  });

  it('falls back to speech when a clip is unavailable', async () => {
    const x = io({ playClip: vi.fn(async () => false) });
    await runSequence(toSteps([{ phonogram: b, soundIndex: 0 }, 'boat']), x);
    expect(x.log).toEqual(['fallback:b', 'say:boat']);
  });

  it('stops at the next step once cancelled', async () => {
    let cancelled = false;
    const x = io({ isCancelled: () => cancelled });
    x.speakText.mockImplementation(async t => { x.log.push(`say:${t}`); cancelled = true; });
    const r = await runSequence(toSteps(['That is', { phonogram: b, soundIndex: 0 }, 'as in boat']), x);
    expect(x.log).toEqual(['say:That is']);
    expect(r).toEqual({ cancelled: true });
  });

  it('does not fall back to speech for a clip cancelled mid-load', async () => {
    let cancelled = false;
    const x = io({ isCancelled: () => cancelled, playClip: vi.fn(async () => { cancelled = true; return false; }) });
    await runSequence(toSteps([{ phonogram: b, soundIndex: 0 }]), x);
    expect(x.speakSoundFallback).not.toHaveBeenCalled();
  });
});
