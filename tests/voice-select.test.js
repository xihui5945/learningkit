import { describe, it, expect } from 'vitest';
import { pickVoice } from '../voice-select.js';

const v = (name, lang, localService = true) => ({ name, lang, localService });

describe('pickVoice', () => {
  it('returns null when no voices are available', () => {
    expect(pickVoice([])).toBeNull();
    expect(pickVoice(undefined)).toBeNull();
  });

  it('prefers an on-device voice over a cloud voice (offline safety)', () => {
    const cloud = v('Google US English', 'en-US', false);
    const local = v('Fred', 'en-US', true);
    expect(pickVoice([cloud, local])).toBe(local);
  });

  it('skips Edge "Online (Natural)" voices when a local one exists', () => {
    const online = v('Microsoft Aria Online (Natural) - English (United States)', 'en-US', false);
    const local = v('Microsoft Zira - English (United States)', 'en-US', true);
    expect(pickVoice([online, local])).toBe(local);
  });

  it('prefers English, then named child-friendly voices', () => {
    const fr = v('Amélie', 'fr-CA');
    const plain = v('Alex', 'en-US');
    const samantha = v('Samantha', 'en-US');
    expect(pickVoice([fr, plain, samantha])).toBe(samantha);
    expect(pickVoice([fr, plain])).toBe(plain);
  });

  it('falls back to a cloud voice when nothing local exists', () => {
    const cloud = v('Google UK English Female', 'en-GB', false);
    expect(pickVoice([cloud])).toBe(cloud);
  });

  it('does not mutate the input list', () => {
    const list = [v('B', 'en-GB'), v('Samantha', 'en-US')];
    const copy = [...list];
    pickVoice(list);
    expect(list).toEqual(copy);
  });
});
