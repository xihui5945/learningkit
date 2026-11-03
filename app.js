import { SPALDING_PHONOGRAMS, PHONOGRAM_CATEGORIES, RULE_CHALLENGES } from './phonograms-data.js';
import { audioEngine } from './audio-engine.js';
import { speakableSound } from './phonetics.js';
import { buildSoundRound } from './game-logic.js';
import { ProgressStore, MAX_LEVEL } from './progress-store.js';

const progress = new ProgressStore();
const say = (sound) => speakableSound(sound);

// =================================================================
// APP STATE
// =================================================================
const state = {
  activeTab: 'studio',
  currentCategory: 'all',
  filteredList: [...SPALDING_PHONOGRAMS],
  cardIndex: 0,
  currentSoundIndex: 0,
  isChanting: false,
  
  // Game modes state
  monsterCurrent: null,
  bubbleTarget: null,
  detectiveIndex: 0
};

// =================================================================
// CONFETTI SYSTEM
// =================================================================
class ConfettiSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animating = false;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    const colors = ['#FF5A79', '#FFB703', '#2EC4B6', '#8338EC', '#3A86FF', '#FF006E'];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: Math.random() * 9 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: Math.random() * 10 - 5,
        alpha: 1,
        decay: Math.random() * 0.015 + 0.015
      });
    }

    if (!this.animating) {
      this.animating = true;
      this.loop();
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let idx = this.particles.length - 1; idx >= 0; idx--) {
      const p = this.particles[idx];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.rotation += p.vr;
      p.alpha -= p.decay;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();

      if (p.alpha <= 0) {
        this.particles.splice(idx, 1);
      }
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.loop());
    } else {
      this.animating = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

let confetti = null;

// =================================================================
// REWARD & STAR PROGRESSION
// =================================================================
function renderStars() {
  const starScoreEl = document.getElementById('starScore');
  if (starScoreEl) starScoreEl.textContent = progress.stars;
}

function awardStars(points = 1, x, y) {
  progress.addStars(points);
  renderStars();
  const starScoreEl = document.getElementById('starScore');
  if (starScoreEl) {
    starScoreEl.parentElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
      starScoreEl.parentElement.style.transform = '';
    }, 200);
  }
  if (confetti) {
    confetti.burst(x, y);
  }
}

// =================================================================
// MODE 1: SOUND STUDIO (MULTI-SOUND CARD)
// =================================================================
function initStudio() {
  const filterBar = document.getElementById('categoryFilterBar');
  filterBar.innerHTML = '';

  PHONOGRAM_CATEGORIES.forEach(cat => {
    const chip = document.createElement('button');
    chip.className = `cat-chip ${cat.id === state.currentCategory ? 'active' : ''}`;
    chip.textContent = cat.label;
    chip.addEventListener('click', () => {
      state.currentCategory = cat.id;
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      filterCategory(cat.id);
    });
    filterBar.appendChild(chip);
  });

  // Card Tap Event (cycles sounds)
  const card = document.getElementById('mainPhonogramCard');
  card.addEventListener('click', () => {
    const currentPhonogram = state.filteredList[state.cardIndex];
    if (!currentPhonogram) return;

    audioEngine.playPop();
    // Advance to next sound
    state.currentSoundIndex = (state.currentSoundIndex + 1) % currentPhonogram.sounds.length;
    updateCardDisplay();
    audioEngine.speakSound(currentPhonogram, state.currentSoundIndex);
  });

  // Navigation Buttons
  document.getElementById('prevCardBtn').addEventListener('click', () => {
    navigateCard(-1);
  });

  document.getElementById('nextCardBtn').addEventListener('click', () => {
    navigateCard(1);
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (state.activeTab !== 'studio') return;
    // Let focused controls handle their own keys (avoids double-firing on Space)
    if (e.target.closest?.('button, input, textarea, select')) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      navigateCard(1);
    } else if (e.key === 'ArrowLeft') {
      navigateCard(-1);
    }
  });

  // Spalding Chant Button
  const chantBtn = document.getElementById('spaldingChantBtn');
  chantBtn.addEventListener('click', () => {
    const currentPhonogram = state.filteredList[state.cardIndex];
    if (!currentPhonogram || state.isChanting) return;

    state.isChanting = true;
    chantBtn.style.opacity = '0.7';

    audioEngine.speakSpaldingChant(
      currentPhonogram,
      (stepIndex) => {
        state.currentSoundIndex = stepIndex;
        updateCardDisplay();
      },
      ({ cancelled } = {}) => {
        state.isChanting = false;
        chantBtn.style.opacity = '1';
        if (cancelled) return;
        awardStars(1);
        audioEngine.playChime();
      }
    );
  });

  updateCardDisplay();
}

function filterCategory(catId) {
  state.filteredList = catId === 'all'
    ? [...SPALDING_PHONOGRAMS]
    : SPALDING_PHONOGRAMS.filter(p => p.category === catId);
  // Games follow the chosen category; start fresh rounds from the new pool
  state.monsterCurrent = null;
  state.bubbleTarget = null;
  state.cardIndex = 0;
  state.currentSoundIndex = 0;
  updateCardDisplay();
}

function navigateCard(direction) {
  audioEngine.playPop();
  state.cardIndex += direction;
  if (state.cardIndex < 0) {
    state.cardIndex = state.filteredList.length - 1;
  } else if (state.cardIndex >= state.filteredList.length) {
    state.cardIndex = 0;
  }
  state.currentSoundIndex = 0;
  updateCardDisplay();

  const currentPhonogram = state.filteredList[state.cardIndex];
  if (currentPhonogram) {
    audioEngine.speakSound(currentPhonogram, 0);
  }
}

function updateCardDisplay() {
  const currentPhonogram = state.filteredList[state.cardIndex];
  if (!currentPhonogram) return;

  const letterDisplay = document.getElementById('cardLetterDisplay');
  const progressBadge = document.getElementById('cardProgressBadge');
  const ruleBadge = document.getElementById('cardRuleBadge');
  const dotsContainer = document.getElementById('soundDotsContainer');
  const iconEl = document.getElementById('soundIcon');
  const phonemeEl = document.getElementById('soundPhoneme');
  const wordEl = document.getElementById('soundWord');
  const noteEl = document.getElementById('soundNote');

  // Letter & Meta
  letterDisplay.textContent = currentPhonogram.letters;
  progressBadge.textContent = `${state.cardIndex + 1} / ${state.filteredList.length}`;

  if (currentPhonogram.rule) {
    ruleBadge.style.display = 'inline-block';
    ruleBadge.textContent = currentPhonogram.rule;
    ruleBadge.title = currentPhonogram.rule;
  } else {
    ruleBadge.style.display = 'none';
  }

  // Sound Dots (1, 2, 3...)
  dotsContainer.innerHTML = '';
  currentPhonogram.sounds.forEach((s, idx) => {
    const dot = document.createElement('div');
    dot.className = `sound-dot ${idx === state.currentSoundIndex ? 'active' : ''}`;
    dot.textContent = idx + 1;
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      state.currentSoundIndex = idx;
      updateCardDisplay();
      audioEngine.speakSound(currentPhonogram, idx);
    });
    dotsContainer.appendChild(dot);
  });

  // Showcase Box
  const activeSound = currentPhonogram.sounds[state.currentSoundIndex] || currentPhonogram.sounds[0];
  iconEl.textContent = activeSound.icon || '⭐';
  phonemeEl.textContent = activeSound.sound;
  wordEl.textContent = activeSound.example;
  noteEl.textContent = activeSound.note || `Sound #${state.currentSoundIndex + 1}`;

  // Showcase box highlight pulse
  const showcaseBox = document.getElementById('soundShowcaseBox');
  showcaseBox.classList.add('highlight');
  setTimeout(() => showcaseBox.classList.remove('highlight'), 300);
}

// =================================================================
// MODE 2: FEED CHOMPY THE MONSTER
// =================================================================
function initMonsterMode() {
  // Googly eye tracking
  const avatar = document.getElementById('monsterAvatar');
  const leftPupil = document.getElementById('leftPupil');
  const rightPupil = document.getElementById('rightPupil');

  window.addEventListener('mousemove', (e) => {
    if (state.activeTab !== 'monster') return;
    const rect = avatar.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(6, Math.hypot(dx, dy) / 25);

    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;

    leftPupil.setAttribute('cx', 75 + px);
    leftPupil.setAttribute('cy', 85 + py);
    rightPupil.setAttribute('cx', 125 + px);
    rightPupil.setAttribute('cy', 85 + py);
  });

  document.getElementById('replayTargetSoundBtn').addEventListener('click', () => {
    if (state.monsterCurrent) {
      audioEngine.speakPhrase(`Feed me ${say(state.monsterCurrent.targetSound.sound)}!`);
    }
  });
  // First round starts when the tab is opened (see activateGameTab)
}

/** True if `tab` is still on screen — delayed callbacks must check this before speaking. */
const isActive = tab => state.activeTab === tab;

/** Builds a round from the current category, favouring phonograms the child has not mastered. */
function buildAdaptiveRound(choiceCount) {
  return buildSoundRound({
    pool: state.filteredList.length ? state.filteredList : SPALDING_PHONOGRAMS,
    fallback: SPALDING_PHONOGRAMS,
    choiceCount,
    weightFn: p => progress.weight(p.id)
  });
}

/** Records only the first answer of a round, so repeated taps don't skew mastery. */
function recordFirstAnswer(round, correct) {
  if (round.recorded) return;
  round.recorded = true;
  progress.recordAttempt(round.targetPhono.id, correct);
}

function startNewMonsterRound() {
  const foodTray = document.getElementById('monsterFoodTray');
  const targetLabel = document.getElementById('monsterTargetSound');
  foodTray.innerHTML = '';

  const { target: targetPhono, targetSound, choices } = buildAdaptiveRound(3);
  state.monsterCurrent = { targetPhono, targetSound, recorded: false, locked: false };

  targetLabel.textContent = `/${targetSound.sound}/`;

  setTimeout(() => {
    if (isActive('monster') && state.monsterCurrent?.targetSound === targetSound) {
      audioEngine.speakPhrase(`Can you feed me ${say(targetSound.sound)}?`);
    }
  }, 200);

  choices.forEach(phono => {
    const card = document.createElement('div');
    card.className = 'food-card';
    card.innerHTML = `
      <div class="food-icon">${phono.sounds[0].icon || '🍪'}</div>
      <div class="food-letter">${phono.letters}</div>
      <div class="food-word">${phono.sounds[0].example}</div>
    `;
    card.addEventListener('click', (e) => handleFoodChoice(phono, card, e));
    foodTray.appendChild(card);
  });
}

function handleFoodChoice(chosenPhono, cardEl) {
  const round = state.monsterCurrent;
  if (!round || round.locked) return;
  const { targetPhono, targetSound } = round;
  const avatar = document.getElementById('monsterAvatar');
  const isCorrect = chosenPhono.id === targetPhono.id;
  recordFirstAnswer(round, isCorrect);

  if (isCorrect) {
    round.locked = true;
    audioEngine.playMunch();
    avatar.classList.add('eating');

    const rect = cardEl.getBoundingClientRect();
    awardStars(2, rect.left + rect.width / 2, rect.top + rect.height / 2);

    cardEl.style.transform = 'scale(0) translateY(-60px)';
    cardEl.style.opacity = '0';

    setTimeout(() => {
      if (isActive('monster')) audioEngine.playChime();
      avatar.classList.remove('eating');
      avatar.classList.add('happy');
    }, 600);

    setTimeout(() => {
      avatar.classList.remove('happy');
      if (state.monsterCurrent !== round) return; // superseded (e.g. category changed)
      if (isActive('monster')) {
        startNewMonsterRound();
      } else {
        state.monsterCurrent = null; // child left: start fresh (with prompt) on return
      }
    }, 1400);
  } else {
    // Gentle, non-punitive feedback
    audioEngine.playBoing();
    cardEl.classList.add('wrong');
    setTimeout(() => cardEl.classList.remove('wrong'), 600);

    const chosen = chosenPhono.sounds[0];
    audioEngine.speakPhrase(`That is ${say(chosen.sound)}, as in ${chosen.example}. Can you find ${say(targetSound.sound)}?`);
  }
}

// =================================================================
// MODE 3: BUBBLE POP PARTY
// =================================================================
function initBubbleMode() {
  document.getElementById('replayBubbleTargetBtn').addEventListener('click', () => {
    if (state.bubbleTarget) {
      audioEngine.speakPhrase(`Pop the sound ${say(state.bubbleTarget.sound)}!`);
    }
  });
  // First round starts when the tab is opened (see activateGameTab)
}

function startNewBubbleRound() {
  const arena = document.getElementById('bubbleArena');
  // Remove existing floating bubbles
  arena.querySelectorAll('.bubble-float').forEach(b => b.remove());

  const { target: targetPhono, targetSound, choices: bubbleList } = buildAdaptiveRound(4);
  const round = { targetPhono, sound: targetSound.sound, recorded: false, locked: false };
  state.bubbleTarget = round;

  document.getElementById('bubbleTargetSound').textContent = `/${targetSound.sound}/`;
  audioEngine.speakPhrase(`Pop the sound ${say(targetSound.sound)}!`);

  // Place bubbles horizontally (already shuffled)
  const arenaWidth = arena.clientWidth || 600;
  const colStep = (arenaWidth - 100) / 4;

  bubbleList.forEach((phono, idx) => {
    // Outer element floats (animation owns its transform/opacity);
    // inner bubble is free to scale and fade for hover, pop and wobble.
    const float = document.createElement('div');
    float.className = 'bubble-float';
    float.style.left = `${colStep * idx + 30 + Math.random() * 20}px`;
    float.style.animationDelay = `${idx * 0.4}s`;

    const bubble = document.createElement('div');
    bubble.className = 'floating-bubble';
    bubble.textContent = phono.letters;
    float.appendChild(bubble);

    bubble.addEventListener('click', () => {
      if (round.locked || state.bubbleTarget !== round) return;
      const rect = bubble.getBoundingClientRect();
      const isCorrect = phono.id === targetPhono.id;
      recordFirstAnswer(round, isCorrect);
      if (isCorrect) {
        round.locked = true;
        audioEngine.playPop();
        awardStars(1, rect.left + rect.width / 2, rect.top + rect.height / 2);
        bubble.classList.add('popped');
        setTimeout(() => float.remove(), 250);

        audioEngine.playChime();
        setTimeout(() => {
          if (state.bubbleTarget !== round) return;
          if (isActive('bubble')) {
            startNewBubbleRound();
          } else {
            state.bubbleTarget = null;
          }
        }, 1000);
      } else {
        audioEngine.playBoing();
        bubble.classList.remove('wobble');
        void bubble.offsetWidth; // restart the animation on repeat taps
        bubble.classList.add('wobble');
        audioEngine.speakSound(phono, 0);
      }
    });
    bubble.addEventListener('animationend', () => bubble.classList.remove('wobble'));

    arena.appendChild(float);
  });
}

// =================================================================
// MODE 4: RULE DETECTIVE (BRIDGE BUILDER)
// =================================================================
function initDetectiveMode() {
  state.detectiveIndex = 0;
  renderDetectivePuzzle();
}

function renderDetectivePuzzle() {
  const challenge = RULE_CHALLENGES[state.detectiveIndex];
  if (!challenge) return;

  const titleEl = document.getElementById('rulePromptTitle');
  const prefixEl = document.getElementById('ruleWordPrefix');
  const slotEl = document.getElementById('ruleSlotTarget');
  const suffixEl = document.getElementById('ruleWordSuffix');
  const hintEl = document.getElementById('ruleHintBox');
  const choicesRow = document.getElementById('ruleChoicesRow');

  titleEl.textContent = challenge.prompt;
  prefixEl.textContent = challenge.wordPrefix || '';
  prefixEl.style.display = challenge.wordPrefix ? 'inline-block' : 'none';

  slotEl.textContent = '?';
  slotEl.style.color = '#CBD5E1';
  slotEl.style.borderColor = '#F59E0B';

  suffixEl.textContent = challenge.wordSuffix || '';
  suffixEl.style.display = challenge.wordSuffix ? 'inline-block' : 'none';

  hintEl.innerHTML = `💡 <span>${challenge.hint}</span>`;

  choicesRow.innerHTML = '';
  const answerPhono = SPALDING_PHONOGRAMS.find(p => p.letters === challenge.correct);
  const round = { targetPhono: answerPhono, recorded: !answerPhono, locked: false };
  challenge.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'rule-choice-btn';
    btn.textContent = choice;
    btn.addEventListener('click', () => {
      if (round.locked) return;
      const isCorrect = choice === challenge.correct;
      recordFirstAnswer(round, isCorrect);
      if (isCorrect) {
        round.locked = true;
        slotEl.textContent = choice;
        slotEl.style.color = '#06D6A0';
        slotEl.style.borderColor = '#06D6A0';

        audioEngine.playChime();
        const rect = btn.getBoundingClientRect();
        awardStars(3, rect.left + rect.width / 2, rect.top + rect.height / 2);

        audioEngine.speakPhrase(`Great job! ${challenge.fullWord}! ${challenge.ruleNote}`);

        setTimeout(() => {
          state.detectiveIndex = (state.detectiveIndex + 1) % RULE_CHALLENGES.length;
          renderDetectivePuzzle();
        }, 2200);

      } else {
        // INCORRECT
        audioEngine.playBoing();
        btn.style.transform = 'translateX(-10px)';
        setTimeout(() => btn.style.transform = '', 300);
        audioEngine.speakPhrase(`Remember: ${challenge.hint}`);
      }
    });

    choicesRow.appendChild(btn);
  });
}

// =================================================================
// MODE 5: PARENT & TEACHER SUPPORT SHEET
// =================================================================
function masteryLabel(level) {
  return ['Not practised yet', 'Getting started', 'Nearly there', 'Mastered'][level] ?? '';
}

function initSupportSheet() {
  const grid = document.getElementById('sheetPhonogramGrid');
  const searchInput = document.getElementById('sheetSearchInput');

  function renderGrid(filterText = '') {
    grid.innerHTML = '';
    const q = filterText.toLowerCase().trim();

    const matched = SPALDING_PHONOGRAMS.filter(p => {
      if (!q) return true;
      if (p.letters.toLowerCase().includes(q)) return true;
      if (p.rule && p.rule.toLowerCase().includes(q)) return true;
      return p.sounds.some(s => s.sound.includes(q) || s.example.toLowerCase().includes(q));
    });

    matched.forEach(p => {
      const card = document.createElement('div');
      card.className = 'sheet-phonogram-card';

      let soundRowsHtml = '';
      p.sounds.forEach((s, idx) => {
        soundRowsHtml += `
          <div class="sheet-sound-row">
            <div>
              <strong>${s.sound}</strong> – ${s.example} ${s.icon || ''}
              <span style="color: #6C757D; font-size: 0.8rem; margin-left: 4px;">(${s.note})</span>
            </div>
            <button class="sound-audio-mini-btn" data-phono="${p.id}" data-idx="${idx}" title="Listen to sound">
              🔊
            </button>
          </div>
        `;
      });

      card.innerHTML = `
        <div class="sheet-card-top">
          <div class="sheet-letter">${p.letters}</div>
          <span class="sheet-card-meta">
            <span class="mastery-badge level-${progress.level(p.id)}" title="${masteryLabel(progress.level(p.id))}">${'★'.repeat(progress.level(p.id))}${'☆'.repeat(MAX_LEVEL - progress.level(p.id))}</span>
            <span style="font-size: 0.8rem; color: #8D99AE; font-weight: 700;">Page ${p.page}</span>
          </span>
        </div>
        ${p.rule ? `<div class="sheet-card-rule">📌 ${p.rule}</div>` : ''}
        <div style="display: flex; flex-direction: column; gap: 0.4rem;">
          ${soundRowsHtml}
        </div>
      `;

      // Attach audio buttons
      card.querySelectorAll('.sound-audio-mini-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const sIdx = parseInt(btn.dataset.idx, 10);
          audioEngine.speakSound(p, sIdx);
          audioEngine.playPop();
        });
      });

      grid.appendChild(card);
    });
  }

  searchInput.addEventListener('input', (e) => {
    renderGrid(e.target.value);
  });

  document.getElementById('printSheetBtn').addEventListener('click', () => {
    window.print();
  });

  document.getElementById('resetProgressBtn').addEventListener('click', () => {
    if (window.confirm('Reset all stars and mastery progress? This cannot be undone.')) {
      progress.reset();
      renderStars();
    }
  });

  // Keep badges current as the child plays in other modes
  progress.onChange(() => renderGrid(searchInput.value));

  renderGrid();
}

// =================================================================
// TAB NAVIGATION & TOP CONTROLS
// =================================================================
/**
 * Called when a tab becomes visible. Games build their round lazily (so layout
 * is measured while visible and nothing speaks off-screen) and re-announce an
 * unfinished round so a returning child knows what to find.
 */
function activateGameTab(tab) {
  if (tab === 'monster') {
    const round = state.monsterCurrent;
    if (!round) startNewMonsterRound();
    else if (!round.locked) audioEngine.speakPhrase(`Can you feed me ${say(round.targetSound.sound)}?`);
  } else if (tab === 'bubble') {
    const round = state.bubbleTarget;
    if (!round) startNewBubbleRound();
    else if (!round.locked) audioEngine.speakPhrase(`Pop the sound ${say(round.sound)}!`);
  }
  // Rule Detective keeps its current puzzle; re-rendering would reset first-answer tracking.
}

function initTabs() {
  const tabs = document.querySelectorAll('.mode-tab');
  const screens = {
    studio: document.getElementById('screen-studio'),
    monster: document.getElementById('screen-monster'),
    bubble: document.getElementById('screen-bubble'),
    detective: document.getElementById('screen-detective'),
    support: document.getElementById('screen-support')
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      state.activeTab = targetTab;

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      Object.keys(screens).forEach(key => {
        if (screens[key]) {
          screens[key].classList.toggle('active', key === targetTab);
        }
      });

      audioEngine.stopSpeech();
      audioEngine.playPop();
      activateGameTab(targetTab);
    });
  });

  // Audio Mode Toggle (Sound Only vs Sound + Word)
  const toggleAudioModeBtn = document.getElementById('toggleAudioModeBtn');
  const audioModeLabel = document.getElementById('audioModeLabel');
  toggleAudioModeBtn.addEventListener('click', () => {
    if (audioEngine.mode === 'word') {
      audioEngine.mode = 'sound_only';
      audioModeLabel.textContent = 'Sound Only';
    } else {
      audioEngine.mode = 'word';
      audioModeLabel.textContent = 'Sound + Word';
    }
    audioEngine.playPop();
  });

  // Mute button
  const toggleMuteBtn = document.getElementById('toggleMuteBtn');
  toggleMuteBtn.addEventListener('click', () => {
    audioEngine.isMuted = !audioEngine.isMuted;
    toggleMuteBtn.textContent = audioEngine.isMuted ? '🔇' : '🔊';
  });
}

// =================================================================
// INITIALIZATION
// =================================================================
window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('confettiCanvas');
  confetti = new ConfettiSystem(canvas);
  renderStars();

  initTabs();
  initStudio();
  initMonsterMode();
  initBubbleMode();
  initDetectiveMode();
  initSupportSheet();

  // First interaction unlock for Web Audio
  window.addEventListener('click', () => {
    audioEngine.init();
  }, { once: true });
});
