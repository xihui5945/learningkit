import { soundKey } from './phonetics.js';

/** Fisher–Yates shuffle; returns a new array. */
export function shuffle(items, rng = Math.random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Picks one item with probability proportional to weightFn(item). */
export function weightedPick(items, weightFn = () => 1, rng = Math.random) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('weightedPick: items must be a non-empty array');
  }
  const weights = items.map(item => Math.max(0, Number(weightFn(item)) || 0));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return items[Math.floor(rng() * items.length)];

  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * True when `candidate` could legitimately answer a prompt for `targetSound`,
 * i.e. any of its sounds is heard the same as the target sound.
 */
export function sharesSound(candidate, targetSound) {
  const key = soundKey(targetSound);
  return candidate.sounds.some(s => soundKey(s.sound) === key);
}

/**
 * Builds a "find the sound" round with exactly one correct answer.
 * Distractors never share the target's primary sound, so a child who picks
 * an alternative spelling of the same sound (ai vs ay) is never marked wrong.
 *
 * @param {object} opts
 * @param {Array}  opts.pool       phonograms the target is drawn from (e.g. current category)
 * @param {Array}  opts.fallback   wider list used to top up distractors when `pool` is too small
 * @param {number} opts.choiceCount total choices including the target (>= 2)
 * @param {Function} [opts.weightFn] target selection weight (e.g. favour weak phonograms)
 * @param {Function} [opts.rng]
 * @returns {{ target: object, targetSound: object, choices: object[] }}
 */
export function buildSoundRound({ pool, fallback = pool, choiceCount, weightFn, rng = Math.random }) {
  if (!Array.isArray(pool) || pool.length === 0) {
    throw new Error('buildSoundRound: pool must be a non-empty array');
  }
  if (!Number.isInteger(choiceCount) || choiceCount < 2) {
    throw new Error('buildSoundRound: choiceCount must be an integer >= 2');
  }

  const target = weightedPick(pool, weightFn, rng);
  const targetSound = target.sounds[0];

  const usedKeys = new Set([soundKey(targetSound.sound)]);
  const distractors = [];
  const tryFill = (candidates) => {
    for (const c of shuffle(candidates, rng)) {
      if (distractors.length >= choiceCount - 1) return;
      if (c.id === target.id || distractors.some(d => d.id === c.id)) continue;
      if (sharesSound(c, targetSound.sound)) continue;
      const key = soundKey(c.sounds[0].sound);
      if (usedKeys.has(key)) continue; // keep distractors audibly distinct from each other
      usedKeys.add(key);
      distractors.push(c);
    }
  };

  tryFill(pool);
  if (distractors.length < choiceCount - 1) tryFill(fallback);
  if (distractors.length < choiceCount - 1) {
    throw new Error('buildSoundRound: not enough distinct-sounding phonograms for distractors');
  }

  return { target, targetSound, choices: shuffle([target, ...distractors], rng) };
}
