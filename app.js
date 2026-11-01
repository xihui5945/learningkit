import { SPALDING_PHONOGRAMS, PHONOGRAM_CATEGORIES, RULE_CHALLENGES } from './phonograms-data.js';
import { audioEngine } from './audio-engine.js';

// =================================================================
// APP STATE
// =================================================================
const state = {
  activeTab: 'studio',
  currentCategory: 'all',
  filteredList: [...SPALDING_PHONOGRAMS],
  cardIndex: 0,
  currentSoundIndex: 0,
  stars: 0,
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
    this.particles.forEach((p, idx) => {
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
    });

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
function awardStars(points = 1, x, y) {
  state.stars += points;
  const starScoreEl = document.getElementById('starScore');
  if (starScoreEl) {
    starScoreEl.textContent = state.stars;
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
    if (e.key === 'ArrowRight' || e.key === ' ') {
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
      () => {
        state.isChanting = false;
        chantBtn.style.opacity = '1';
        awardStars(1);
        audioEngine.playChime();
      }
    );
  });

  updateCardDisplay();
}

function filterCategory(catId) {
  if (catId === 'all') {
    state.filteredList = [...SPALDING_PHONOGRAMS];
  } else if (catId === 'single') {
    state.filteredList = SPALDING_PHONOGRAMS.filter(p => p.category === 'single');
  } else if (catId === 'multi_core') {
    state.filteredList = SPALDING_PHONOGRAMS.filter(p => p.category === 'multi_core');
  } else if (catId === 'rules') {
    state.filteredList = SPALDING_PHONOGRAMS.filter(p => p.category === 'rules');
  } else if (catId === 'advanced') {
    state.filteredList = SPALDING_PHONOGRAMS.filter(p => p.category === 'advanced');
  }
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
      audioEngine.speakPhrase(`Feed me ${state.monsterCurrent.targetSound.sound}!`);
    }
  });

  startNewMonsterRound();
}

function startNewMonsterRound() {
  const foodTray = document.getElementById('monsterFoodTray');
  const targetLabel = document.getElementById('monsterTargetSound');
  foodTray.innerHTML = '';

  // Select 1 target phonogram
  const randomIndex = Math.floor(Math.random() * SPALDING_PHONOGRAMS.length);
  const targetPhono = SPALDING_PHONOGRAMS[randomIndex];
  const targetSound = targetPhono.sounds[0]; // primary sound

  // Select 2 distractors
  const distractors = [];
  while (distractors.length < 2) {
    const candidate = SPALDING_PHONOGRAMS[Math.floor(Math.random() * SPALDING_PHONOGRAMS.length)];
    if (candidate.id !== targetPhono.id && !distractors.find(d => d.id === candidate.id)) {
      distractors.push(candidate);
    }
  }

  // Shuffle the 3 choices
  const choices = [targetPhono, ...distractors].sort(() => Math.random() - 0.5);

  state.monsterCurrent = {
    targetPhono,
    targetSound
  };

  targetLabel.textContent = `/${targetSound.sound}/`;
  
  // Voice announcement
  setTimeout(() => {
    audioEngine.speakPhrase(`Can you feed me /${targetSound.sound}/?`);
  }, 200);

  // Render food cards
  choices.forEach(phono => {
    const card = document.createElement('div');
    card.className = 'food-card';
    card.innerHTML = `
      <div class="food-icon">${phono.sounds[0].icon || '🍪'}</div>
      <div class="food-letter">${phono.letters}</div>
      <div class="food-word">${phono.sounds[0].example}</div>
    `;

    card.addEventListener('click', (e) => {
      handleFoodChoice(phono, card, e);
    });

    foodTray.appendChild(card);
  });
}

function handleFoodChoice(chosenPhono, cardEl, event) {
  const { targetPhono, targetSound } = state.monsterCurrent;
  const avatar = document.getElementById('monsterAvatar');

  if (chosenPhono.id === targetPhono.id) {
    // CORRECT!
    audioEngine.playMunch();
    avatar.classList.add('eating');

    const rect = cardEl.getBoundingClientRect();
    awardStars(2, rect.left + rect.width / 2, rect.top + rect.height / 2);

    cardEl.style.transform = 'scale(0) translateY(-60px)';
    cardEl.style.opacity = '0';

    setTimeout(() => {
      audioEngine.playChime();
      avatar.classList.remove('eating');
      avatar.classList.add('happy');
    }, 600);

    setTimeout(() => {
      avatar.classList.remove('happy');
      startNewMonsterRound();
    }, 1400);

  } else {
    // INCORRECT (Gentle feedback)
    audioEngine.playBoing();
    cardEl.classList.add('wrong');
    setTimeout(() => cardEl.classList.remove('wrong'), 600);

    // Speak what it actually was
    audioEngine.speakPhrase(`That is /${chosenPhono.sounds[0].sound}/ as in ${chosenPhono.sounds[0].example}. Can you find /${targetSound.sound}/?`);
  }
}

// =================================================================
// MODE 3: BUBBLE POP PARTY
// =================================================================
function initBubbleMode() {
  document.getElementById('replayBubbleTargetBtn').addEventListener('click', () => {
    if (state.bubbleTarget) {
      audioEngine.speakPhrase(`Pop the sound /${state.bubbleTarget.sound}/!`);
    }
  });

  startNewBubbleRound();
}

function startNewBubbleRound() {
  const arena = document.getElementById('bubbleArena');
  // Remove existing floating bubbles
  arena.querySelectorAll('.floating-bubble').forEach(b => b.remove());

  // Pick target phonogram
  const targetPhono = SPALDING_PHONOGRAMS[Math.floor(Math.random() * SPALDING_PHONOGRAMS.length)];
  const targetSound = targetPhono.sounds[0];
  state.bubbleTarget = { targetPhono, sound: targetSound.sound };

  document.getElementById('bubbleTargetSound').textContent = `/${targetSound.sound}/`;
  audioEngine.speakPhrase(`Pop the sound /${targetSound.sound}/!`);

  // Pick 3 distractors
  const bubbleList = [targetPhono];
  while (bubbleList.length < 4) {
    const candidate = SPALDING_PHONOGRAMS[Math.floor(Math.random() * SPALDING_PHONOGRAMS.length)];
    if (!bubbleList.find(b => b.id === candidate.id)) {
      bubbleList.push(candidate);
    }
  }

  // Shuffle and place bubbles horizontally
  bubbleList.sort(() => Math.random() - 0.5);

  const arenaWidth = arena.clientWidth || 600;
  const colStep = (arenaWidth - 100) / 4;

  bubbleList.forEach((phono, idx) => {
    const bubble = document.createElement('div');
    bubble.className = 'floating-bubble';
    bubble.textContent = phono.letters;
    bubble.style.left = `${colStep * idx + 30 + Math.random() * 20}px`;
    bubble.style.animationDelay = `${idx * 0.4}s`;

    bubble.addEventListener('click', (e) => {
      const rect = bubble.getBoundingClientRect();
      if (phono.id === targetPhono.id) {
        audioEngine.playPop();
        awardStars(1, rect.left + rect.width / 2, rect.top + rect.height / 2);
        bubble.style.transform = 'scale(1.6)';
        bubble.style.opacity = '0';
        setTimeout(() => bubble.remove(), 200);

        audioEngine.playChime();
        setTimeout(startNewBubbleRound, 1000);
      } else {
        audioEngine.playBoing();
        audioEngine.speakSound(phono, 0);
      }
    });

    arena.appendChild(bubble);
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
  challenge.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'rule-choice-btn';
    btn.textContent = choice;
    btn.addEventListener('click', (e) => {
      if (choice === challenge.correct) {
        // CORRECT RULE!
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
          <span style="font-size: 0.8rem; color: #8D99AE; font-weight: 700;">Page ${p.page}</span>
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

  renderGrid();
}

// =================================================================
// TAB NAVIGATION & TOP CONTROLS
// =================================================================
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

      audioEngine.playPop();

      // Trigger mode initializations if needed
      if (targetTab === 'monster' && !state.monsterCurrent) {
        startNewMonsterRound();
      } else if (targetTab === 'bubble' && !state.bubbleTarget) {
        startNewBubbleRound();
      } else if (targetTab === 'detective') {
        renderDetectivePuzzle();
      }
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
