// ═══════════════════════════════════════════════════════════════════════════
//  AETHELGARD — MAIN GAME ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

import { getPhaserConfig } from './config/phaser.js?v=2.3';
import { loadFirebase } from './config/firebase.js?v=2.3';

import Scene_Boot from './scenes/Boot.js?v=2.3';
import Scene_Awakening from './scenes/Awakening.js?v=2.3';
import Scene_Camp from './scenes/Camp.js?v=2.3';
import Scene_Oakhaven from './scenes/Oakhaven.js?v=2.3';

import { initGateUI, showGameShell, showGate } from './ui/GateUI.js';
import { setGame } from './services/gameState.js';

// ─── Phaser Game Configuration ──────────────────────────────────────────────
export const scenes = [Scene_Boot, Scene_Awakening, Scene_Camp, Scene_Oakhaven];
export const gameConfig = getPhaserConfig(scenes);

// ─── Game Launcher ──────────────────────────────────────────────────────────
export async function startGame() {
  if (!window.Phaser) {
    throw new Error('The game engine is beyond reach. Check thy connection and reload.');
  }

  showGameShell();
  try {
    const game = new Phaser.Game(gameConfig);
    setGame(game);
    window.__AETHELGARD_GAME__ = game;
    console.log('[Game] Phaser initialized with scenes:', scenes.map(s => s.name));
    return game;
  } catch (e) {
    showGate();
    throw e;
  }
}

// ─── Initialize Application ─────────────────────────────────────────────────
initGateUI({ onStartGame: startGame });

// Optional direct scene launch for headless verification & testing (?scene=camp, ?scene=oakhaven)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('scene') || urlParams.get('preview')) {
  startGame();
}

loadFirebase().catch(e => {
  const err = document.getElementById('auth-error');
  if (err) {
    err.textContent = 'The Firebase archive could not be summoned. Check thy connection and reload. The awakening preview remains open.';
  }
});

