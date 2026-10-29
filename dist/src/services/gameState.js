// ═══════════════════════════════════════════════════════════════════════════
//  GAME STATE & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

import { DEFAULT_OUTFIT, OUTFITS } from '../config/outfits.js';
export const $ = id => document.getElementById(id);
export const DEMO_WARDROBE_KEY = 'aethelgard_wardrobe_demo_v1';
export function readDemoWardrobe() {
  try { return JSON.parse(localStorage.getItem(DEMO_WARDROBE_KEY) || 'null'); } catch { return null; }
}

export const defaults = {
  level: 1,
  sanity: 100,
  gold: 0,
  renown: 0,
  class: 'Wandering Soul',
  name: ''
};

export const lore = [
  'Another soul, tumbling from the realm of endless, rotting scrolls...',
  'Thy mind is frail, poisoned by fleeting illusions and cheap dopamine. Yet, Aethelgard demands sharp intellect, not hollow stares.',
  'If thou art to survive the trials of commerce, ancient tongues, and shifting logic... thou must first remember who thou art.',
  'Speak, wanderer. What name shall be etched upon thy gravestone?'
];

export const state = {
  user: null,
  player: { ...defaults },
  game: null,
  scene: null,
  demo: false,
  equippedOutfit: DEFAULT_OUTFIT,
  equippedWeapon: null,
  soundEnabled: false
};

export const getUser = () => state.user;
export const setUser = u => { state.user = u; };

export const getPlayer = () => state.player;
export const setPlayer = p => {
  const saved = state.demo ? readDemoWardrobe() : null;
  state.player = { ...defaults, ...p };
  state.equippedOutfit = OUTFITS[saved?.equippedOutfit ?? p?.equippedOutfit]?.id || DEFAULT_OUTFIT;
  state.equippedWeapon = (saved?.equippedWeapon ?? p?.equippedWeapon) === 'sword-rusted' ? 'sword-rusted' : null;
  if (saved) state.player.starterBundleClaimed = Boolean(saved.starterBundleClaimed);
  state.player.equippedOutfit = state.equippedOutfit;
  state.player.equippedWeapon = state.equippedWeapon;
};
export const getEquippedOutfit = () => state.equippedOutfit;
export const getEquippedWeapon = () => state.equippedWeapon;
export function setEquipment({ equippedOutfit = state.equippedOutfit, equippedWeapon = state.equippedWeapon }) {
  state.equippedOutfit = OUTFITS[equippedOutfit]?.id || DEFAULT_OUTFIT;
  state.equippedWeapon = equippedWeapon === 'sword-rusted' ? equippedWeapon : null;
  Object.assign(state.player, { equippedOutfit: state.equippedOutfit, equippedWeapon: state.equippedWeapon });
  window.dispatchEvent(new CustomEvent('aethelgard:equipment', { detail: { equippedOutfit: state.equippedOutfit, equippedWeapon: state.equippedWeapon } }));
}

export const getGame = () => state.game;
export const setGame = g => { state.game = g; };

export const getScene = () => state.scene;
export const setScene = s => { state.scene = s; };

export const isDemo = () => state.demo;
export const setDemo = d => { state.demo = d; };

export const isSoundEnabled = () => state.soundEnabled;
export const setSoundEnabled = s => { state.soundEnabled = s; };
