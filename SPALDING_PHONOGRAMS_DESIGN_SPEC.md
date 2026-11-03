# PhonoLand: Spalding Phonograms App Design Specification

> **Pedagogical Game Design Document for Preschoolers (Ages 3–5)**  
> Aligned with the 70 Spalding Multi-Letter Phonograms Support Sheets  
> **Status**: Validated Interactive Prototype v1.0.0

---

## 1. Executive Summary

The **Spalding Method** is one of the world's most rigorous phonics foundations. Traditional phonics apps fail to teach Spalding properly because they:
1. Teach letter names (*"Ay, Bee, See"*) instead of isolated sounds (*"/ă/, /b/, /k/"*).
2. Teach only 1 sound per letter rather than all sounds in frequency order (e.g. `a` says */ă/, /ā/, /ah/*; `c` says */k/, /s/*; `ough` has 6 distinct sounds).
3. Overlook critical word-positioning rules (e.g. *"English words do not end in i, u, v, or j"*, *"ck only after a single vowel"*).

**PhonoLand** solves this by packaging the 70 phonograms into 5 playful, toddler-friendly game loops with multi-tap tactile cadences and non-punitive feedback.

---

## 2. Core Game Modes

| Mode | Pedagogical Target | Toddler Interaction |
| :--- | :--- | :--- |
| **1. Sound Studio** | Multi-Sound Frequency Chant | Tapping giant card cycles through sounds 1, 2, 3 with icon pops; "Sing Chant" button auto-chants in cadence. |
| **2. Feed Chompy** | Auditory Discrimination | Monster asks for sound (*"Feed me /sh/!"*); child drags/taps snack card; chomping animations + confetti. |
| **3. Bubble Pop** | Reaction & Rhythm | Soap bubbles drift upward; child pops target phonograms; plays xylophone chord scales. |
| **4. Rule Detective** | Spelling & Position Rules | Bridge builder where child solves `d - a - [ ? ]` choosing `ay` over `ai` based on the ending rule. |
| **5. Support Guide** | Teacher / Parent Reference | Full 70 phonogram grid with audio buttons, search filter, and printable layout. |

---

## 3. Curriculum Reference Table (All 70 Phonograms)

### Page 1: Basic 26 Alphabet (a–z + qu)
| Letter | Sounds (Frequency Order) | Reference Words (from Sheet) | Spalding Rule / Note |
| :--- | :--- | :--- | :--- |
| **a** | `ă / ā / ah` | ă – apple, ā – navy, ah – father | — |
| **b** | `b` | b – boat | — |
| **c** | `k / s` | k – cat, s – cent | c says /s/ before e, i, or y |
| **d** | `d` | d – dog | — |
| **e** | `ĕ / ē` | ĕ – elephant, ē – me | — |
| **f** | `f` | f – fish | — |
| **g** | `g / j` | g – goat, j – gem | g may say /j/ before e, i, or y |
| **h** | `h` | h – house | — |
| **i** | `ǐ / ī` | ǐ – it, ī – ice | — |
| **j** | `j` | j – jam | English words do not end in j |
| **k** | `k` | k – kite | — |
| **l** | `l` | l – lizard | — |
| **m** | `m` | m – mat | — |
| **n** | `n` | n – nice | — |
| **o** | `ŏ / ō / oo` | ŏ – odd, ō – open, oo – do | — |
| **p** | `p` | p – pot | — |
| **qu** | `qu` | qu – quail | q is always written with u; u is not considered a vowel here |
| **r** | `r` | r – rat | — |
| **s** | `s / z` | s – snail, z – as | — |
| **t** | `t` | t – tiger | — |
| **u** | `ŭ / ū / oo` | ŭ – up, ū – unicorn, oo – put | — |
| **v** | `v` | v – van | English words do not end in v |
| **w** | `w` | w – wig | — |
| **x** | `ks` | ks – box | never says /ks/ at the start of an English word |
| **y** | `y / ǐ / ī` | y – yet, ǐ – gym, ī – my | — |
| **z** | `z` | z – zoo | — |

### Pages 2–4: Multi-Letter Phonograms
| Letter | Sounds (Frequency Order) | Reference Words (from Sheet) | Spalding Rule / Note |
| :--- | :--- | :--- | :--- |
| **sh** | `sh / sh` | sh – ship, sh – fish | it can start and end a word |
| **ee** | `ē` | ē – tree | double e always says /ē/ |
| **th** | `th (unvoiced) / th (voiced)` | th (unvoiced) – three, th (voiced) – this | — |
| **oo** | `oo (long) / oo (short)` | oo (long) – boot, oo (short) – foot | — |
| **ow** | `ow / ō` | ow – how, ō – low | — |
| **ou** | `ow / ō / oo / ŭ` | ow – found, ō – soul, oo – you, ŭ – country | that may not be used at the end of a word |
| **ar** | `ar` | ar – car | of car |
| **ea** | `ē / ĕ / ā` | ē – eat, ĕ – head, ā – break | — |
| **er** | `er` | er – her | the er of her (most common) |
| **ir** | `ir` | ir – first | the ir of first |
| **ur** | `ur` | ur – nurse | the ur of nurse |
| **ear** | `er` | er – early | the ear of early |
| **or** | `or` | or – for | or of for |
| **wor** | `wor` | wor – work | wor of work |
| **ay** | `ā` | ā – day | that can end a word |
| **ai** | `ā` | ā – paint | that cannot end a word |
| **eigh** | `ā` | ā – eight | four-letter ā of eight |
| **oy** | `oy` | oy – boy | that can end a word |
| **oi** | `oi` | oi – point | that cannot end a word |
| **ng** | `ng` | ng – rang | — |
| **ch** | `ch / k / sh` | ch – much, k – school, sh – chef | — |
| **wh** | `wh` | wh – when | — |
| **ey** | `ā / ē / ǐ` | ā – they, ē – key, ǐ – valley | — |
| **au** | `au` | au – author | that cannot end a word |
| **aw** | `aw` | aw – law | that can end a word |
| **wr** | `r` | r – wrap | two-letter r |
| **ck** | `k` | k – duck | may be used only after a single vowel |
| **oa** | `ō` | ō – boat | of boat (cannot end a word) |
| **oe** | `ō` | ō – toe | of toe (can end a word) |
| **ui** | `oo / ū` | oo – fruit, ū – suit | that cannot end a word |
| **ew** | `oo / ū` | oo – grew, ū – few | that can end a word |
| **igh** | `ī` | ī – sigh | three-letter ī of sigh |
| **dge** | `j` | j – bridge | may be used only after a single vowel |
| **ed** | `ĕd / d / t` | ĕd – graded, d – loved, t – wrecked | past tense suffix |
| **ph** | `f` | f – phone | two-letter f used in words of Greek origin |
| **gu** | `g` | g – guess | — |
| **ei** | `ē / ā / ǐ` | ē – conceit, ā – veil, ǐ – forfeit | — |
| **kn** | `n` | n – knot | it can start a word |
| **gn** | `n / n` | n – gnat, n – sign | it can start and end a word |
| **ti** | `sh` | sh – nation | most commonly used 'sh' |
| **ci** | `sh` | sh – facial | least commonly used 'sh' |
| **si** | `sh / zh` | sh – session, zh – vision | — |
| **ie** | `ē / ī / ǐ` | ē – field, ī – pie, ǐ – lilies | — |
| **ough** | `ō / oo / ŭf / ŏf / aw / ow` | ō – though, oo – through, ŭf – rough, ŏf – cough, aw – thought, ow – drought | six-sound ough |

---

## 4. Technical Architecture
* **Web Audio Procedural Synth**: Zero-dependency synthesis for pops, chimes, chomps, and elastic boings.
* **Preschool Web Speech Engine**: 0.82x speed, natural female/warm voices, customized phonetic IPA replacements.
* **Unambiguous Rounds** (`game-logic.js`): distractors never share the target's sound (e.g. `ai` is never a wrong answer for /ā/ when `ay` is the target).
* **Progress & Mastery** (`progress-store.js`): stars and per-phonogram mastery (0–3 ★) persist in localStorage; Chompy and Bubble Pop follow the selected category and favour unmastered phonograms.
* **Tests**: `npm test` (Vitest) covers round generation, progress persistence and dataset integrity.
* **Offline PWA** (`vite.config.js`, `vite-plugin-pwa`): `npm run build` precaches the app shell, icons and self-hosted Latin fonts (~320 KiB). Installable to the iPad home screen; updates install silently and apply on next launch.
* **Offline-safe speech** (`voice-select.js`): on-device voices are preferred over cloud voices (Chrome "Google …", Edge "Online (Natural)"), which fall silent offline.
* **Native wrapper (future)**: can be wrapped in Capacitor for app-store distribution.

---

## 5. Live Prototype Links
* **Live Local Server**: `http://localhost:5173`
* **Shareable Standalone HTML**: `shareable_design_document.html` (can be opened in any browser or printed to PDF)
