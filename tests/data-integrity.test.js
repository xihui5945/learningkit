import { describe, it, expect } from 'vitest';
import { SPALDING_PHONOGRAMS, PHONOGRAM_CATEGORIES, RULE_CHALLENGES } from '../phonograms-data.js';
import { speakableSound } from '../phonetics.js';

describe('phonogram dataset', () => {
  it('contains 70 phonograms with unique ids', () => {
    expect(SPALDING_PHONOGRAMS).toHaveLength(70);
    expect(new Set(SPALDING_PHONOGRAMS.map(p => p.id)).size).toBe(70);
  });

  it('gives every phonogram at least one complete sound', () => {
    for (const p of SPALDING_PHONOGRAMS) {
      expect(p.sounds.length, p.id).toBeGreaterThan(0);
      for (const s of p.sounds) {
        expect(s.sound, p.id).toBeTruthy();
        expect(s.example, p.id).toBeTruthy();
      }
    }
  });

  it('has category counts that match the filter labels', () => {
    for (const cat of PHONOGRAM_CATEGORIES) {
      const actual = cat.id === 'all'
        ? SPALDING_PHONOGRAMS.length
        : SPALDING_PHONOGRAMS.filter(p => p.category === cat.id).length;
      expect(actual, cat.id).toBe(cat.count);
    }
  });

  it('never asks speech to read diacritics aloud for game prompts', () => {
    const diacritic = /[̀-ͯĀ-ſǍ-ǜ]/;
    for (const p of SPALDING_PHONOGRAMS) {
      expect(speakableSound(p.sounds[0].sound), p.id).not.toMatch(diacritic);
    }
  });
});

describe('rule challenges', () => {
  it('have a correct answer among the choices that spells the full word', () => {
    for (const c of RULE_CHALLENGES) {
      expect(c.choices, c.id).toContain(c.correct);
      expect(`${c.wordPrefix}${c.correct}${c.wordSuffix}`, c.id).toBe(c.fullWord);
    }
  });

  it('map to a known phonogram so mastery can be recorded', () => {
    const letters = new Set(SPALDING_PHONOGRAMS.map(p => p.letters));
    for (const c of RULE_CHALLENGES) expect(letters.has(c.correct), c.id).toBe(true);
  });
});
