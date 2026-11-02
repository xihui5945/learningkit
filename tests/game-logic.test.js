import { describe, it, expect } from 'vitest';
import { buildSoundRound, shuffle, weightedPick, sharesSound } from '../game-logic.js';
import { soundKey } from '../phonetics.js';
import { SPALDING_PHONOGRAMS } from '../phonograms-data.js';

/** Deterministic PRNG (mulberry32) so failures are reproducible. */
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const byId = id => SPALDING_PHONOGRAMS.find(p => p.id === id);
const categories = ['single', 'multi_core', 'rules', 'advanced'];

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, seeded(1));
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual(input);
  });
});

describe('weightedPick', () => {
  it('never picks zero-weight items when others have weight', () => {
    const rng = seeded(7);
    for (let i = 0; i < 200; i++) {
      expect(weightedPick(['a', 'b'], x => (x === 'a' ? 0 : 1), rng)).toBe('b');
    }
  });

  it('throws on an empty list', () => {
    expect(() => weightedPick([])).toThrow();
  });
});

describe('sharesSound', () => {
  it('treats alternative spellings of /ā/ as the same sound', () => {
    expect(sharesSound(byId('ai'), 'ā')).toBe(true);
    expect(sharesSound(byId('eigh'), 'ā')).toBe(true);
  });

  it('catches secondary sounds (ch can say /k/)', () => {
    expect(sharesSound(byId('ch'), 'k')).toBe(true);
  });
});

describe('buildSoundRound', () => {
  const pools = [['all', SPALDING_PHONOGRAMS], ...categories.map(c => [c, SPALDING_PHONOGRAMS.filter(p => p.category === c)])];

  it.each(pools)('always has exactly one valid answer (%s pool)', (_name, pool) => {
    const rng = seeded(42);
    for (let i = 0; i < 500; i++) {
      for (const choiceCount of [3, 4]) {
        const { target, targetSound, choices } = buildSoundRound({ pool, fallback: SPALDING_PHONOGRAMS, choiceCount, rng });
        expect(choices).toHaveLength(choiceCount);
        expect(pool).toContain(target);
        expect(new Set(choices.map(c => c.id)).size).toBe(choiceCount);

        const valid = choices.filter(c => sharesSound(c, targetSound.sound));
        expect(valid.map(c => c.id)).toEqual([target.id]);

        // distractors are audibly distinct from each other too
        const keys = choices.map(c => soundKey(c.sounds[0].sound));
        expect(new Set(keys).size).toBe(choiceCount);
      }
    }
  });

  it('respects the weight function', () => {
    const pool = SPALDING_PHONOGRAMS;
    const rng = seeded(3);
    for (let i = 0; i < 100; i++) {
      const { target } = buildSoundRound({ pool, choiceCount: 3, weightFn: p => (p.id === 'sh' ? 1 : 0), rng });
      expect(target.id).toBe('sh');
    }
  });

  it('rejects invalid input', () => {
    expect(() => buildSoundRound({ pool: [], choiceCount: 3 })).toThrow();
    expect(() => buildSoundRound({ pool: SPALDING_PHONOGRAMS, choiceCount: 1 })).toThrow();
    expect(() => buildSoundRound({ pool: [byId('ai'), byId('ay')], choiceCount: 3 })).toThrow(/not enough/);
  });
});
