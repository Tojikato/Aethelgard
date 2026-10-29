// ═══════════════════════════════════════════════════════════════════════════
//  SCENE: BOOT  (Routes returning players straight to Camp)
// ═══════════════════════════════════════════════════════════════════════════

import { $, getPlayer } from '../services/gameState.js';
import { assetRegistry } from '../services/assetRegistry.js';
import { ensureProceduralActorTextures } from '../services/playerFactory.js';
import { preloadPlayerAssets } from '../services/playerAppearance.js';

export default class Scene_Boot extends Phaser.Scene {
  constructor() {
    super('Scene_Boot');
  }

  preload() {
    preloadPlayerAssets(this);
    // Preload consolidated VFX and background assets from ./assets/aethelgard/
    this.load.image('ash-scatter-tex', './assets/aethelgard/vfx/ash-scatter-verified.jpg');
    this.load.image('fine-ash-tex', './assets/aethelgard/vfx/fine-ash-verified.jpg');
    this.load.image('surface-ash-tex', './assets/aethelgard/vfx/surface-ash-verified.jpg');
    this.load.image('camp-bg-tex', './assets/aethelgard/images/camp-verified.jpg');
    this.load.image('fog-reveal-tex', './assets/aethelgard/images/fog-reveal-verified.jpg');

    // Preload 2.5D Belt-Scroller World Background (Camp)
    this.load.image('bg-ashen-hamlet', './assets/aethelgard/backgrounds/bg-ashen-hamlet.png');
    const directScene = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('scene') : null;
    if (directScene === 'oakhaven') {
      this.load.image('bg-oakhaven-outpost', './assets/aethelgard/backgrounds/bg-oakhaven-outpost.png');
    }

    // Preload 2.5D Hamlet Scenery Pixel-Art Sprites
    this.load.image('scenery-camp', './assets/aethelgard/vfx/hamlet-fire/camp-body.png');
    this.load.image('camp', './assets/aethelgard/vfx/hamlet-fire/camp-body.png');
    this.load.image('camp-body', './assets/aethelgard/vfx/hamlet-fire/camp-body.png');
    this.load.spritesheet('camp-flame', './assets/aethelgard/vfx/hamlet-fire/camp-flame.png', {
      frameWidth: 72,
      frameHeight: 76
    });
    this.load.image('scenery-ruins-stone', './assets/sprites/ruins-stone.png');
    this.load.image('ruins-stone', './assets/sprites/ruins-stone.png');
    this.load.image('scenery-ruins-brick', './assets/sprites/ruins-brick.png');
    this.load.image('ruins-brick', './assets/sprites/ruins-brick.png');
    this.load.image('scenery-arch-stone', './assets/sprites/arch-stone.png');
    this.load.image('arch-stone', './assets/sprites/arch-stone.png');
    this.load.image('scenery-arch-ornate', './assets/sprites/arch-ornate.png');
    this.load.image('arch-ornate', './assets/sprites/arch-ornate.png');
    this.load.image('scenery-wall-connector', './assets/sprites/ruins-wall-connector.png');
    this.load.image('ruins-wall-connector', './assets/sprites/ruins-wall-connector.png');

    // Preload Weapon Sprites
    this.load.image('sword-rusted', './assets/sprites/sword-rusted.png');
    this.load.image('sword-barbed', './assets/sprites/sword-barbed.png');
    this.load.image('sword-cleaver', './assets/sprites/sword-cleaver.png');
    this.load.image('sword-curved', './assets/sprites/sword-curved.png');
    this.load.image('sword-long', './assets/sprites/sword-long.png');
    this.load.image('sword-glowing', './assets/sprites/sword-glowing.png');

    // Preload Potion Sprites
    this.load.image('potion-red', './assets/sprites/potion-red.png');
    this.load.image('potion-teal', './assets/sprites/potion-teal.png');
    this.load.image('potion-purple', './assets/sprites/potion-purple.png');

    // Preload Aethelgard Asset Pack Manifest & Ambient Props
    this.load.json('aethelgard-manifest', './assets/manifest.json');
    this.load.image('prop-dead-tree', './assets/aethelgard/nature/trees/dead-tree.png');
    this.load.image('prop-sign-lantern', './assets/aethelgard/props/outdoor/sign-lantern.png');
    this.load.image('prop-brazier-orange', './assets/aethelgard/props/dungeon/brazier-orange.png');
    this.load.image('brazier-orange', './assets/aethelgard/props/dungeon/brazier-orange.png');
    this.load.image('brazier-body', './assets/aethelgard/vfx/hamlet-fire/brazier-body.png');
    this.load.spritesheet('brazier-flame', './assets/aethelgard/vfx/hamlet-fire/brazier-flame.png', {
      frameWidth: 48,
      frameHeight: 62
    });
    this.load.image('prop-wooden-crate', './assets/aethelgard/props/outdoor/wooden-crate.png');

    // Preload Sanctuary Architecture, Vegetation & Relic Scenery
    this.load.image('sanctuary-broken-wall', './assets/aethelgard/architecture/ruins/broken-wall.png');
    this.load.image('sanctuary-wall-upper', './assets/aethelgard/architecture/ruins/wall-upper.png');
    this.load.image('sanctuary-stairs', './assets/aethelgard/architecture/ruins/stairs.png');
    this.load.image('sanctuary-altar', './assets/aethelgard/props/dungeon/altar.png');
    this.load.image('altar', './assets/aethelgard/props/dungeon/altar.png');
    this.load.image('sanctuary-banner', './assets/aethelgard/props/banners/wall-banner.png');
    this.load.image('sanctuary-ivy', './assets/aethelgard/nature/plants/ivy.png');
    this.load.image('sanctuary-fern', './assets/aethelgard/nature/plants/fern.png');
    this.load.image('sanctuary-bush', './assets/aethelgard/nature/plants/bush.png');
    this.load.image('sanctuary-rocks-a', './assets/aethelgard/nature/rocks/rocks-a.png');
    this.load.image('sanctuary-rocks-d', './assets/aethelgard/nature/rocks/rocks-d.png');
    this.load.image('sanctuary-signpost', './assets/aethelgard/props/outdoor/signpost.png');
    this.load.image('sanctuary-pine', './assets/aethelgard/nature/trees/pine.png');

    // Preload Expanded Hamlet & Oakhaven Props
    this.load.image('dead-tree', './assets/aethelgard/nature/trees/dead-tree.png');
    this.load.image('prop-well', './assets/aethelgard/props/outdoor/well.png');
    this.load.image('well', './assets/aethelgard/props/outdoor/well.png');
    this.load.image('prop-cart', './assets/aethelgard/props/outdoor/cart.png');
    this.load.image('cart', './assets/aethelgard/props/outdoor/cart.png');
    this.load.image('prop-signpost', './assets/aethelgard/props/outdoor/signpost.png');
    this.load.image('signpost', './assets/aethelgard/props/outdoor/signpost.png');
    this.load.image('map-table', './assets/aethelgard/props/interior/map-table.png');
    this.load.image('prop-map-table', './assets/aethelgard/props/interior/map-table.png');
    this.load.image('scroll-a', './assets/aethelgard/items/materials/scroll-a.png');
    this.load.image('noticeboard', './assets/aethelgard/props/interior/noticeboard.png');
    this.load.image('prop-noticeboard', './assets/aethelgard/props/interior/noticeboard.png');

    // Preload Oakhaven Outpost Architecture (if launching directly)
    if (directScene === 'oakhaven') {
      this.load.image('building-cathedral', './assets/aethelgard/architecture/buildings/cathedral.png');
      this.load.image('building-tavern', './assets/aethelgard/architecture/buildings/tavern.png');
      this.load.image('building-cottage', './assets/aethelgard/architecture/buildings/cottage.png');
      this.load.image('building-tall-house', './assets/aethelgard/architecture/buildings/tall-house.png');
      this.load.image('building-timber-house', './assets/aethelgard/architecture/buildings/timber-house.png');
      this.load.image('building-shop-stall', './assets/aethelgard/architecture/buildings/shop-stall.png');
      this.load.image('building-watchtower', './assets/aethelgard/architecture/buildings/watchtower.png');
    }
  }

  create() {
    // Initialize asset registry with preloaded manifest
    assetRegistry.init(this);

    // Generate all procedural actor and particle textures in memory
    ensureProceduralActorTextures(this);

    const player = getPlayer();
    const directScene = new URLSearchParams(window.location.search).get('scene');
    if (directScene === 'oakhaven') {
      if (!player.name) player.name = 'Wanderer';
      if ($('dialogue')) $('dialogue').hidden = true;
      if ($('name-form')) $('name-form').hidden = true;
      const campTop = document.querySelector('.game-top');
      if (campTop) {
        campTop.style.transition = 'none';
        campTop.style.opacity = '1';
        campTop.hidden = false;
      }
      const chapter = $('chapter-title');
      if (chapter) chapter.textContent = 'III · OAKHAVEN OUTPOST';
      this.scene.start('Scene_Oakhaven');
      return;
    }
    const isDirectCamp = directScene === 'camp';
    const isReturning = (player?.name && player.name.length > 0) || isDirectCamp;
    if (isReturning) {
      if (!player.name) player.name = 'Wanderer';
      console.log(`[Scene_Boot] Returning player "${player.name}" detected — skipping Awakening, routing to Camp`);
      if ($('dialogue')) $('dialogue').hidden = true;
      if ($('name-form')) $('name-form').hidden = true;
      const chapter = $('chapter-title');
      if (chapter) chapter.textContent = 'II · THE ASHEN HAMLET';
      this.scene.start('Scene_Camp');
    } else {
      console.log('[Scene_Boot] New player — routing to Awakening');
      this.scene.start('Scene_Awakening');
    }
  }
}
