import { speakableSound } from './phonetics.js';
import { pickVoice } from './voice-select.js';
import { ClipLibrary, clipKey } from './clip-library.js';
import { toSteps, runSequence } from './speech-sequence.js';

// Chrome clips the start of an utterance spoken immediately after cancel(); wait this long first.
const CANCEL_SETTLE_MS = 200;

// Speaking styles. Rates were slowed after play-testing ("rules read too fast").
const SOUND_VOICE = { rate: 0.82, pitch: 1.15, gapMs: 300 };    // isolated sounds + reference words (gap lets speech start cleanly after a clip)
const PHRASE_VOICE = { rate: 0.8, pitch: 1.12, gapMs: 250 };    // game prompts and feedback
const TEACHING_VOICE = { rate: 0.7, pitch: 1.1, gapMs: 450 };   // spelling rules and hints
export const PACES = Object.freeze({ phrase: PHRASE_VOICE, teaching: TEACHING_VOICE });

// Audio Engine: Web Audio API Synthesizer & Speech Synthesis for Toddlers

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.speechSynth = window.speechSynthesis || null;
    this.isMuted = false;
    this.mode = 'word'; // 'sound_only' or 'word' (sound + reference word)
    this.voice = null;
    this.speechGeneration = 0; // bumped by stopSpeech() so queued chant steps can tell they were cancelled
    this.sequenceId = 0;       // bumped by every new utterance; older sequences stop at their next step
    this.currentSource = null;
    this.lastCancelAt = 0;

    // Generated clips (see tools/generate-clips.mjs); missing clips fall back to speech.
    this.clips = new ClipLibrary({ baseUrl: new URL('audio/sounds/', document.baseURI).href });
    this.clips.load();

    if (this.speechSynth) {
      // Voice lists load asynchronously in Chrome; re-pick whenever they change
      const refresh = () => { this.voice = pickVoice(this.speechSynth.getVoices()); };
      refresh();
      this.speechSynth.addEventListener?.('voiceschanged', refresh);
    }
  }

  #applyVoice(utterance) {
    if (!this.voice && this.speechSynth) this.voice = pickVoice(this.speechSynth.getVoices());
    if (this.voice) {
      utterance.voice = this.voice;
      utterance.lang = this.voice.lang;
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Web Audio API Procedural Sound Effects ---

  // Bubble pop sound
  playPop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Cheerful chime / success chord
  playChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.46);
    });
  }

  // Soft cartoon boing for gentle incorrect tap
  playBoing() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  // Fun cartoon munch/crunch sound for Chompy the Monster
  playMunch() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Layer 1: Low bite pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);

    // Layer 2: Crunchy noise crackle
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1200;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.11);
  }

  // Fanfare for level complete
  playFanfare() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const chords = [
      [523.25, 659.25], // C5, E5
      [587.33, 739.99], // D5, F#5
      [659.25, 783.99], // E5, G5
      [783.99, 1046.50] // G5, C6
    ];

    chords.forEach((pair, idx) => {
      const now = this.ctx.currentTime + idx * 0.12;
      pair.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
      });
    });
  }

  // --- Speech Synthesis for Spalding Sounds ---

  // Converts phonogram sounds into natural phonetic syllables for Web Speech Synthesis
  getPhoneticPrompt(letters, soundObj) {
    const word = soundObj.example;
    const s = soundObj.sound;

    const spokenSound = speakableSound(s);

    // In toddler mode, speaking the sound followed by the reference word anchors the phoneme perfectly!
    return {
      soundText: spokenSound,
      wordText: word,
      fullText: `${spokenSound}... as in ${word}`
    };
  }

  // --- Utterances: clips for isolated sounds, speech for words and phrases ---

  /** Stops whatever is playing and returns a token for the new utterance. */
  #beginUtterance() {
    this.sequenceId++;
    // Only cancel when something is actually queued: needless cancel() calls make Chrome
    // swallow the beginning of the next utterance.
    if (this.speechSynth && (this.speechSynth.speaking || this.speechSynth.pending)) {
      this.speechSynth.cancel();
      this.lastCancelAt = performance.now();
    }
    this.#stopClip();
    return this.sequenceId;
  }

  #stopClip() {
    if (!this.currentSource) return;
    try { this.currentSource.stop(); } catch { /* already stopped */ }
    this.currentSource = null;
  }

  /** Speaks text and resolves when finished (or on error / safety timeout). */
  async #speakText(text, { rate, pitch }, token) {
    if (this.isMuted || !this.speechSynth) return;
    const sinceCancel = performance.now() - this.lastCancelAt;
    if (sinceCancel < CANCEL_SETTLE_MS) await new Promise(r => setTimeout(r, CANCEL_SETTLE_MS - sinceCancel));
    if (token !== this.sequenceId) return; // superseded while waiting
    return new Promise(resolve => {
      let done = false;
      const finish = () => { if (!done) { done = true; clearTimeout(timer); resolve(); } };
      // Some engines occasionally never fire onend; never let a game wait forever.
      const timer = setTimeout(finish, 4000 + text.length * 150);
      const u = new SpeechSynthesisUtterance(text);
      u.rate = rate;
      u.pitch = pitch;
      u.lang = 'en-US';
      this.#applyVoice(u);
      u.onend = finish;
      u.onerror = finish;
      this.speechSynth.speak(u);
    });
  }

  /** Plays a phonogram sound clip. Resolves true if handled, false if the caller should fall back to speech. */
  async #playClip(phonogram, soundIndex, token) {
    this.init();
    const ctx = this.ctx;
    if (!ctx) return false;
    if (ctx.state !== 'running') {
      try { await ctx.resume(); } catch { /* blocked until a user gesture */ }
      if (ctx.state !== 'running') return false;
    }
    await this.clips.load();
    const key = clipKey(phonogram.id, soundIndex);
    if (!this.clips.has(key)) return false;
    const clip = await this.clips.buffer(key, ctx);
    if (token !== this.sequenceId) return true; // superseded while loading: stay silent
    if (!clip) return false;

    return new Promise(resolve => {
      const src = ctx.createBufferSource();
      src.buffer = clip.buffer;
      src.connect(ctx.destination);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (this.currentSource === src) this.currentSource = null;
        resolve(true);
      };
      const timer = setTimeout(finish, clip.duration * 1000 + 800);
      src.onended = finish;
      this.currentSource = src;
      src.start(0, clip.start, clip.duration); // audible part only
    });
  }

  #speakSoundFallback(phonogram, soundIndex, token) {
    const soundObj = phonogram.sounds[soundIndex] || phonogram.sounds[0];
    return this.#speakText(this.getPhoneticPrompt(phonogram.letters, soundObj).soundText, SOUND_VOICE, token);
  }

  #run(parts, voice, onComplete) {
    if (this.isMuted) {
      onComplete?.({ cancelled: false });
      return;
    }
    const token = this.#beginUtterance();
    runSequence(toSteps(parts), {
      speakText: text => this.#speakText(text, voice, token),
      playClip: (p, i) => this.#playClip(p, i, token),
      speakSoundFallback: (p, i) => this.#speakSoundFallback(p, i, token),
      isCancelled: () => token !== this.sequenceId,
      gapMs: voice.gapMs
    }).then(result => onComplete?.(result), () => onComplete?.({ cancelled: true }));
  }

  /** A phonogram sound (clip), followed by its reference word in "Sound + Word" mode. */
  speakSound(phonogram, soundIndex = 0, onComplete = null) {
    const index = phonogram.sounds[soundIndex] ? soundIndex : 0;
    const parts = [{ phonogram, soundIndex: index }];
    if (this.mode !== 'sound_only') parts.push(phonogram.sounds[index].example);
    this.#run(parts, SOUND_VOICE, onComplete);
  }

  /**
   * A prompt mixing speech and sound clips, e.g.
   *   speakPrompt(['Can you feed me', { phonogram, soundIndex: 0 }, '?'])
   */
  speakPrompt(parts, onComplete = null, { pace = 'phrase' } = {}) {
    const voice = PACES[pace];
    if (!voice) throw new Error(`speakPrompt: unknown pace "${pace}"`);
    this.#run(parts, voice, onComplete);
  }

  // Rhythmic Spalding Chant (plays all sounds of the phonogram in sequence!)
  /** Stops current speech and any chant in progress. */
  stopSpeech() {
    this.speechGeneration++;
    this.#beginUtterance();
  }

  /** onFinish receives { cancelled: boolean } so callers can skip rewards after stopSpeech(). */
  speakSpaldingChant(phonogram, onStepChange = null, onFinish = null) {
    if (this.isMuted) {
      if (onFinish) onFinish({ cancelled: false });
      return;
    }

    const generation = this.speechGeneration;
    let currentIndex = 0;
    const playNext = () => {
      if (generation !== this.speechGeneration) {
        if (onFinish) onFinish({ cancelled: true });
        return;
      }
      if (currentIndex >= phonogram.sounds.length) {
        if (onFinish) onFinish({ cancelled: false });
        return;
      }

      if (onStepChange) onStepChange(currentIndex);
      this.playPop();

      this.speakSound(phonogram, currentIndex, () => {
        currentIndex++;
        setTimeout(playNext, 450); // Gentle pause between rhythmic sounds
      });
    };

    playNext();
  }

  // Plain phrase speech (no phonogram sounds inside)
  speakPhrase(phrase, onComplete = null) {
    this.#run([phrase], PHRASE_VOICE, onComplete);
  }
}

export const audioEngine = new AudioEngine();
