import { resolveAssetPath } from '../config/AssetRegistry.js';
import { OUTFITS, FRAME_LAYOUT } from '../config/outfits.js';
import { getEquippedOutfit, getEquippedWeapon } from './gameState.js';

export function preloadPlayerAssets(scene) {
  for (const outfit of Object.values(OUTFITS)) {
    if (!scene.textures.exists(outfit.texture)) scene.load.spritesheet(outfit.texture, resolveAssetPath(outfit.texture), { frameWidth: 64, frameHeight: 64 });
    if (!scene.textures.exists(outfit.portrait)) scene.load.image(outfit.portrait, resolveAssetPath(outfit.portrait));
  }
}
function outfit() { return OUTFITS[getEquippedOutfit()] || OUTFITS.modern_stranger; }
export function ensureOutfitAnimations(scene) {
  for (const appearance of Object.values(OUTFITS)) {
    if (!scene.textures.exists(appearance.texture)) continue;
    for (const mode of ['idle', 'walk', 'run', ...(appearance.id === 'ashen_wayfarer' ? ['blade'] : [])]) {
      const key = appearance.texture + '-' + mode;
      if (!scene.anims.exists(key)) scene.anims.create({
        key, frames: FRAME_LAYOUT[mode].map(frame => ({ key: appearance.texture, frame })),
        frameRate: mode === 'idle' ? 4 : mode === 'blade' ? 1 : mode === 'walk' ? 10 : 12, repeat: -1
      });
    }
  }
}
export function playPlayerIdle(player) {
  if (!player?.active) return;
  const appearance = outfit();
  const mode = appearance.id === 'ashen_wayfarer' && getEquippedWeapon() === 'sword-rusted' ? 'blade' : 'idle';
  const key = appearance.texture + '-' + mode;
  const motion = player._wardrobeMotion ||= {};
  motion.mode = 'idle'; motion.stride = 0;
  if (player.anims.currentAnim?.key !== key || !player.anims.isPlaying) player.play(key);
}
export function setPlayerMotionFrame(player, stride, sprinting = false) {
  const mode = sprinting ? 'run' : 'walk';
  const frames = FRAME_LAYOUT[mode];
  const index = frames[Math.floor((((stride % 1) + 1) % 1) * frames.length)];
  const motion = player._wardrobeMotion ||= {};
  motion.mode = mode; motion.stride = stride;
  if (player.anims.isPlaying) player.anims.stop();
  player.setTexture(outfit().texture, index);
}
export function refreshPlayerPortraits() {
  const appearance = outfit();
  for (const image of document.querySelectorAll('[data-player-portrait]')) {
    image.src = resolveAssetPath(appearance.portrait);
    image.alt = appearance.label;
  }
  for (const label of document.querySelectorAll('[data-player-outfit-label]')) label.textContent = appearance.label;
}
export function playerReplyPortrait() {
  const appearance = outfit();
  return '<div class="player-reply-portrait"><img data-player-portrait src="' + resolveAssetPath(appearance.portrait) + '" alt="' + appearance.label + '" width="80" height="80"><div><span class="player-reply-label">THY REPLY</span><span data-player-outfit-label>' + appearance.label + '</span></div></div>';
}
function scatterAsh(scene, player) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!scene.textures.exists('wardrobe-ash')) {
    const g = scene.make.graphics({ add: false }); g.fillStyle(0xc3b7a4).fillRect(0, 0, 3, 3);
    g.generateTexture('wardrobe-ash', 3, 3); g.destroy();
  }
  const emitter = scene.add.particles(player.x, player.y, 'wardrobe-ash', {
    emitting: false, emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-24, -76, 48, 76) },
    lifespan: { min: 400, max: 1000 }, speed: { min: 24, max: 70 }, angle: { min: 0, max: 360 },
    gravityY: -35, accelerationX: { min: -12, max: 12 }, rotate: { start: -90, end: 180 },
    scale: { start: .6, end: 0 }, alpha: { start: .9, end: 0 },
    tint: [0xc3b7a4, 0x817b76, 0x55545b], blendMode: 'ADD'
  }).setDepth(player.depth + .2);
  emitter.once('complete', () => emitter.destroy());
  emitter.explode(70);
  // Mark the burst stopped so Phaser emits COMPLETE after its last particle.
  emitter.stop();
}
export function bindPlayerAppearance(scene, player) {
  ensureOutfitAnimations(scene);
  let previous = getEquippedOutfit();
  const update = () => {
    if (!player.active) return;
    const motion = player._wardrobeMotion;
    const changed = previous !== getEquippedOutfit();
    if (motion && motion.mode !== 'idle') setPlayerMotionFrame(player, motion.stride, motion.mode === 'run');
    else playPlayerIdle(player);
    refreshPlayerPortraits();
    if (changed) scatterAsh(scene, player);
    previous = getEquippedOutfit();
  };
  window.addEventListener('aethelgard:equipment', update);
  scene.events.once('shutdown', () => window.removeEventListener('aethelgard:equipment', update));
  update();
}

