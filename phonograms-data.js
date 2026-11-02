// Complete 70 Spalding Phonograms Dataset
// Directly transcribed and aligned with the 5-sheet Spalding Support Sheets

export const PHONOGRAM_CATEGORIES = [
  { id: "all", label: "🌟 All 70 Phonograms", count: 70 },
  { id: "single", label: "🔤 Basic 26 (a-z)", count: 26 },
  { id: "multi_core", label: "✨ Core Digraphs", count: 20 },
  { id: "rules", label: "📏 Word Ending Rules", count: 10 },
  { id: "advanced", label: "🏆 Advanced Multi-Letter", count: 14 }
];

export const SPALDING_PHONOGRAMS = [
  // ================= PAGE 1: BASIC 26 (A-Z + QU) =================
  {
    id: "a",
    letters: "a",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "ă", ipa: "æ", example: "apple", icon: "🍎", note: "short a (most common)" },
      { sound: "ā", ipa: "eɪ", example: "navy", icon: "⛵", note: "long a (open syllable)" },
      { sound: "ah", ipa: "ɑː", example: "father", icon: "👨", note: "broad a" }
    ]
  },
  {
    id: "b",
    letters: "b",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "b", ipa: "b", example: "boat", icon: "🚤", note: "single consonant sound" }
    ]
  },
  {
    id: "c",
    letters: "c",
    category: "single",
    page: 1,
    rule: "c says /s/ before e, i, or y",
    sounds: [
      { sound: "k", ipa: "k", example: "cat", icon: "🐱", note: "hard sound (most common)" },
      { sound: "s", ipa: "s", example: "cent", icon: "🪙", note: "soft sound before e, i, y" }
    ]
  },
  {
    id: "d",
    letters: "d",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "d", ipa: "d", example: "dog", icon: "🐶", note: "single consonant sound" }
    ]
  },
  {
    id: "e",
    letters: "e",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "ĕ", ipa: "ɛ", example: "elephant", icon: "🐘", note: "short e" },
      { sound: "ē", ipa: "iː", example: "me", icon: "🙋", note: "long e" }
    ]
  },
  {
    id: "f",
    letters: "f",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "f", ipa: "f", example: "fish", icon: "🐟", note: "single consonant sound" }
    ]
  },
  {
    id: "g",
    letters: "g",
    category: "single",
    page: 1,
    rule: "g may say /j/ before e, i, or y",
    sounds: [
      { sound: "g", ipa: "ɡ", example: "goat", icon: "🐐", note: "hard g (most common)" },
      { sound: "j", ipa: "dʒ", example: "gem", icon: "💎", note: "soft g before e, i, y" }
    ]
  },
  {
    id: "h",
    letters: "h",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "h", ipa: "h", example: "house", icon: "🏠", note: "aspirated sound" }
    ]
  },
  {
    id: "i",
    letters: "i",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "ǐ", ipa: "ɪ", example: "it", icon: "🎯", note: "short i" },
      { sound: "ī", ipa: "aɪ", example: "ice", icon: "🧊", note: "long i" }
    ]
  },
  {
    id: "j",
    letters: "j",
    category: "single",
    page: 1,
    rule: "English words do not end in j",
    sounds: [
      { sound: "j", ipa: "dʒ", example: "jam", icon: "🍓", note: "single consonant sound" }
    ]
  },
  {
    id: "k",
    letters: "k",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "k", ipa: "k", example: "kite", icon: "🪁", note: "single consonant sound" }
    ]
  },
  {
    id: "l",
    letters: "l",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "l", ipa: "l", example: "lizard", icon: "🦎", note: "liquid consonant" }
    ]
  },
  {
    id: "m",
    letters: "m",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "m", ipa: "m", example: "mat", icon: "🧘", note: "nasal consonant" }
    ]
  },
  {
    id: "n",
    letters: "n",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "n", ipa: "n", example: "nice", icon: "😊", note: "nasal consonant" }
    ]
  },
  {
    id: "o",
    letters: "o",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "ŏ", ipa: "ɒ", example: "odd", icon: "❓", note: "short o" },
      { sound: "ō", ipa: "oʊ", example: "open", icon: "🚪", note: "long o" },
      { sound: "oo", ipa: "uː", example: "do", icon: "🏃", note: "broad o" }
    ]
  },
  {
    id: "p",
    letters: "p",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "p", ipa: "p", example: "pot", icon: "🍲", note: "stop consonant" }
    ]
  },
  {
    id: "qu",
    letters: "qu",
    category: "single",
    page: 1,
    rule: "q is always written with u; u is not considered a vowel here",
    sounds: [
      { sound: "qu", ipa: "kw", example: "quail", icon: "🐦", note: "blend /kw/" }
    ]
  },
  {
    id: "r",
    letters: "r",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "r", ipa: "r", example: "rat", icon: "🐀", note: "consonant sound" }
    ]
  },
  {
    id: "s",
    letters: "s",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "s", ipa: "s", example: "snail", icon: "🐌", note: "unvoiced s (most common)" },
      { sound: "z", ipa: "z", example: "as", icon: "⚡", note: "voiced z" }
    ]
  },
  {
    id: "t",
    letters: "t",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "t", ipa: "t", example: "tiger", icon: "🐯", note: "stop consonant" }
    ]
  },
  {
    id: "u",
    letters: "u",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "ŭ", ipa: "ʌ", example: "up", icon: "⬆️", note: "short u" },
      { sound: "ū", ipa: "juː", example: "unicorn", icon: "🦄", note: "long u" },
      { sound: "oo", ipa: "ʊ", example: "put", icon: "📥", note: "broad u" }
    ]
  },
  {
    id: "v",
    letters: "v",
    category: "single",
    page: 1,
    rule: "English words do not end in v",
    sounds: [
      { sound: "v", ipa: "v", example: "van", icon: "🚐", note: "voiced fricative" }
    ]
  },
  {
    id: "w",
    letters: "w",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "w", ipa: "w", example: "wig", icon: "💇", note: "glide consonant" }
    ]
  },
  {
    id: "x",
    letters: "x",
    category: "single",
    page: 1,
    rule: "never says /ks/ at the start of an English word",
    sounds: [
      { sound: "ks", ipa: "ks", example: "box", icon: "📦", note: "compound /ks/" }
    ]
  },
  {
    id: "y",
    letters: "y",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "y", ipa: "j", example: "yet", icon: "⏳", note: "consonant y" },
      { sound: "ǐ", ipa: "ɪ", example: "gym", icon: "🏋️", note: "short i sound" },
      { sound: "ī", ipa: "aɪ", example: "my", icon: "🪞", note: "long i sound" }
    ]
  },
  {
    id: "z",
    letters: "z",
    category: "single",
    page: 1,
    rule: null,
    sounds: [
      { sound: "z", ipa: "z", example: "zoo", icon: "🦁", note: "voiced fricative" }
    ]
  },

  // ================= PAGE 2: MULTI-LETTER (SET 1) =================
  {
    id: "sh",
    letters: "sh",
    category: "multi_core",
    page: 2,
    rule: "it can start and end a word",
    sounds: [
      { sound: "sh", ipa: "ʃ", example: "ship", icon: "🚢", note: "at beginning" },
      { sound: "sh", ipa: "ʃ", example: "fish", icon: "🐠", note: "at end" }
    ]
  },
  {
    id: "ee",
    letters: "ee",
    category: "multi_core",
    page: 2,
    rule: "double e always says /ē/",
    sounds: [
      { sound: "ē", ipa: "iː", example: "tree", icon: "🌳", note: "always long e" }
    ]
  },
  {
    id: "th",
    letters: "th",
    category: "multi_core",
    page: 2,
    rule: null,
    sounds: [
      { sound: "th (unvoiced)", ipa: "θ", example: "three", icon: "3️⃣", note: "unvoiced puff" },
      { sound: "th (voiced)", ipa: "ð", example: "this", icon: "👉", note: "voiced vibration" }
    ]
  },
  {
    id: "oo",
    letters: "oo",
    category: "multi_core",
    page: 2,
    rule: null,
    sounds: [
      { sound: "oo (long)", ipa: "uː", example: "boot", icon: "🥾", note: "long sound" },
      { sound: "oo (short)", ipa: "ʊ", example: "foot", icon: "🦶", note: "short sound" }
    ]
  },
  {
    id: "ow",
    letters: "ow",
    category: "multi_core",
    page: 2,
    rule: null,
    sounds: [
      { sound: "ow", ipa: "aʊ", example: "how", icon: "❓", note: "ow sound" },
      { sound: "ō", ipa: "oʊ", example: "low", icon: "📉", note: "long o sound" }
    ]
  },
  {
    id: "ou",
    letters: "ou",
    category: "multi_core",
    page: 2,
    rule: "that may not be used at the end of a word",
    sounds: [
      { sound: "ow", ipa: "aʊ", example: "found", icon: "🔍", note: "1st sound" },
      { sound: "ō", ipa: "oʊ", example: "soul", icon: "🕊️", note: "2nd sound" },
      { sound: "oo", ipa: "uː", example: "you", icon: "🫵", note: "3rd sound" },
      { sound: "ŭ", ipa: "ʌ", example: "country", icon: "🌄", note: "4th sound" }
    ]
  },
  {
    id: "ar",
    letters: "ar",
    category: "multi_core",
    page: 2,
    rule: "of car",
    sounds: [
      { sound: "ar", ipa: "ɑːr", example: "car", icon: "🚗", note: "ar of car" }
    ]
  },
  {
    id: "ea",
    letters: "ea",
    category: "multi_core",
    page: 2,
    rule: null,
    sounds: [
      { sound: "ē", ipa: "iː", example: "eat", icon: "🍽️", note: "1st sound" },
      { sound: "ĕ", ipa: "ɛ", example: "head", icon: "🗣️", note: "2nd sound" },
      { sound: "ā", ipa: "eɪ", example: "break", icon: "💥", note: "3rd sound" }
    ]
  },
  {
    id: "er",
    letters: "er",
    category: "multi_core",
    page: 2,
    rule: "the er of her (most common)",
    sounds: [
      { sound: "er", ipa: "ɜːr", example: "her", icon: "👧", note: "er of her" }
    ]
  },
  {
    id: "ir",
    letters: "ir",
    category: "multi_core",
    page: 2,
    rule: "the ir of first",
    sounds: [
      { sound: "ir", ipa: "ɜːr", example: "first", icon: "🥇", note: "ir of first" }
    ]
  },
  {
    id: "ur",
    letters: "ur",
    category: "multi_core",
    page: 2,
    rule: "the ur of nurse",
    sounds: [
      { sound: "ur", ipa: "ɜːr", example: "nurse", icon: "👩‍⚕️", note: "ur of nurse" }
    ]
  },
  {
    id: "ear",
    letters: "ear",
    category: "multi_core",
    page: 2,
    rule: "the ear of early",
    sounds: [
      { sound: "er", ipa: "ɜːr", example: "early", icon: "⏰", note: "ear of early" }
    ]
  },
  {
    id: "or",
    letters: "or",
    category: "multi_core",
    page: 2,
    rule: "or of for",
    sounds: [
      { sound: "or", ipa: "ɔːr", example: "for", icon: "🎁", note: "or sound" }
    ]
  },
  {
    id: "wor",
    letters: "wor",
    category: "multi_core",
    page: 2,
    rule: "wor of work",
    sounds: [
      { sound: "wor", ipa: "wɜːr", example: "work", icon: "💼", note: "wor of work" }
    ]
  },
  {
    id: "ay",
    letters: "ay",
    category: "rules",
    page: 2,
    rule: "that can end a word",
    sounds: [
      { sound: "ā", ipa: "eɪ", example: "day", icon: "☀️", note: "can end a word" }
    ]
  },
  {
    id: "ai",
    letters: "ai",
    category: "rules",
    page: 2,
    rule: "that cannot end a word",
    sounds: [
      { sound: "ā", ipa: "eɪ", example: "paint", icon: "🎨", note: "cannot end a word" }
    ]
  },
  {
    id: "eigh",
    letters: "eigh",
    category: "advanced",
    page: 2,
    rule: "four-letter ā of eight",
    sounds: [
      { sound: "ā", ipa: "eɪ", example: "eight", icon: "8️⃣", note: "of eight" }
    ]
  },

  // ================= PAGE 3: MULTI-LETTER (SET 2) =================
  {
    id: "oy",
    letters: "oy",
    category: "rules",
    page: 3,
    rule: "that can end a word",
    sounds: [
      { sound: "oy", ipa: "ɔɪ", example: "boy", icon: "👦", note: "can end a word" }
    ]
  },
  {
    id: "oi",
    letters: "oi",
    category: "rules",
    page: 3,
    rule: "that cannot end a word",
    sounds: [
      { sound: "oi", ipa: "ɔɪ", example: "point", icon: "☝️", note: "cannot end a word" }
    ]
  },
  {
    id: "ng",
    letters: "ng",
    category: "multi_core",
    page: 3,
    rule: null,
    sounds: [
      { sound: "ng", ipa: "ŋ", example: "rang", icon: "🔔", note: "nasal sound" }
    ]
  },
  {
    id: "ch",
    letters: "ch",
    category: "multi_core",
    page: 3,
    rule: null,
    sounds: [
      { sound: "ch", ipa: "tʃ", example: "much", icon: "➕", note: "1st sound" },
      { sound: "k", ipa: "k", example: "school", icon: "🏫", note: "2nd sound (Greek)" },
      { sound: "sh", ipa: "ʃ", example: "chef", icon: "👨‍🍳", note: "3rd sound (French)" }
    ]
  },
  {
    id: "wh",
    letters: "wh",
    category: "multi_core",
    page: 3,
    rule: null,
    sounds: [
      { sound: "wh", ipa: "w", example: "when", icon: "🕒", note: "aspirated w" }
    ]
  },
  {
    id: "ey",
    letters: "ey",
    category: "multi_core",
    page: 3,
    rule: null,
    sounds: [
      { sound: "ā", ipa: "eɪ", example: "they", icon: "👥", note: "1st sound" },
      { sound: "ē", ipa: "iː", example: "key", icon: "🔑", note: "2nd sound" },
      { sound: "ǐ", ipa: "ɪ", example: "valley", icon: "🏞️", note: "3rd sound" }
    ]
  },
  {
    id: "au",
    letters: "au",
    category: "rules",
    page: 3,
    rule: "that cannot end a word",
    sounds: [
      { sound: "au", ipa: "ɔː", example: "author", icon: "✍️", note: "cannot end a word" }
    ]
  },
  {
    id: "aw",
    letters: "aw",
    category: "rules",
    page: 3,
    rule: "that can end a word",
    sounds: [
      { sound: "aw", ipa: "ɔː", example: "law", icon: "⚖️", note: "can end a word" }
    ]
  },
  {
    id: "wr",
    letters: "wr",
    category: "advanced",
    page: 3,
    rule: "two-letter r",
    sounds: [
      { sound: "r", ipa: "r", example: "wrap", icon: "🎁", note: "silent w" }
    ]
  },
  {
    id: "ck",
    letters: "ck",
    category: "rules",
    page: 3,
    rule: "may be used only after a single vowel",
    sounds: [
      { sound: "k", ipa: "k", example: "duck", icon: "🦆", note: "back, neck, kick, rock, duck" }
    ]
  },
  {
    id: "oa",
    letters: "oa",
    category: "multi_core",
    page: 3,
    rule: "of boat (cannot end a word)",
    sounds: [
      { sound: "ō", ipa: "oʊ", example: "boat", icon: "⛵", note: "of boat" }
    ]
  },
  {
    id: "oe",
    letters: "oe",
    category: "multi_core",
    page: 3,
    rule: "of toe (can end a word)",
    sounds: [
      { sound: "ō", ipa: "oʊ", example: "toe", icon: "🦶", note: "of toe" }
    ]
  },
  {
    id: "ui",
    letters: "ui",
    category: "rules",
    page: 3,
    rule: "that cannot end a word",
    sounds: [
      { sound: "oo", ipa: "uː", example: "fruit", icon: "🍇", note: "1st sound" },
      { sound: "ū", ipa: "juː", example: "suit", icon: "👔", note: "2nd sound" }
    ]
  },
  {
    id: "ew",
    letters: "ew",
    category: "rules",
    page: 3,
    rule: "that can end a word",
    sounds: [
      { sound: "oo", ipa: "uː", example: "grew", icon: "🌱", note: "1st sound" },
      { sound: "ū", ipa: "juː", example: "few", icon: "🤏", note: "2nd sound" }
    ]
  },
  {
    id: "igh",
    letters: "igh",
    category: "advanced",
    page: 3,
    rule: "three-letter ī of sigh",
    sounds: [
      { sound: "ī", ipa: "aɪ", example: "sigh", icon: "😮‍💨", note: "three-letter i" }
    ]
  },
  {
    id: "dge",
    letters: "dge",
    category: "rules",
    page: 3,
    rule: "may be used only after a single vowel",
    sounds: [
      { sound: "j", ipa: "dʒ", example: "bridge", icon: "🌉", note: "badge, edge, bridge, dodge, fudge" }
    ]
  },
  {
    id: "ed",
    letters: "ed",
    category: "advanced",
    page: 3,
    rule: "past tense suffix",
    sounds: [
      { sound: "ĕd", ipa: "ɪd", example: "graded", icon: "📝", note: "1st sound (after t or d)" },
      { sound: "d", ipa: "d", example: "loved", icon: "❤️", note: "2nd sound (voiced)" },
      { sound: "t", ipa: "t", example: "wrecked", icon: "💥", note: "3rd sound (unvoiced)" }
    ]
  },
  {
    id: "ph",
    letters: "ph",
    category: "advanced",
    page: 3,
    rule: "two-letter f used in words of Greek origin",
    sounds: [
      { sound: "f", ipa: "f", example: "phone", icon: "📱", note: "Greek root" }
    ]
  },

  // ================= PAGE 4: MULTI-LETTER (SET 3) =================
  {
    id: "gu",
    letters: "gu",
    category: "advanced",
    page: 4,
    rule: null,
    sounds: [
      { sound: "g", ipa: "ɡ", example: "guess", icon: "❓", note: "hard g sound" }
    ]
  },
  {
    id: "ei",
    letters: "ei",
    category: "advanced",
    page: 4,
    rule: null,
    sounds: [
      { sound: "ē", ipa: "iː", example: "conceit", icon: "🦚", note: "1st sound" },
      { sound: "ā", ipa: "eɪ", example: "veil", icon: "👰", note: "2nd sound" },
      { sound: "ǐ", ipa: "ɪ", example: "forfeit", icon: "🏳️", note: "3rd sound" }
    ]
  },
  {
    id: "kn",
    letters: "kn",
    category: "advanced",
    page: 4,
    rule: "it can start a word",
    sounds: [
      { sound: "n", ipa: "n", example: "knot", icon: "🪢", note: "two-letter n" }
    ]
  },
  {
    id: "gn",
    letters: "gn",
    category: "advanced",
    page: 4,
    rule: "it can start and end a word",
    sounds: [
      { sound: "n", ipa: "n", example: "gnat", icon: "🦟", note: "start of word" },
      { sound: "n", ipa: "n", example: "sign", icon: "🪧", note: "end of word" }
    ]
  },
  {
    id: "ti",
    letters: "ti",
    category: "advanced",
    page: 4,
    rule: "most commonly used 'sh'",
    sounds: [
      { sound: "sh", ipa: "ʃ", example: "nation", icon: "🌎", note: "most common sh" }
    ]
  },
  {
    id: "ci",
    letters: "ci",
    category: "advanced",
    page: 4,
    rule: "least commonly used 'sh'",
    sounds: [
      { sound: "sh", ipa: "ʃ", example: "facial", icon: "🧖", note: "least common sh" }
    ]
  },
  {
    id: "si",
    letters: "si",
    category: "advanced",
    page: 4,
    rule: null,
    sounds: [
      { sound: "sh", ipa: "ʃ", example: "session", icon: "⏱️", note: "1st sound (unvoiced)" },
      { sound: "zh", ipa: "ʒ", example: "vision", icon: "👁️", note: "2nd sound (voiced)" }
    ]
  },
  {
    id: "ie",
    letters: "ie",
    category: "advanced",
    page: 4,
    rule: null,
    sounds: [
      { sound: "ē", ipa: "iː", example: "field", icon: "🌾", note: "1st sound" },
      { sound: "ī", ipa: "aɪ", example: "pie", icon: "🥧", note: "2nd sound" },
      { sound: "ǐ", ipa: "ɪ", example: "lilies", icon: "🪷", note: "3rd sound" }
    ]
  },
  {
    id: "ough",
    letters: "ough",
    category: "advanced",
    page: 4,
    rule: "six-sound ough",
    sounds: [
      { sound: "ō", ipa: "oʊ", example: "though", icon: "💭", note: "1st sound (ō)" },
      { sound: "oo", ipa: "uː", example: "through", icon: "🚪", note: "2nd sound (oo)" },
      { sound: "ŭf", ipa: "ʌf", example: "rough", icon: "🪨", note: "3rd sound (ŭf)" },
      { sound: "ŏf", ipa: "ɒf", example: "cough", icon: "😷", note: "4th sound (ŏf)" },
      { sound: "aw", ipa: "ɔː", example: "thought", icon: "💡", note: "5th sound (aw)" },
      { sound: "ow", ipa: "aʊ", example: "drought", icon: "☀️", note: "6th sound (ow)" }
    ]
  }
];

// Curated toddler-friendly rule challenges for Rule Detective game mode
export const RULE_CHALLENGES = [
  {
    id: "ay_ai_day",
    prompt: "A sunny...",
    wordPrefix: "d",
    wordSuffix: "",
    gapLocation: "end",
    choices: ["ay", "ai"],
    correct: "ay",
    fullWord: "day",
    hint: "At the end of a word, we use 'ay'!",
    ruleNote: "ay that can end a word"
  },
  {
    id: "ay_ai_paint",
    prompt: "Splash the...",
    wordPrefix: "p",
    wordSuffix: "nt",
    gapLocation: "middle",
    choices: ["ai", "ay"],
    correct: "ai",
    fullWord: "paint",
    hint: "Inside a word, we use 'ai'!",
    ruleNote: "ai that cannot end a word"
  },
  {
    id: "oy_oi_boy",
    prompt: "A happy...",
    wordPrefix: "b",
    wordSuffix: "",
    gapLocation: "end",
    choices: ["oy", "oi"],
    correct: "oy",
    fullWord: "boy",
    hint: "'oy' is used at the end of a word!",
    ruleNote: "oy that can end a word"
  },
  {
    id: "oy_oi_point",
    prompt: "Use your finger to...",
    wordPrefix: "p",
    wordSuffix: "nt",
    gapLocation: "middle",
    choices: ["oi", "oy"],
    correct: "oi",
    fullWord: "point",
    hint: "'oi' cannot end an English word!",
    ruleNote: "oi that cannot end a word"
  },
  {
    id: "ck_k_duck",
    prompt: "Quack goes the...",
    wordPrefix: "du",
    wordSuffix: "",
    gapLocation: "end",
    choices: ["ck", "k"],
    correct: "ck",
    fullWord: "duck",
    hint: "'ck' is used right after a single short vowel!",
    ruleNote: "ck used only after a single vowel"
  },
  {
    id: "dge_j_bridge",
    prompt: "Cross over the...",
    wordPrefix: "bri",
    wordSuffix: "",
    gapLocation: "end",
    choices: ["dge", "ge"],
    correct: "dge",
    fullWord: "bridge",
    hint: "'dge' is used right after a single short vowel!",
    ruleNote: "dge used only after a single vowel"
  },
  {
    id: "kn_n_knot",
    prompt: "Tie a tight...",
    wordPrefix: "",
    wordSuffix: "ot",
    gapLocation: "start",
    choices: ["kn", "gn"],
    correct: "kn",
    fullWord: "knot",
    hint: "Two-letter n that starts a word like knot!",
    ruleNote: "kn can only start a word"
  },
  {
    id: "aw_au_saw",
    prompt: "Cut wood with a...",
    wordPrefix: "s",
    wordSuffix: "",
    gapLocation: "end",
    choices: ["aw", "au"],
    correct: "aw",
    fullWord: "saw",
    hint: "'aw' can end an English word!",
    ruleNote: "aw that can end a word"
  }
];
