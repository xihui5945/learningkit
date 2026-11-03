// Chooses a speech voice that works offline. Cloud voices (Chrome's "Google …",
// Edge's "… Online (Natural)") need a network connection and go silent offline,
// so on-device voices always win.

export const PREFERRED_VOICE_NAMES = Object.freeze(['Samantha', 'Karen', 'Victoria', 'Moira', 'Tessa', 'Daniel']);

const isEnglish = v => typeof v?.lang === 'string' && v.lang.toLowerCase().startsWith('en');
const nameRank = v => {
  const i = PREFERRED_VOICE_NAMES.findIndex(n => v.name?.includes(n));
  return i === -1 ? PREFERRED_VOICE_NAMES.length : i;
};

/**
 * Ranking: on-device before cloud, English before other languages,
 * then the preferred child-friendly voice names, then en-US.
 * @param {SpeechSynthesisVoice[]} voices
 * @returns {SpeechSynthesisVoice | null}
 */
export function pickVoice(voices) {
  if (!Array.isArray(voices) || voices.length === 0) return null;
  const score = v => [
    v.localService === false ? 1 : 0,
    isEnglish(v) ? 0 : 1,
    nameRank(v),
    v.lang === 'en-US' ? 0 : 1
  ];
  const compare = (a, b) => {
    const sa = score(a);
    const sb = score(b);
    for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return sa[i] - sb[i];
    return 0;
  };
  return [...voices].sort(compare)[0];
}
