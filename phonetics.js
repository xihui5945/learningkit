// Maps Spalding sound notation to text that Web Speech Synthesis pronounces
// as the isolated sound (rather than reading diacritics or slashes aloud).
export const SOUND_PRONUNCIATIONS = Object.freeze({
  // Vowels
  "ă": "aah",
  "ā": "ay",
  "ah": "ah",
  "ĕ": "eh",
  "ē": "ee",
  "ǐ": "ih",
  "ī": "eye",
  "ŏ": "aww",
  "ō": "oh",
  "oo": "ooh",
  "oo (long)": "ooh",
  "oo (short)": "uh",
  "ŭ": "uh",
  "ū": "you",
  // Consonants & digraphs
  "c": "k",
  "qu": "kw",
  "x": "ks",
  "th (unvoiced)": "th",
  "th (voiced)": "th",
  "wor": "wer",
  "oi": "oy",
  "au": "aw",
  "igh": "eye",
  "ĕd": "ed"
});

/** Returns the speakable form of a Spalding sound string (falls back to the raw sound). */
export function speakableSound(sound) {
  if (typeof sound !== 'string' || sound.length === 0) return '';
  return SOUND_PRONUNCIATIONS[sound] ?? sound;
}

/** Comparison key: two sounds with the same key are heard as the same sound by a child. */
export function soundKey(sound) {
  return speakableSound(sound).toLowerCase();
}
