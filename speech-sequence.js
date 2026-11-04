// Plays a mix of spoken text and phonogram sound clips in order, e.g.
//   ['Can you feed me', { phonogram, soundIndex: 0 }, '?']
// Pure orchestration: the actual speech/clip players are injected.

const isSoundRef = part => part && typeof part === 'object' && part.phonogram && Number.isInteger(part.soundIndex);

/** Normalises prompt parts into steps, dropping empty or punctuation-only text. */
export function toSteps(parts) {
  if (!Array.isArray(parts)) throw new Error('toSteps: parts must be an array');
  return parts.flatMap(part => {
    if (typeof part === 'string') {
      const text = part.trim();
      return /[\p{L}\p{N}]/u.test(text) ? [{ type: 'text', text }] : [];
    }
    if (isSoundRef(part)) return [{ type: 'sound', phonogram: part.phonogram, soundIndex: part.soundIndex }];
    throw new Error('toSteps: each part must be text or { phonogram, soundIndex }');
  });
}

/**
 * Runs steps sequentially.
 * @param {Array} steps from toSteps()
 * @param {object} io
 * @param {(text: string) => Promise<void>} io.speakText
 * @param {(phonogram, soundIndex) => Promise<boolean>} io.playClip   resolves false if no clip was played
 * @param {(phonogram, soundIndex) => Promise<void>} io.speakSoundFallback  speech-engine version of the sound
 * @param {() => boolean} io.isCancelled
 * @param {(ms: number) => Promise<void>} [io.pause]
 * @param {number} [io.gapMs]  pause between steps
 * @returns {Promise<{ cancelled: boolean }>}
 */
export async function runSequence(steps, { speakText, playClip, speakSoundFallback, isCancelled, pause = ms => new Promise(r => setTimeout(r, ms)), gapMs = 180 }) {
  for (let i = 0; i < steps.length; i++) {
    if (isCancelled()) return { cancelled: true };
    const step = steps[i];
    if (step.type === 'text') {
      await speakText(step.text);
    } else {
      const played = await playClip(step.phonogram, step.soundIndex);
      if (!played && !isCancelled()) await speakSoundFallback(step.phonogram, step.soundIndex);
    }
    if (i < steps.length - 1 && gapMs > 0 && !isCancelled()) await pause(gapMs);
  }
  return { cancelled: isCancelled() };
}
