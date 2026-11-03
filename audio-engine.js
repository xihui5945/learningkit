import { speakableSound } from './phonetics.js';
import { pickVoice } from './voice-select.js';

// Audio Engine: Web Audio API Synthesizer & Speech Synthesis for Toddlers

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.speechSynth = window.speechSynthesis || null;
    this.isMuted = false;
    this.mode = 'word'; // 'sound_only' or 'word' (sound + reference word)
    this.voice = null;

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

  // Speak a specific sound of a phonogram
  speakSound(phonogram, soundIndex = 0, onComplete = null) {
    if (this.isMuted || !this.speechSynth) {
      if (onComplete) onComplete();
      return;
    }

    this.speechSynth.cancel(); // Cancel any existing speech

    const soundObj = phonogram.sounds[soundIndex] || phonogram.sounds[0];
    const { soundText, wordText } = this.getPhoneticPrompt(phonogram.letters, soundObj);

    // Build the utterance text based on setting
    const speechText = this.mode === 'sound_only' ? soundText : `${soundText}! ${wordText}.`;

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.82; // Slightly relaxed for preschool toddlers
    utterance.pitch = 1.15; // Cheerful, warm friendly tone
    utterance.lang = 'en-US';

    this.#applyVoice(utterance);

    if (onComplete) {
      utterance.onend = () => onComplete();
      utterance.onerror = () => onComplete();
    }

    this.speechSynth.speak(utterance);
  }

  // Rhythmic Spalding Chant (plays all sounds of the phonogram in sequence!)
  speakSpaldingChant(phonogram, onStepChange = null, onFinish = null) {
    if (this.isMuted || !this.speechSynth) {
      if (onFinish) onFinish();
      return;
    }

    let currentIndex = 0;
    const playNext = () => {
      if (currentIndex >= phonogram.sounds.length) {
        if (onFinish) onFinish();
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

  // General phrase speech (e.g. Monster requests)
  speakPhrase(phrase, onComplete = null) {
    if (this.isMuted || !this.speechSynth) {
      if (onComplete) onComplete();
      return;
    }

    this.speechSynth.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.rate = 0.88;
    utterance.pitch = 1.12;
    utterance.lang = 'en-US';

    this.#applyVoice(utterance);

    if (onComplete) {
      utterance.onend = () => onComplete();
      utterance.onerror = () => onComplete();
    }

    this.speechSynth.speak(utterance);
  }
}

export const audioEngine = new AudioEngine();
