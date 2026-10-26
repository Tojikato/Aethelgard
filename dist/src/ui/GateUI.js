// ═══════════════════════════════════════════════════════════════════════════
//  GATE UI — Login, Registration, Audio, Embers & Game Shell Mount
// ═══════════════════════════════════════════════════════════════════════════

import {
  $,
  defaults,
  getUser,
  setUser,
  getPlayer,
  setPlayer,
  getGame,
  setGame,
  getScene,
  setScene,
  isDemo,
  setDemo,
  isSoundEnabled,
  setSoundEnabled
} from '../services/gameState.js';

import {
  ready,
  errorText,
  signInUser,
  registerUser,
  signOutUser,
  ensureProfile
} from '../services/firebase.js';

import { destroyActiveInventoryOverlay } from './InventoryOverlay.js';

let mode = 'login';
let busy = false;
let audio = null;
let drone = null;
let onStartGameCallback = null;
let awakeningUITemplates = [];

export function getAwakeningTemplates() {
  return awakeningUITemplates;
}

export function mountDOM() {
  const root = $('game-root') || document.body;
  if ($('gate') && $('game-shell')) return;

  const html = `
<main id="gate">
  <header>
    <a class="brand" href="./">✧ <span>AETHELGARD</span></a>
    <span class="edition">A DARK FANTASY CHRONICLE</span>
    <button id="sound" class="quiet" aria-pressed="false">♪ Sound off</button>
  </header>
  <div class="embers" aria-hidden="true"></div>
  <div class="arch" aria-hidden="true">
    <div class="runes">✧<br>ᛟ<br>ᚨ<br>ᛞ<br>✧</div>
    <div class="door"></div>
  </div>
  <section class="gate-content">
    <div class="chapter">PROLOGUE · THE ABYSSAL GATE</div>
    <h1>The Gates of<br><em>Aethelgard</em></h1>
    <p class="intro">Beyond these gates, the world remembers.<br>Will it remember thee?</p>
    <div class="ornament">────── ✦ ──────</div>
    <div class="parchment">
      <div class="tabs" role="tablist" aria-label="Choose a rite">
        <button id="login-tab" role="tab" aria-selected="true">Return, wanderer</button>
        <button id="register-tab" role="tab" aria-selected="false">Begin thy chronicle</button>
      </div>
      <form id="auth-form">
        <label for="email">THY EMAIL</label>
        <input id="email" type="email" autocomplete="email" placeholder="wanderer@realm.com" required>
        <div class="password-label">
          <label for="password">THY SECRET</label>
          <button type="button" id="show-password" class="quiet">Reveal</button>
        </div>
        <input id="password" type="password" autocomplete="current-password" minlength="6" placeholder="Enter thy secret" required>
        <p id="auth-error" class="error" role="alert"></p>
        <button id="enter" class="primary" type="submit">Cross the threshold <span>⟶</span></button>
      </form>
      <p class="vow">Thy story begins in darkness. Thy choices give it shape.</p>
    </div>
    <button id="preview" class="preview">Witness the awakening <span>↗</span></button>
    <span class="preview-note">A glimpse without an account · progress is not saved</span>
  </section>
  <footer>
    <span>✦ &nbsp; INTELLECT IS THY ONLY WEAPON</span>
    <span>CHAPTER I <b>THE AWAKENING</b></span>
    <span>ENTER AT THY OWN PERIL</span>
  </footer>
</main>

<section id="game-shell" hidden aria-label="The Awakening">
  <div id="game"></div>
  <div class="game-top">
    <span id="chapter-title">I · THE AWAKENING</span>
    <span id="session-label"></span>
    <button id="leave" class="quiet nav-gate-link">Return to the gate</button>
  </div>
  <form id="name-form" hidden>
    <label for="soul-name">WHAT SHALL WE CALL THEE?</label>
    <div>
      <input id="soul-name" required maxlength="32" autocomplete="nickname" placeholder="Thy name, wanderer">
      <button class="primary" type="submit">Etch thy name ⟶</button>
    </div>
    <p id="name-error" class="error" role="alert"></p>
  </form>
  <div id="dialogue" role="region" aria-label="Narrator">
    <div class="speaker">THE VOICE IN THE ASH</div>
    <p id="lore" aria-live="polite"></p>
    <button id="next" class="quiet">Continue <span>▾</span></button>
  </div>
  <div id="arrival" hidden>
    <span class="chapter">THE CHRONICLE BEGINS</span>
    <h2>The Ashen Hamlet</h2>
    <p id="welcome"></p>
    <div id="stats"></div>
    <button id="replay" class="primary">Hear the voice again</button>
  </div>
</section>
  `;

  root.innerHTML = html;
}

export function setBusy(value) {
  busy = value;
  document.querySelectorAll('#auth-form button, .tabs button, #preview').forEach(b => {
    b.disabled = value;
  });
  const enterBtn = $('enter');
  if (enterBtn) {
    enterBtn.textContent = value
      ? 'The gate stirs…'
      : mode === 'login'
      ? 'Cross the threshold ⟶'
      : 'Bind thy soul ⟶';
  }
}

export function selectMode(next) {
  if (busy) return;
  mode = next;
  $('login-tab')?.setAttribute('aria-selected', next === 'login');
  $('register-tab')?.setAttribute('aria-selected', next === 'register');
  const pwd = $('password');
  if (pwd) pwd.autocomplete = next === 'login' ? 'current-password' : 'new-password';
  const err = $('auth-error');
  if (err) err.textContent = '';
  setBusy(false);
}

export function showGameShell() {
  $('session-label').textContent = isDemo() ? 'UNSAVED PREVIEW' : 'SOUL BOUND · CLOUD SAVE';
  $('gate').style.opacity = '0';
  setTimeout(() => {
    $('gate').hidden = true;
    $('gate').inert = true;
    $('game-shell').hidden = false;
  }, 800);
}

export function showGate() {
  $('gate').hidden = false;
  $('gate').inert = false;
  $('gate').style.opacity = '1';
  $('game-shell').hidden = true;
}

export async function returnToGate(logout = true) {
  destroyActiveInventoryOverlay();
  const campEl = document.getElementById('camp-overlay');
  if (campEl) campEl.remove();

  const game = getGame();
  if (game) {
    game.destroy(true);
    setGame(null);
  }
  setScene(null);

  $('game-shell').hidden = true;
  if ($('name-form')) $('name-form').hidden = true;
  $('arrival').hidden = true;
  showGate();
  if ($('password')) $('password').value = '';

  if (logout && !isDemo()) {
    try {
      await signOutUser();
    } catch (e) {
      $('auth-error').textContent = errorText(e);
    }
  }
  $('enter')?.focus();
  console.log('[returnToGate] Game destroyed, gate restored');
}

export function initGateUI({ onStartGame }) {
  mountDOM();
  onStartGameCallback = onStartGame;

  // Stash templates for dynamic reconstruction during scene transitions
  awakeningUITemplates = ['name-form', 'dialogue'].map(id => {
    const el = $(id);
    const tmpl = el.cloneNode(true);
    el.remove();
    return tmpl;
  });

  // Embers animation
  const embersEl = document.querySelector('.embers');
  if (embersEl && embersEl.childElementCount === 0) {
    for (let i = 0; i < 35; i++) {
      const e = document.createElement('i');
      e.className = 'ember';
      e.style.cssText = `left:${Math.random() * 100}%;bottom:${Math.random() * 20}%;animation-duration:${7 + Math.random() * 11}s;animation-delay:-${Math.random() * 18}s`;
      embersEl.append(e);
    }
  }

  // Tabs
  $('login-tab').onclick = () => selectMode('login');
  $('register-tab').onclick = () => selectMode('register');

  // Password toggle
  $('show-password').onclick = () => {
    const pwd = $('password');
    const reveal = pwd.type === 'password';
    pwd.type = reveal ? 'text' : 'password';
    $('show-password').textContent = reveal ? 'Conceal' : 'Reveal';
  };

  // Sound toggle
  $('sound').onclick = async () => {
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      await audio.resume();
      if (!drone) {
        drone = audio.createOscillator();
        drone.type = 'sine';
        drone.frequency.value = 55;
        const gain = audio.createGain();
        gain.gain.value = 0.035;
        drone.connect(gain).connect(audio.destination);
        drone.start();
      }
      const soundEnabled = !isSoundEnabled();
      setSoundEnabled(soundEnabled);
      if (soundEnabled) await audio.resume();
      else await audio.suspend();
      $('sound').textContent = soundEnabled ? '♪ Sound on' : '♪ Sound off';
      $('sound').setAttribute('aria-pressed', soundEnabled);
    } catch {
      $('sound').textContent = 'Sound unavailable';
    }
  };

  // Auth Form Submit
  $('auth-form').onsubmit = async e => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    $('auth-error').textContent = '';
    try {
      await ready;
      const email = $('email').value.trim();
      const password = $('password').value;
      let user;
      if (mode === 'register') {
        user = await registerUser(email, password);
      } else {
        user = await signInUser(email, password);
      }
      const player = await ensureProfile(user.uid);
      setPlayer(player);
      setDemo(false);
      if (onStartGameCallback) await onStartGameCallback();
    } catch (err) {
      $('auth-error').textContent = errorText(err);
    } finally {
      setBusy(false);
    }
  };

  // Preview Button Click (Demo Mode)
  $('preview').onclick = async () => {
    if (busy) return;
    setDemo(true);
    setPlayer({ ...defaults });
    setBusy(true);
    try {
      if (onStartGameCallback) await onStartGameCallback();
    } catch (err) {
      $('auth-error').textContent = err.message;
    } finally {
      setBusy(false);
    }
  };

  // Leave / Replay buttons
  $('leave').onclick = () => returnToGate();
  $('replay').onclick = () => {
    const scene = getScene();
    scene?.scene?.restart();
  };
}
