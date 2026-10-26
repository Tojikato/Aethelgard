// ═══════════════════════════════════════════════════════════════════════════
//  GAME STATE & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const $ = id => document.getElementById(id);

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
  soundEnabled: false
};

export const getUser = () => state.user;
export const setUser = u => { state.user = u; };

export const getPlayer = () => state.player;
export const setPlayer = p => { state.player = p; };

export const getGame = () => state.game;
export const setGame = g => { state.game = g; };

export const getScene = () => state.scene;
export const setScene = s => { state.scene = s; };

export const isDemo = () => state.demo;
export const setDemo = d => { state.demo = d; };

export const isSoundEnabled = () => state.soundEnabled;
export const setSoundEnabled = s => { state.soundEnabled = s; };
