// Converts the dataset's IPA (broad, partly British notation) into the
// en-US phone set Azure AI Speech accepts in <phoneme alphabet="ipa">.
// Pure functions only, so they can be unit-tested without network access.

/** Symbols Azure's en-US voices accept (single code points; diphthongs are sequences of these). */
export const EN_US_SYMBOLS = new Set([
  'ɑ', 'æ', 'ʌ', 'ɔ', 'ə', 'ɛ', 'ɝ', 'ɪ', 'i', 'ʊ', 'u', 'a', 'e', 'o',
  'b', 'd', 'ð', 'f', 'ɡ', 'h', 'j', 'k', 'l', 'm', 'n', 'ŋ', 'p', 'ɹ', 's', 'ʃ', 't', 'θ', 'v', 'w', 'z', 'ʒ',
  'ˈ', // primary stress mark
  'ː'  // length mark (accepted by Azure; used only via TUNING)
]);

/** Second voice used where Jenny's American vowels/fricatives failed by ear. */
export const BRITISH_VOICE = 'en-GB-SoniaNeural';

// Order matters: multi-character rules run before single-character ones.
const RULES = [
  [/ɜːr|ɜr|ɜː/g, 'ɝ'],   // her, first, nurse (r-coloured vowel)
  [/ɒ/g, 'ɑ'],            // British "odd" vowel → American
  [/ː/g, ''],             // en-US voices do not use length marks
  [/r/g, 'ɹ'],            // ASCII r → English approximant
  [/g/g, 'ɡ']             // ASCII g → IPA script g
];

export function toAzureIpa(ipa) {
  if (typeof ipa !== 'string' || ipa.trim() === '') {
    throw new Error('toAzureIpa: ipa must be a non-empty string');
  }
  return RULES.reduce((out, [re, rep]) => out.replace(re, rep), ipa.trim().normalize('NFC'));
}

/** Returns any symbols Azure's en-US phone set would reject. */
export function unsupportedSymbols(azureIpa) {
  return [...azureIpa].filter(ch => !EN_US_SYMBOLS.has(ch));
}

const VOWEL_SYMBOLS = new Set(['ɑ', 'æ', 'ʌ', 'ɔ', 'ə', 'ɛ', 'ɝ', 'ɪ', 'i', 'ʊ', 'u', 'a', 'e', 'o']);

/** Speaking rate by sound type (chosen by ear, 2026-11-03): vowels need a slower rate so long vowels aren't clipped. */
export const RATES = Object.freeze({ vowel: '-45%', consonant: '-15%' });

export function rateFor(azureIpa) {
  return [...azureIpa].some(ch => VOWEL_SYMBOLS.has(ch)) ? RATES.vowel : RATES.consonant;
}

/**
 * Per-sound adjustments chosen by ear against the reference video (listening
 * rounds 1–3, 2026-11-03). Keyed by the whole sound's Azure IPA.
 *   ph: phonemes actually sent · rate: speaking rate · voice: voice override.
 */
export const TUNING = Object.freeze({
  b: { ph: 'bə' },          // voiced stops lose voicing alone (b→p); tiny schwa keeps it
  d: { ph: 'də' },
  'ɡ': { ph: 'ɡə' },
  j: { ph: 'jə' },          // consonant y (yet)
  s: { rate: '-45%' },      // "slightly longer"
  m: { rate: '-45%' },
  n: { rate: '-45%' },
  'aɪ': { ph: 'ˈaɪ' },      // stressed, otherwise heard as "eh"/"ay"
  v: { ph: 'və' },          // keeps the buzz
  z: { ph: 'zː', rate: '-30%', voice: BRITISH_VOICE },  // American z came out as s
  u: { ph: 'uː', rate: '-30%', voice: BRITISH_VOICE },  // pure long /uː/; American voices glide it
  'ð': { ph: 'ðː', rate: '-30%', voice: BRITISH_VOICE }, // voiced th (this): buzzier, like z
  'ɛ': { rate: '-15%' },    // short vowels: "short and fast" (full audit, 2026-11-03)
  'ʌ': { rate: '-15%' },
  'ʊ': { rate: '-15%' }
  // Pending decisions: long oo (wobble), ɔ (law), ʒ (vision)
});

/** Resolves what is actually sent for one sound: phonemes, rate and voice. */
export function resolveSound(ipa, defaultVoice) {
  const base = toAzureIpa(ipa);
  const tune = TUNING[base] ?? {};
  return { base, ph: tune.ph ?? base, rate: tune.rate ?? rateFor(base), voice: tune.voice ?? defaultVoice };
}

const escapeXml = s => s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);

/**
 * SSML for one isolated sound. `fallbackText` is spoken only if the voice
 * cannot apply the phoneme (Azure requires element text).
 */
export function buildSsml({ ipa, fallbackText, voice: defaultVoice, rate: rateOverride }) {
  const { ph, rate: tunedRate, voice } = resolveSound(ipa, defaultVoice);
  const rate = rateOverride ?? tunedRate;
  const bad = unsupportedSymbols(ph);
  if (bad.length) throw new Error(`buildSsml: unsupported IPA symbol(s) ${bad.join(' ')} in "${ph}"`);
  if (!/^[a-z]{2}-[A-Z]{2}-[A-Za-z0-9]+Neural$/.test(voice ?? '')) throw new Error(`buildSsml: invalid voice name "${voice}"`);
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${voice.slice(0, 5)}">` +
    `<voice name="${voice}"><prosody rate="${escapeXml(rate)}">` +
    `<phoneme alphabet="ipa" ph="${escapeXml(ph)}">${escapeXml(fallbackText || 'sound')}</phoneme>` +
    `</prosody></voice></speak>`
  );
}

/** Clip file for one distinct sound, shared by every row that sends the same voice, rate and phonemes. */
export function soundFileName(soundId) {
  if (!/^[0-9a-f]{10}$/.test(soundId)) throw new Error(`soundFileName: unexpected sound id "${soundId}"`);
  return `sound-${soundId}.mp3`;
}

export const SOUND_FILE_PATTERN = /^sound-[0-9a-f]{10}\.mp3$/;
