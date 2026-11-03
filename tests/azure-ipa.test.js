import { describe, it, expect } from 'vitest';
import { toAzureIpa, unsupportedSymbols, buildSsml, clipFileName, rateFor, RATES, TUNING, resolveSound, BRITISH_VOICE } from '../tools/azure-ipa.js';
import { SPALDING_PHONOGRAMS } from '../phonograms-data.js';

describe('toAzureIpa', () => {
  it.each([
    ['iː', 'i'], ['ɜːr', 'ɝ'], ['wɜːr', 'wɝ'], ['ɑːr', 'ɑɹ'], ['ɔːr', 'ɔɹ'],
    ['ɒ', 'ɑ'], ['ɒf', 'ɑf'], ['r', 'ɹ'], ['juː', 'ju'], ['g', 'ɡ'], ['tʃ', 'tʃ']
  ])('%s → %s', (input, expected) => expect(toAzureIpa(input)).toBe(expected));

  it('rejects empty input', () => {
    expect(() => toAzureIpa('')).toThrow();
    expect(() => toAzureIpa(undefined)).toThrow();
  });

  it('maps every IPA value in the dataset to supported en-US symbols', () => {
    for (const p of SPALDING_PHONOGRAMS) {
      for (const s of p.sounds) {
        expect(unsupportedSymbols(toAzureIpa(s.ipa)), `${p.id} /${s.ipa}/`).toEqual([]);
      }
    }
  });

  it('keeps sounds that collide in the speech engine distinct (th, oo, u)', () => {
    const ipaOf = (id, n) => toAzureIpa(SPALDING_PHONOGRAMS.find(p => p.id === id).sounds[n - 1].ipa);
    expect(ipaOf('th', 1)).not.toBe(ipaOf('th', 2));
    expect(ipaOf('oo', 1)).not.toBe(ipaOf('oo', 2));
    expect(ipaOf('u', 3)).not.toBe(ipaOf('o', 3));
  });
});

describe('rateFor', () => {
  it('slows sounds containing a vowel, keeps consonants brisk', () => {
    expect(rateFor('i')).toBe(RATES.vowel);
    expect(rateFor('ʌf')).toBe(RATES.vowel);
    expect(rateFor('ɝ')).toBe(RATES.vowel);
    expect(rateFor('b')).toBe(RATES.consonant);
    expect(rateFor('ʃ')).toBe(RATES.consonant);
    expect(rateFor('ks')).toBe(RATES.consonant);
  });
});

describe('buildSsml', () => {
  it('applies the rate for the sound type', () => {
    expect(buildSsml({ ipa: 'iː', voice: 'en-US-JennyNeural' })).toContain('rate="-45%"');
    expect(buildSsml({ ipa: 'b', voice: 'en-US-JennyNeural' })).toContain('rate="-15%"');
  });

  it('wraps the converted IPA in a phoneme element for the chosen voice', () => {
    const ssml = buildSsml({ ipa: 'iː', fallbackText: 'ee', voice: 'en-US-AvaNeural' });
    expect(ssml).toContain('<voice name="en-US-AvaNeural">');
    expect(ssml).toContain('<phoneme alphabet="ipa" ph="i">ee</phoneme>');
  });

  it('escapes XML in text and rejects bad voices or symbols', () => {
    expect(buildSsml({ ipa: 'b', fallbackText: '<b&>', voice: 'en-US-AvaNeural' })).toContain('&lt;b&amp;&gt;');
    expect(() => buildSsml({ ipa: 'b', voice: 'en-US-Ava"><evil' })).toThrow(/voice/);
    expect(() => buildSsml({ ipa: 'x', voice: 'en-US-AvaNeural' })).toThrow(/unsupported/);
  });
});

describe('TUNING', () => {
  it('applies by-ear adjustments', () => {
    const v = 'en-US-JennyNeural';
    expect(buildSsml({ ipa: 'b', voice: v })).toContain('ph="bə"');
    expect(buildSsml({ ipa: 'aɪ', voice: v })).toContain('ph="ˈaɪ"');
    expect(buildSsml({ ipa: 's', voice: v })).toContain('rate="-45%"');
    expect(buildSsml({ ipa: 'f', voice: v })).toContain('rate="-15%"'); // untouched sounds keep defaults
  });

  it('switches voice and language for British-voice sounds', () => {
    const ssml = buildSsml({ ipa: 'uː', voice: 'en-US-JennyNeural' });
    expect(ssml).toContain(`<voice name="${BRITISH_VOICE}">`);
    expect(ssml).toContain('xml:lang="en-GB"');
    expect(ssml).toContain('ph="uː"');
    expect(resolveSound('z', 'en-US-JennyNeural')).toMatchObject({ ph: 'zː', rate: '-30%', voice: BRITISH_VOICE });
    expect(resolveSound('juː', 'en-US-JennyNeural').voice).toBe('en-US-JennyNeural'); // "you" untouched
    expect(resolveSound('ð', 'en-US-JennyNeural')).toMatchObject({ ph: 'ðː', voice: BRITISH_VOICE });
    expect(resolveSound('θ', 'en-US-JennyNeural').voice).toBe('en-US-JennyNeural'); // unvoiced th passed as-is
  });

  it('only uses supported symbols', () => {
    for (const [key, t] of Object.entries(TUNING)) {
      expect(unsupportedSymbols(t.ph ?? key), key).toEqual([]);
    }
  });
});

describe('clipFileName', () => {
  it('builds safe names', () => {
    expect(clipFileName('ee', 1)).toBe('ee-1.mp3');
    expect(() => clipFileName('../x', 1)).toThrow();
    expect(() => clipFileName('ee', 0)).toThrow();
  });
});
