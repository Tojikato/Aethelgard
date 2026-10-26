// ═══════════════════════════════════════════════════════════════════════════
//  SCENE: THE ASHEN HAMLET (Interactive 2.5D Belt-Scroller RPG Environment)
// ═══════════════════════════════════════════════════════════════════════════

import {
  $,
  getPlayer,
  getUser,
  isDemo,
  setScene
} from '../services/gameState.js';

import {
  setFocusStartTime,
  saveFocusResults,
  getUserDocument,
  clearFocusStartTime
} from '../services/firebase.js';

import { CHRONOS } from '../services/chronos.js';
import { worldMapOverlay } from '../ui/WorldMapOverlay.js';
import { createPlayer, ensureProceduralActorTextures } from '../services/playerFactory.js';

import {
  InventoryOverlay,
  getInventoryOverlay,
  setInventoryOverlay,
  destroyActiveInventoryOverlay
} from '../ui/InventoryOverlay.js';

export default class Scene_Camp extends Phaser.Scene {
  constructor() {
    super('Scene_Camp');
    this.worldWidth = 2400;
  }

  init(data = {}) {
    this.entryPosition = data.returnPosition ?? data.spawnPosition ?? data.position ?? null;
  }

  create() {
    console.log('%c[Scene_Camp] create — entering 2.5D Ashen Hamlet', 'color:#a88c5d;font-weight:bold');
    setScene(this);

    // ── 0. Ensure Procedural Actor Textures ─────────────────────────
    ensureProceduralActorTextures(this);

    // ── 1. Camera & Shroud Setup ────────────────────────────────────
    this.worldWidth = 2400;
    const H = (this.scale.height && this.scale.height > 100)
      ? this.scale.height
      : (window.innerHeight > 100 ? window.innerHeight : 720);
    const camera = this.cameras.main;
    camera.resetFX();
    camera.setBackgroundColor('#060608');
    camera.setAlpha(1);
    camera.setZoom(1);
    camera.setBounds(0, 0, this.worldWidth, H);

    $('dialogue')?.remove();
    $('name-form')?.remove();
    if ($('arrival')) $('arrival').hidden = true;
    if ($('chapter-title')) $('chapter-title').textContent = 'II · THE ASHEN HAMLET';
    if ($('game-shell')) $('game-shell').inert = false;

    const campTop = document.querySelector('.game-top');
    if (campTop) {
      campTop.style.transition = 'none';
      campTop.style.opacity = '1';
      campTop.hidden = false;
    }

    // ── 2. Realistic Eyelid Blink Sequence ──────────────────────────
    this.createEyelidBlinkSequence();

    // ── 3. Internal State, Chronos & NPC Progress ───────────────────
    this.focusing = false;       // true while a focus session is active
    this.focusElapsed = 0;       // seconds elapsed in current session
    this.intervalId = null;      // native setInterval id
    this.activeTarget = null;    // currently proximate interactive object
    this.joystickVector = { x: 0, y: 0 };

    // Watcher NPC Quest & Gift Persistence State
    this.watcherState = {
      giftClaimed: localStorage.getItem('aethelgard_watcher_gift') === 'true',
      trialCompleted: localStorage.getItem('aethelgard_watcher_trial') === 'true'
    };

    // ── 4. Generate Procedural Pixel-Art Textures ───────────────────
    this.ensureProceduralTextures();

    // ── 5. Ambient Atmospheric Ash & Ground Mist ────────────────────
    this.createAmbientAsh();

    // ── 6. Backdrop & Walkable Ground Plane (Cached Static Layer) ──
    this.renderBackdrop(this.scale.width, this.scale.height);

    // ── 7. Hamlet Scenery & Actors ──────────────────────────────────
    this.buildHamletEntities();
    camera.startFollow(this.player, true, 0.1, 0.1);

    // ── 8. Input Controls (Desktop WASD, F & Cursors) ───────────────
    this.setupControls();

    // ── 8b. Real-Time Mini-Map HUD ─────────────────────────────────
    this.createMiniMapHUD();

    // ── 8c. Awakening Narrative Toast & Rising Sequence ────────────
    if (!sessionStorage.getItem('aethelgard_awakening_toast_shown')) {
      sessionStorage.setItem('aethelgard_awakening_toast_shown', 'true');
      this.showAwakeningSequence();
    }

    // ── 9. DOM UI (HUD, Prompts, Modals & Mobile Controls) ──────────
    this.buildDOMUI();

    // ── 10. Inventory Overlay ───────────────────────────────────────
    const invOverlay = new InventoryOverlay();
    setInventoryOverlay(invOverlay);
    window.inventoryOverlay = invOverlay;
    invOverlay.build();
    const user = getUser();
    if (!isDemo() && user) invOverlay.subscribe(user.uid);

    // ── 11. Recover In-Progress Focus Session ────────────────────────
    this.recoverFocusSession();

    // ── 12. Responsive Resize Handling ──────────────────────────────
    this.resizeCb = size => {
      this.ashZone.width = size.width;
      this.renderBackdrop(this.worldWidth, size.height);
      this.layoutHamlet(this.worldWidth, size.height);
    };
    this.scale.on('resize', this.resizeCb);

    // ── 13. Teardown & Cleanup ──────────────────────────────────────
    this.events.once('shutdown', () => {
      this.teardown();
    });
  }

  // ═════════════════════════════════════════════════════════════════
  //  PROCEDURAL PIXEL ART GENERATION
  // ═════════════════════════════════════════════════════════════════

  ensureProceduralTextures() {
    // 1. Ash particle texture
    if (!this.textures.exists('ash_particle')) {
      const gfx = this.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(0xffffff, 0.35);
      gfx.fillCircle(4, 4, 3.8);
      gfx.fillStyle(0xffffff, 0.85);
      gfx.beginPath();
      gfx.moveTo(3, 1);
      gfx.lineTo(6, 2);
      gfx.lineTo(7, 5);
      gfx.lineTo(5, 7);
      gfx.lineTo(2, 6);
      gfx.lineTo(1, 4);
      gfx.closePath();
      gfx.fillPath();
      gfx.fillStyle(0xffffff, 1.0);
      gfx.fillRect(3, 3, 2, 2);
      gfx.generateTexture('ash_particle', 8, 8);
      gfx.destroy();
    }
    if (!this.textures.exists('ash')) {
      const dot = this.make.graphics({ x: 0, y: 0, add: false });
      dot.fillStyle(0xffffff, 1.0).fillRect(0, 0, 4, 4);
      dot.generateTexture('ash', 4, 4);
      dot.destroy();
    }

    // 2. Side-View Adventurer Player Frames (Idle & Walk)
    if (!this.textures.exists('player_idle_0')) {
      const W = 20;
      const H = 32;

      const drawAdventurer = (ctx, animPhase, isWalk) => {
        ctx.clearRect(0, 0, W, H);
        const bob = isWalk ? (animPhase % 2 === 1 ? -1 : 0) : (animPhase === 1 ? -1 : 0);
        const legOffset = isWalk ? (animPhase === 0 ? 3 : animPhase === 1 ? 0 : animPhase === 2 ? -3 : 0) : 0;

        // Scabbard & Back Cloak
        ctx.fillStyle = '#16141a';
        ctx.fillRect(4, 12 + bob, 12, 13);
        ctx.fillStyle = '#7a7687';
        ctx.fillRect(15, 6 + bob, 2, 8); // Sword blade
        ctx.fillStyle = '#9d8a68';
        ctx.fillRect(14, 5 + bob, 4, 2); // Crossguard

        // Boots & Legs
        ctx.fillStyle = '#2c1e14';
        ctx.fillRect(7 - legOffset, 24, 3, 5);
        ctx.fillStyle = '#4a3321';
        ctx.fillRect(6 - legOffset, 28, 4, 3);

        ctx.fillStyle = '#2c1e14';
        ctx.fillRect(11 + legOffset, 24, 3, 5);
        ctx.fillStyle = '#4a3321';
        ctx.fillRect(11 + legOffset, 28, 4, 3);

        // Torso / Iron Cuirass
        ctx.fillStyle = '#2c2736';
        ctx.fillRect(6, 12 + bob, 9, 11);
        ctx.fillStyle = '#656073';
        ctx.fillRect(8, 13 + bob, 5, 7);
        ctx.fillStyle = '#a19cb3';
        ctx.fillRect(9, 14 + bob, 3, 2);

        // Leather Belt & Tarnished Brass Buckle
        ctx.fillStyle = '#422c19';
        ctx.fillRect(6, 21 + bob, 9, 3);
        ctx.fillStyle = '#9d8a68';
        ctx.fillRect(9, 21 + bob, 3, 3);

        // Cloak Shoulders & Pauldrons
        ctx.fillStyle = '#3a3447';
        ctx.fillRect(4, 10 + bob, 13, 5);
        ctx.fillStyle = '#544c66';
        ctx.fillRect(4, 10 + bob, 3, 4);
        ctx.fillRect(14, 10 + bob, 3, 4);

        // Hood & Shrouded Face
        ctx.fillStyle = '#2b2636';
        ctx.fillRect(6, 3 + bob, 9, 9);
        ctx.fillStyle = '#17141f';
        ctx.fillRect(7, 4 + bob, 8, 7);
        ctx.fillStyle = '#08070a';
        ctx.fillRect(8, 5 + bob, 6, 5);
        // Amber Eye Visor Glimmer
        ctx.fillStyle = '#ff9922';
        ctx.fillRect(10, 6 + bob, 2, 2);
        // Hood Edge Highlight
        ctx.fillStyle = '#4a425c';
        ctx.fillRect(7, 2 + bob, 7, 2);

        // Hem Sway
        const sway = isWalk ? (animPhase === 0 ? 1 : animPhase === 2 ? -1 : 0) : 0;
        ctx.fillStyle = '#282333';
        ctx.fillRect(4 + sway, 23 + bob, 12, 3);
      };

      for (let i = 0; i < 2; i++) {
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        drawAdventurer(c.getContext('2d'), i, false);
        this.textures.addCanvas(`player_idle_${i}`, c);
      }
      for (let i = 0; i < 4; i++) {
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        drawAdventurer(c.getContext('2d'), i, true);
        this.textures.addCanvas(`player_walk_${i}`, c);
      }

      this.anims.create({
        key: 'player-idle',
        frames: [
          { key: 'player_idle_0' },
          { key: 'player_idle_1' }
        ],
        frameRate: 2.5,
        repeat: -1
      });

      this.anims.create({
        key: 'player-walk',
        frames: [
          { key: 'player_walk_0' },
          { key: 'player_walk_1' },
          { key: 'player_walk_2' },
          { key: 'player_walk_3' }
        ],
        frameRate: 8,
        repeat: -1
      });
    }

    // 3. "THE ASHEN WATCHER — Mysterious Wayfarer" NPC Sprite Frames
    if (!this.textures.exists('watcher_idle_0')) {
      const W = 22;
      const H = 34;
      const drawWatcher = (ctx, animPhase) => {
        ctx.clearRect(0, 0, W, H);
        const bob = animPhase === 1 ? -1 : 0;

        // Palette: Tattered dark traveler's cloak, weathered charcoal leather, amber eye glow, stave
        const C_CLOAK_DARK = '#141217';
        const C_CLOAK_MID = '#221f28';
        const C_CLOAK_LIGHT = '#373240';
        const C_LEATHER = '#3a2a1d';
        const C_ASH_HEM = '#484352';
        const C_AMBER = '#ffaa33';
        const C_TEAL = '#7fe0d4';
        const C_WOOD = '#523720';
        const C_WOOD_LIGHT = '#785333';

        // Ash-wood stave held in right hand (drawn first so cloak overlays)
        ctx.fillStyle = C_WOOD;
        ctx.fillRect(18, 4 + bob, 2, 28);
        ctx.fillStyle = C_WOOD_LIGHT;
        ctx.fillRect(18, 4 + bob, 1, 28);
        // Stave rune headpiece
        ctx.fillStyle = C_TEAL;
        ctx.fillRect(17, 3 + bob, 4, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(18, 4 + bob, 2, 1);

        // Weathered traveler's cloak (back)
        ctx.fillStyle = C_CLOAK_DARK;
        ctx.fillRect(4, 12 + bob, 13, 19);

        // Traveler's cowl and mantle
        ctx.fillStyle = C_CLOAK_MID;
        ctx.fillRect(5, 10 + bob, 11, 19);
        // Tattered cloak hem
        ctx.fillStyle = C_ASH_HEM;
        ctx.fillRect(4, 28 + bob, 13, 3);
        ctx.clearRect(6, 30 + bob, 2, 2);
        ctx.clearRect(12, 30 + bob, 2, 2);

        // Belt & Traveler's pouch
        ctx.fillStyle = C_LEATHER;
        ctx.fillRect(5, 20 + bob, 11, 3);
        ctx.fillRect(12, 21 + bob, 4, 4);

        // Hand clutching stave
        ctx.fillStyle = '#3a2a1d';
        ctx.fillRect(17, 16 + bob, 3, 3);

        // Deep hooded cowl
        ctx.fillStyle = C_CLOAK_MID;
        ctx.fillRect(5, 3 + bob, 11, 9);
        ctx.fillStyle = C_CLOAK_DARK;
        ctx.fillRect(6, 4 + bob, 9, 8);
        // Shrouded dark void face
        ctx.fillStyle = '#060508';
        ctx.fillRect(7, 5 + bob, 7, 6);

        // Mysterious luminous amber eyes
        ctx.fillStyle = C_AMBER;
        ctx.fillRect(8, 7 + bob, 2, 2);
        ctx.fillRect(12, 7 + bob, 2, 2);

        // Hood highlight & cowl fold
        ctx.fillStyle = C_CLOAK_LIGHT;
        ctx.fillRect(6, 2 + bob, 9, 2);
        ctx.fillRect(4, 10 + bob, 3, 4);
      };

      for (let i = 0; i < 2; i++) {
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        drawWatcher(c.getContext('2d'), i);
        this.textures.addCanvas(`watcher_idle_${i}`, c);
      }

      this.anims.create({
        key: 'watcher-idle',
        frames: [
          { key: 'watcher_idle_0' },
          { key: 'watcher_idle_1' }
        ],
        frameRate: 2,
        repeat: -1
      });
    }

    // 4. Ancient Vault Chest Sprite
    if (!this.textures.exists('vault_chest')) {
      const W = 30;
      const H = 24;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const ctx = c.getContext('2d');

      ctx.fillStyle = '#3a291b';
      ctx.fillRect(2, 6, 26, 17);
      ctx.fillStyle = '#241a12';
      ctx.fillRect(4, 10, 22, 1);
      ctx.fillRect(4, 16, 22, 1);

      // Curved Lid
      ctx.fillStyle = '#4f3925';
      ctx.fillRect(3, 4, 24, 4);
      ctx.fillRect(5, 2, 20, 2);

      // Iron Bands & Braces
      ctx.fillStyle = '#1f1d24';
      ctx.fillRect(2, 2, 3, 21);
      ctx.fillRect(25, 2, 3, 21);
      ctx.fillRect(9, 2, 3, 21);
      ctx.fillRect(18, 2, 3, 21);
      ctx.fillRect(2, 6, 26, 3);

      // Rivets
      ctx.fillStyle = '#4c4857';
      ctx.fillRect(3, 3, 1, 1);
      ctx.fillRect(10, 3, 1, 1);
      ctx.fillRect(19, 3, 1, 1);
      ctx.fillRect(26, 3, 1, 1);
      ctx.fillRect(10, 13, 1, 1);
      ctx.fillRect(19, 13, 1, 1);

      // Runic Lock
      ctx.fillStyle = '#9d8a68';
      ctx.fillRect(13, 7, 4, 7);
      ctx.fillStyle = '#7fe0d4';
      ctx.fillRect(14, 9, 2, 3);

      this.textures.addCanvas('vault_chest', c);
    }
  }

  // ═════════════════════════════════════════════════════════════════
  //  HAMLET ENTITIES & 2.5D LAYOUT
  // ═════════════════════════════════════════════════════════════════

  buildHamletEntities() {
    const W = this.worldWidth || 2400;
    const H = this.scale.height || 720;
    const baseLineY = H * 0.74;

    // ── 1. Left Sanctuary Ruins Vegetation & Camp Enclosure (Depth: 12-25) ──
    if (this.textures.exists('sanctuary-ivy')) {
      this.ruinsIvy = this.add.image(180, H * 0.60, 'sanctuary-ivy')
        .setOrigin(0.5, 1).setScale(1.0).setDepth(22);
    }
    if (this.textures.exists('sanctuary-fern')) {
      this.ruinsFern = this.add.image(95, H * 0.74, 'sanctuary-fern')
        .setOrigin(0.5, 1).setScale(1.1).setDepth(24);
    }

    // Distant courtyard walls behind camp (Horizon Y, depth 12 - strictly above and behind tents, zero overlap with camp)
    if (this.textures.exists('sanctuary-wall-upper')) {
      this.bgWallCenter = this.add.image(1050, H * 0.54, 'sanctuary-wall-upper')
        .setOrigin(0.5, 1).setScale(0.68).setDepth(12);
    }
    if (this.textures.exists('sanctuary-pine')) {
      this.bgPineCenter = this.add.image(1380, H * 0.54, 'sanctuary-pine')
        .setOrigin(0.5, 1).setScale(0.70).setDepth(12);
    }

    // Right Gatehouse enclosure: connecting curtain wall & outer defensive wall
    if (this.textures.exists('ruins-wall-connector')) {
      this.gateWallConnector = this.add.image(2050, baseLineY, 'ruins-wall-connector')
        .setOrigin(0.5, 1).setScale(0.95).setDepth(20);
      this.gateWallOuter = this.add.image(2380, baseLineY, 'ruins-wall-connector')
        .setOrigin(0.5, 1).setScale(0.95).setFlipX(true).setDepth(20);
    }
    if (this.textures.exists('sanctuary-banner')) {
      this.tatteredBanner = this.add.image(2050, H * 0.63, 'sanctuary-banner')
        .setOrigin(0.5, 1).setScale(0.92).setDepth(24);
    }

    // ── 2. Preserved Existing Scenery Objects (Origin: 0.5, 1) ──────────
    // Left: Ancient Ruins & Backdrop Dead Tree (Unified baseline)
    const deadTreeKey = this.textures.exists('dead-tree') ? 'dead-tree' : 'prop-dead-tree';
    if (this.textures.exists(deadTreeKey)) {
      this.deadTree = this.add.image(90, H * 0.67, deadTreeKey)
        .setOrigin(0.5, 1).setScale(1.05);
    }
    this.ruinsBrick = this.add.image(240, baseLineY, 'ruins-brick')
        .setOrigin(0.5, 1).setScale(0.95);
    this.ruinsStone = this.add.image(440, baseLineY, 'ruins-stone')
        .setOrigin(0.5, 1).setScale(0.95);

    // Left: Vault of Echoes Chest & Wooden Crate
    if (this.textures.exists('prop-wooden-crate')) {
      this.woodenCrate = this.add.image(290, H * 0.79, 'prop-wooden-crate')
        .setOrigin(0.5, 1).setScale(1.0);
    }
    this.vaultChest = this.add.image(380, H * 0.77, 'vault_chest')
      .setOrigin(0.5, 1).setScale(1.8);

    // ── 3. Interactive Ground Additions & Natural Props ─────────────
    // Ancient Village Well
    const wellKey = this.textures.exists('well') ? 'well' : 'prop-well';
    if (this.textures.exists(wellKey)) {
      this.well = this.add.image(620, H * 0.76, wellKey)
        .setOrigin(0.5, 1).setScale(1.0);
    }

    if (this.textures.exists('sanctuary-altar')) {
      this.sanctuaryAltar = this.add.image(780, H * 0.67, 'sanctuary-altar')
        .setOrigin(0.5, 1).setScale(1.05);

      // Celestial teal resonance particle emitter
      this.altarResonanceParticles = this.add.particles(this.sanctuaryAltar.x, this.sanctuaryAltar.y - 25, 'ash_particle', {
        speedY: { min: -25, max: -65 },
        speedX: { min: -15, max: 15 },
        lifespan: { min: 800, max: 1400 },
        scale: { start: 0.65, end: 0 },
        alpha: { start: 0.85, end: 0 },
        tint: [0x7fe0d4, 0x4dd0e1, 0x00bcd4, 0xffffff],
        blendMode: 'ADD',
        emitting: false
      });
      this.altarResonanceParticles.setDepth(160);
    }

    if (this.textures.exists('sanctuary-signpost')) {
      this.ancientPlaque = this.add.image(920, H * 0.72, 'sanctuary-signpost')
        .setOrigin(0.5, 1).setScale(1.25);
    }

    if (this.textures.exists('sanctuary-rocks-a')) {
      this.ruinsRocks = this.add.image(560, baseLineY, 'sanctuary-rocks-a')
        .setOrigin(0.5, 1).setScale(0.95);
    }

    // Supply Cart
    const cartKey = this.textures.exists('cart') ? 'cart' : 'prop-cart';
    if (this.textures.exists(cartKey)) {
      this.cart = this.add.image(1060, H * 0.77, cartKey)
        .setOrigin(0.5, 1).setScale(1.0);
    }

    // ── 4. Center: PROTECTED Campsite & Hearth (UNTOUCHED) ──────────
    this.campScenery = this.add.image(1200, H * 0.75, 'camp')
      .setOrigin(0.5, 1).setScale(1.0);

    // Campfire Hearth Rising Ember Particles
    this.campfireEmbers = this.add.particles(this.campScenery.x - 22, this.campScenery.y - 25, 'ash_particle', {
      speedY: { min: -30, max: -70 },
      speedX: { min: -12, max: 12 },
      lifespan: { min: 1400, max: 2400 },
      scale: { start: 0.55, end: 0 },
      alpha: { start: 0.85, end: 0 },
      tint: [0xffe680, 0xffaa33, 0xff5500, 0xff2200],
      blendMode: 'ADD',
      frequency: 90,
      quantity: 2
    });

    // ── 4b. East Approach & Map Table (x: 1400 - 1850) ─────────────
    if (this.textures.exists('prop-sign-lantern')) {
      this.signLantern = this.add.image(1420, baseLineY, 'prop-sign-lantern')
        .setOrigin(0.5, 1).setScale(0.85);
    }

    // Atlas Table next to The Ashen Watcher's Arch
    const mapTableKey = this.textures.exists('map-table') ? 'map-table' : 'prop-map-table';
    if (this.textures.exists(mapTableKey)) {
      this.mapTable = this.add.image(1640, baseLineY, mapTableKey)
        .setOrigin(0.5, 1);
    }

    // Right: The Wayfarer's Archway & The Ashen Watcher NPC
    this.archOrnate = this.add.image(1830, baseLineY, 'arch-ornate')
      .setOrigin(0.5, 1).setScale(0.95);
    this.watcher = this.add.sprite(1830, baseLineY, 'watcher_idle_0')
      .setOrigin(0.5, 1).setScale(2.4);
    this.watcher.play('watcher-idle');

    // ── 4c. Eastern Gatehouse Enclosure (x: 1950 - 2400) ───────────
    if (this.textures.exists('sanctuary-bush')) {
      this.gateBush = this.add.image(1980, H * 0.71, 'sanctuary-bush')
        .setOrigin(0.5, 1).setScale(0.95);
    }

    // Far Right Edge: Hamlet Gate flanked by Dungeon Braziers
    if (this.textures.exists('prop-brazier-orange')) {
      this.brazierGateLeft = this.add.image(2100, baseLineY, 'prop-brazier-orange')
        .setOrigin(0.5, 1).setScale(0.9);
      this.brazierGateRight = this.add.image(2360, baseLineY, 'prop-brazier-orange')
        .setOrigin(0.5, 1).setScale(0.9);

      // Brazier ember particles
      this.brazierEmbersLeft = this.add.particles(this.brazierGateLeft.x, this.brazierGateLeft.y - 70, 'ash_particle', {
        speedY: { min: -18, max: -45 },
        speedX: { min: -8, max: 8 },
        lifespan: { min: 900, max: 1500 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.75, end: 0 },
        tint: [0xffcc44, 0xff7711, 0xff3300],
        blendMode: 'ADD',
        frequency: 220,
        quantity: 1
      });

      this.brazierEmbersRight = this.add.particles(this.brazierGateRight.x, this.brazierGateRight.y - 70, 'ash_particle', {
        speedY: { min: -18, max: -45 },
        speedX: { min: -8, max: 8 },
        lifespan: { min: 900, max: 1500 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.75, end: 0 },
        tint: [0xffcc44, 0xff7711, 0xff3300],
        blendMode: 'ADD',
        frequency: 220,
        quantity: 1
      });
    }

    this.archStone = this.add.image(2240, baseLineY, 'arch-stone')
      .setOrigin(0.5, 1).setScale(0.95);

    if (this.textures.exists('sanctuary-rocks-d')) {
      this.gateRocks = this.add.image(2390, baseLineY, 'sanctuary-rocks-d')
        .setOrigin(0.5, 1).setScale(0.90);
    }

    // ── 5. Foreground Edge Vignette (Framing, non-interactive) ──────
    if (this.textures.exists('sanctuary-fern')) {
      this.fgFernLeft = this.add.image(40, H * 0.97, 'sanctuary-fern')
        .setOrigin(0.5, 1).setScale(1.25).setTint(0x322e3d).setDepth(950);
      this.fgFernRight = this.add.image(2360, H * 0.97, 'sanctuary-fern')
        .setOrigin(0.5, 1).setScale(1.25).setTint(0x322e3d).setFlipX(true).setDepth(950);
    }

    // ── 6. Side-View Adventurer Player Character (Spawns on Cobblestone Road near Hearth) ──
    const defaultSpawnX = 1270;
    const defaultSpawnY = H * 0.76;
    const spawnX = this.entryPosition ? this.entryPosition.x : defaultSpawnX;
    const spawnY = this.entryPosition ? this.entryPosition.y : defaultSpawnY;

    this.player = createPlayer(this, spawnX, spawnY);

    // Scenery list for Y-sorting on the ground plane
    this.ySortedObjects = [
      this.deadTree,
      this.ruinsBrick,
      this.ruinsStone,
      this.woodenCrate,
      this.vaultChest,
      this.ruinsRocks,
      this.well,
      this.sanctuaryAltar,
      this.ancientPlaque,
      this.cart,
      this.campScenery,
      this.signLantern,
      this.mapTable,
      this.gateBush,
      this.gateWallConnector,
      this.gateWallOuter,
      this.archOrnate,
      this.watcher,
      this.brazierGateLeft,
      this.archStone,
      this.brazierGateRight,
      this.gateRocks,
      this.player
    ].filter(Boolean);

    this.updateSortYProperties();
    this.rebuildStaticObstacleBoxes();
    this.rebuildInteractionTargets();
    this.rebuildStaticObstacleBoxes();
    this.rebuildInteractionTargets();
  }

  updateSortYProperties() {
    if (!this.campScenery) return;
    // Fix A: Set camp sortY at the base of the tents and fire pit (approx 42% up from bottom),
    // ensuring the ground dirt patch always renders UNDER the player's feet!
    this.campScenery.sortY = this.campScenery.y - (this.campScenery.displayHeight * 0.42);
    this.campScenery.setDepth(Math.floor(this.campScenery.sortY));

    if (this.deadTree) { this.deadTree.sortY = this.deadTree.y; this.deadTree.setDepth(Math.floor(this.deadTree.sortY)); }
    if (this.ruinsBrick) { this.ruinsBrick.sortY = this.ruinsBrick.y - 1; this.ruinsBrick.setDepth(Math.floor(this.ruinsBrick.sortY)); }
    if (this.ruinsStone) { this.ruinsStone.sortY = this.ruinsStone.y; this.ruinsStone.setDepth(Math.floor(this.ruinsStone.sortY)); }
    if (this.woodenCrate) { this.woodenCrate.sortY = this.woodenCrate.y; this.woodenCrate.setDepth(Math.floor(this.woodenCrate.sortY)); }
    if (this.vaultChest) { this.vaultChest.sortY = this.vaultChest.y; this.vaultChest.setDepth(Math.floor(this.vaultChest.sortY)); }
    if (this.ruinsRocks) { this.ruinsRocks.sortY = this.ruinsRocks.y; this.ruinsRocks.setDepth(Math.floor(this.ruinsRocks.sortY)); }
    if (this.well) { this.well.sortY = this.well.y - 10; this.well.setDepth(Math.floor(this.well.sortY)); }
    if (this.signpost) { this.signpost.sortY = this.signpost.y - 5; this.signpost.setDepth(Math.floor(this.signpost.sortY)); }
    if (this.cart) { this.cart.sortY = this.cart.y - 12; this.cart.setDepth(Math.floor(this.cart.sortY)); }
    if (this.mapTable) { this.mapTable.sortY = this.mapTable.y - 8; this.mapTable.setDepth(Math.floor(this.mapTable.sortY)); }
    if (this.sanctuaryAltar) { this.sanctuaryAltar.sortY = this.sanctuaryAltar.y; this.sanctuaryAltar.setDepth(Math.floor(this.sanctuaryAltar.sortY)); }
    if (this.ancientPlaque) { this.ancientPlaque.sortY = this.ancientPlaque.y; this.ancientPlaque.setDepth(Math.floor(this.ancientPlaque.sortY)); }
    if (this.signLantern) { this.signLantern.sortY = this.signLantern.y; this.signLantern.setDepth(Math.floor(this.signLantern.sortY)); }
    if (this.gateBush) { this.gateBush.sortY = this.gateBush.y; this.gateBush.setDepth(Math.floor(this.gateBush.sortY)); }
    if (this.gateWallConnector) { this.gateWallConnector.sortY = this.gateWallConnector.y - 4; this.gateWallConnector.setDepth(20); }
    if (this.gateWallOuter) { this.gateWallOuter.sortY = this.gateWallOuter.y - 4; this.gateWallOuter.setDepth(20); }
    if (this.archOrnate) { this.archOrnate.sortY = this.archOrnate.y; this.archOrnate.setDepth(Math.floor(this.archOrnate.sortY)); }
    if (this.watcher) { this.watcher.sortY = this.watcher.y; this.watcher.setDepth(Math.floor(this.watcher.sortY)); }
    if (this.brazierGateLeft) { this.brazierGateLeft.sortY = this.brazierGateLeft.y; this.brazierGateLeft.setDepth(Math.floor(this.brazierGateLeft.sortY)); }
    if (this.archStone) { this.archStone.sortY = this.archStone.y; this.archStone.setDepth(Math.floor(this.archStone.sortY)); }
    if (this.brazierGateRight) { this.brazierGateRight.sortY = this.brazierGateRight.y; this.brazierGateRight.setDepth(Math.floor(this.brazierGateRight.sortY)); }
    if (this.gateRocks) { this.gateRocks.sortY = this.gateRocks.y; this.gateRocks.setDepth(Math.floor(this.gateRocks.sortY)); }
    if (this.player) { this.player.sortY = this.player.y; this.player.setDepth(Math.floor(this.player.sortY)); }
    if (this.campfireEmbers && this.campScenery) {
      this.campfireEmbers.setDepth(Math.floor(this.campScenery.sortY + 2));
    }
  }

  rebuildStaticObstacleBoxes() {
    this.staticObstacleBoxes = this.getObstacleBoxes();
  }

  rebuildInteractionTargets() {
    this.interactionTargets = [
      {
        id: 'camp',
        title: 'Campfire Hearth',
        prompt: '[F] MEDITATE AT HEARTH',
        x: this.campScenery ? this.campScenery.x - 22 : 0,
        y: this.campScenery ? this.campScenery.y - 15 : 0,
        radius: 110,
        action: () => this.openHearthModal()
      },
      {
        id: 'vault',
        title: 'Vault of Echoes',
        prompt: '[F] INSPECT VAULT OF ECHOES',
        x: this.vaultChest ? this.vaultChest.x : 0,
        y: this.vaultChest ? this.vaultChest.y - 10 : 0,
        radius: 80,
        action: () => {
          const inv = getInventoryOverlay();
          if (inv) inv.show();
        }
      },
      {
        id: 'map-table',
        title: 'The Atlas Table',
        prompt: '[F] EXAMINE ATLAS TABLE',
        x: this.mapTable ? this.mapTable.x : 1640,
        y: this.mapTable ? this.mapTable.y - 12 : 520,
        radius: 80,
        action: () => worldMapOverlay.open()
      },
      {
        id: 'watcher',
        title: 'The Ashen Watcher',
        prompt: '[F] SPEAK WITH THE STRANGER',
        x: this.watcher ? this.watcher.x : 0,
        y: this.watcher ? this.watcher.y - 20 : 0,
        radius: 85,
        action: () => this.openWatcherDialogue()
      },
      {
        id: 'gate',
        title: 'Hamlet Gate',
        prompt: '[F] EXAMINE HAMLET GATE',
        x: this.archStone ? this.archStone.x : 0,
        y: this.archStone ? this.archStone.y - 20 : 0,
        radius: 95,
        action: () => this.openGateModal()
      },
      {
        id: 'plaque',
        title: 'Sanctuary Runestone',
        prompt: '[F] READ RUNIC PLAQUE',
        x: this.ancientPlaque ? this.ancientPlaque.x : 920,
        y: this.ancientPlaque ? this.ancientPlaque.y - 15 : 520,
        radius: 75,
        action: () => this.openLoreModal('plaque')
      },
      {
        id: 'altar',
        title: 'Sanctuary Altar',
        prompt: '[F] COMMUNE WITH RUNIC ALTAR',
        x: this.sanctuaryAltar ? this.sanctuaryAltar.x : 780,
        y: this.sanctuaryAltar ? this.sanctuaryAltar.y - 15 : 480,
        radius: 80,
        action: () => this.openLoreModal('altar')
      },
      {
        id: 'banner',
        title: 'Tattered Crest',
        prompt: '[F] EXAMINE TATTERED CREST',
        x: this.tatteredBanner ? this.tatteredBanner.x : 2050,
        y: this.tatteredBanner ? this.tatteredBanner.y - 15 : 450,
        radius: 75,
        action: () => this.openLoreModal('banner')
      }
    ];
  }

  layoutHamlet(W, H) {
    if (!this.ruinsBrick) return;
    const baseLineY = H * 0.74;

    // Middle-background
    if (this.ruinsIvy) this.ruinsIvy.setPosition(180, H * 0.60);
    if (this.ruinsFern) this.ruinsFern.setPosition(95, H * 0.74);
    if (this.ruinsRocks) this.ruinsRocks.setPosition(560, baseLineY);

    if (this.bgWallCenter) this.bgWallCenter.setPosition(1050, H * 0.54);
    if (this.bgPineCenter) this.bgPineCenter.setPosition(1380, H * 0.54);

    if (this.gateWallConnector) this.gateWallConnector.setPosition(2050, baseLineY);
    if (this.gateWallOuter) this.gateWallOuter.setPosition(2380, baseLineY);
    if (this.tatteredBanner) this.tatteredBanner.setPosition(2050, H * 0.63);
    if (this.gateBush) this.gateBush.setPosition(1980, H * 0.71);
    if (this.gateRocks) this.gateRocks.setPosition(2390, baseLineY);

    if (this.fgFernLeft) this.fgFernLeft.setPosition(40, H * 0.97);
    if (this.fgFernRight) this.fgFernRight.setPosition(2360, H * 0.97);

    // Playable layer
    if (this.deadTree) this.deadTree.setPosition(90, H * 0.67);
    this.ruinsBrick.setPosition(240, baseLineY);
    this.ruinsStone.setPosition(440, baseLineY);
    if (this.woodenCrate) this.woodenCrate.setPosition(290, H * 0.79);
    this.vaultChest.setPosition(380, H * 0.77);
    if (this.well) this.well.setPosition(620, H * 0.76);

    if (this.sanctuaryAltar) {
      this.sanctuaryAltar.setPosition(780, H * 0.67);
      if (this.altarResonanceParticles) this.altarResonanceParticles.setPosition(this.sanctuaryAltar.x, this.sanctuaryAltar.y - 25);
    }
    if (this.ancientPlaque) this.ancientPlaque.setPosition(920, H * 0.72);
    if (this.cart) this.cart.setPosition(1060, H * 0.77);

    this.campScenery.setPosition(1200, H * 0.75);

    if (this.campfireEmbers) {
      this.campfireEmbers.setPosition(this.campScenery.x - 22, this.campScenery.y - 25);
    }

    if (this.signLantern) this.signLantern.setPosition(1420, baseLineY);
    if (this.mapTable) this.mapTable.setPosition(1640, baseLineY);
    this.archOrnate.setPosition(1830, baseLineY);
    this.watcher.setPosition(1830, baseLineY);

    if (this.brazierGateLeft) {
      this.brazierGateLeft.setPosition(2100, baseLineY);
      if (this.brazierEmbersLeft) this.brazierEmbersLeft.setPosition(this.brazierGateLeft.x, this.brazierGateLeft.y - 70);
    }
    this.archStone.setPosition(2240, baseLineY);
    if (this.brazierGateRight) {
      this.brazierGateRight.setPosition(2360, baseLineY);
      if (this.brazierEmbersRight) this.brazierEmbersRight.setPosition(this.brazierGateRight.x, this.brazierGateRight.y - 70);
    }

    this.updateSortYProperties();
    this.rebuildStaticObstacleBoxes();
    this.rebuildInteractionTargets();
    // Keep player in bounds
    const bounds = this.getWalkBounds();
    this.player.x = Phaser.Math.Clamp(this.player.x, bounds.minX, bounds.maxX);
    this.player.y = Phaser.Math.Clamp(this.player.y, bounds.minY, bounds.maxY);
  }

  getWalkBounds() {
    const W = this.worldWidth || 2400;
    const H = this.scale.height;
    return {
      minX: 45,
      maxX: W - 45,
      minY: H * 0.54,
      maxY: H * 0.94
    };
  }

  // ═════════════════════════════════════════════════════════════════
  //  SOLID 2.5D FOOTPRINT COLLISION BOXES (Fix B)
  // ═════════════════════════════════════════════════════════════════

  getObstacleBoxes() {
    const boxes = [];

    // 1. Left Ruins & Chest Footprints
    if (this.ruinsBrick) {
      boxes.push({
        minX: this.ruinsBrick.x - 75,
        maxX: this.ruinsBrick.x + 75,
        minY: this.ruinsBrick.y - 32,
        maxY: this.ruinsBrick.y + 6
      });
    }
    if (this.ruinsStone) {
      boxes.push({
        minX: this.ruinsStone.x - 80,
        maxX: this.ruinsStone.x + 80,
        minY: this.ruinsStone.y - 32,
        maxY: this.ruinsStone.y + 6
      });
    }
    if (this.vaultChest) {
      boxes.push({
        minX: this.vaultChest.x - 26,
        maxX: this.vaultChest.x + 26,
        minY: this.vaultChest.y - 18,
        maxY: this.vaultChest.y + 4
      });
    }
    if (this.well) {
      boxes.push({
        minX: this.well.x - 30,
        maxX: this.well.x + 30,
        minY: this.well.y - 20,
        maxY: this.well.y + 6
      });
    }
    if (this.signpost) {
      boxes.push({
        minX: this.signpost.x - 14,
        maxX: this.signpost.x + 14,
        minY: this.signpost.y - 16,
        maxY: this.signpost.y + 4
      });
    }
    if (this.cart) {
      boxes.push({
        minX: this.cart.x - 42,
        maxX: this.cart.x + 42,
        minY: this.cart.y - 22,
        maxY: this.cart.y + 6
      });
    }
    if (this.mapTable) {
      boxes.push({
        minX: this.mapTable.x - 32,
        maxX: this.mapTable.x + 32,
        minY: this.mapTable.y - 20,
        maxY: this.mapTable.y + 6
      });
    }

    // 2. Camp Footprints: Left Tent, Right Tent, and Central Fire Pit Rocks
    if (this.campScenery) {
      const cx = this.campScenery.x;
      const cy = this.campScenery.y;
      // Left Tent
      boxes.push({
        minX: cx - 170,
        maxX: cx - 44,
        minY: cy - 105,
        maxY: cy - 35
      });
      // Right Tent
      boxes.push({
        minX: cx + 38,
        maxX: cx + 170,
        minY: cy - 105,
        maxY: cy - 35
      });
      // Central Fire Pit rocks (cannot walk through the fire, but can walk all around it)
      boxes.push({
        minX: cx - 36,
        maxX: cx - 8,
        minY: cy - 38,
        maxY: cy - 14
      });
    }

    // 3. Right Arches & The Ashen Watcher Footprints
    if (this.archOrnate) {
      const ax = this.archOrnate.x;
      const ay = this.archOrnate.y;
      // Left pillar of ornate arch
      boxes.push({
        minX: ax - 85,
        maxX: ax - 32,
        minY: ay - 32,
        maxY: ay + 8
      });
      // Right pillar of ornate arch
      boxes.push({
        minX: ax + 32,
        maxX: ax + 85,
        minY: ay - 32,
        maxY: ay + 8
      });
    }
    if (this.watcher) {
      // The Watcher's physical stance
      boxes.push({
        minX: this.watcher.x - 18,
        maxX: this.watcher.x + 18,
        minY: this.watcher.y - 15,
        maxY: this.watcher.y + 5
      });
    }
    if (this.archStone) {
      // Hamlet Gate (massive stone portcullis)
      boxes.push({
        minX: this.archStone.x - 75,
        maxX: this.archStone.x + 75,
        minY: this.archStone.y - 32,
        maxY: this.archStone.y + 8
      });
    }
    if (this.gateWallConnector) {
      boxes.push({
        minX: this.gateWallConnector.x - 65,
        maxX: this.gateWallConnector.x + 65,
        minY: this.gateWallConnector.y - 32,
        maxY: this.gateWallConnector.y + 6
      });
    }
    if (this.gateWallOuter) {
      boxes.push({
        minX: this.gateWallOuter.x - 65,
        maxX: this.gateWallOuter.x + 65,
        minY: this.gateWallOuter.y - 32,
        maxY: this.gateWallOuter.y + 6
      });
    }

    // 4. Ambient Props Footprints
    if (this.deadTree) {
      boxes.push({
        minX: this.deadTree.x - 22,
        maxX: this.deadTree.x + 22,
        minY: this.deadTree.y - 18,
        maxY: this.deadTree.y + 6
      });
    }
    if (this.woodenCrate) {
      boxes.push({
        minX: this.woodenCrate.x - 28,
        maxX: this.woodenCrate.x + 28,
        minY: this.woodenCrate.y - 16,
        maxY: this.woodenCrate.y + 5
      });
    }
    if (this.signLantern) {
      boxes.push({
        minX: this.signLantern.x - 14,
        maxX: this.signLantern.x + 14,
        minY: this.signLantern.y - 14,
        maxY: this.signLantern.y + 5
      });
    }
    if (this.sanctuaryAltar) {
      boxes.push({
        minX: this.sanctuaryAltar.x - 24,
        maxX: this.sanctuaryAltar.x + 24,
        minY: this.sanctuaryAltar.y - 14,
        maxY: this.sanctuaryAltar.y + 4
      });
    }
    if (this.ancientPlaque) {
      boxes.push({
        minX: this.ancientPlaque.x - 10,
        maxX: this.ancientPlaque.x + 10,
        minY: this.ancientPlaque.y - 10,
        maxY: this.ancientPlaque.y + 4
      });
    }
    if (this.brazierGateLeft) {
      boxes.push({
        minX: this.brazierGateLeft.x - 15,
        maxX: this.brazierGateLeft.x + 15,
        minY: this.brazierGateLeft.y - 14,
        maxY: this.brazierGateLeft.y + 5
      });
    }
    if (this.brazierGateRight) {
      boxes.push({
        minX: this.brazierGateRight.x - 15,
        maxX: this.brazierGateRight.x + 15,
        minY: this.brazierGateRight.y - 14,
        maxY: this.brazierGateRight.y + 5
      });
    }

    return boxes;
  }

  boxIntersects(b1, b2) {
    return !(b1.maxX <= b2.minX || b1.minX >= b2.maxX || b1.maxY <= b2.minY || b1.minY >= b2.maxY);
  }

  // ═════════════════════════════════════════════════════════════════
  //  GROUND PLANE & ATMOSPHERIC BACKDROP (Visual Polish)
  // ═════════════════════════════════════════════════════════════════

  renderBackdrop(width, height) {
    if (!this.backdropGfx) {
      this.backdropGfx = this.add.graphics()
        .setDepth(-10);
    } else {
      this.backdropGfx.clear();
    }

    this.drawStaticBackdrop(this.backdropGfx, width, height);
    this.backdropRT = this.backdropGfx;
  }

  drawStaticBackdrop(gfx, width, height) {
    const horizonY = height * 0.54;

    // ── 1. Restrained Midnight-Blue to Muted-Violet Night Sky ─────────
    gfx.fillGradientStyle(0x04060e, 0x04060e, 0x16122d, 0x1e183a, 1);
    gfx.fillRect(0, 0, width, horizonY);

    // ── 2. Natural Seeded Starfield (Organic Poisson-like Distribution) ──
    // Mulberry32 deterministic PRNG ensures 100% stable positions across frames and resizes
    const mulberry32 = (seed) => {
      let s = seed >>> 0;
      return () => {
        s = (s + 0x6D2B79F5) >>> 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
    const rng = mulberry32(42069);

    const starCount = 135;
    for (let i = 0; i < starCount; i++) {
      // Natural sampling across full sky area without grid rows or modular diagonals
      const sx = Math.round(rng() * (width - 16) + 8);
      const sy = Math.round(rng() * (horizonY - 26) + 6);

      // 4 Rare Prominent Celestial Beacon Stars (Irregularly spaced across sky)
      if (i === 9 || i === 38 || i === 76 || i === 118) {
        // Soft cross glow
        gfx.fillStyle(0x98bce8, 0.28);
        gfx.fillRect(sx - 2, sy, 5, 1);
        gfx.fillRect(sx, sy - 2, 1, 5);
        // Bright diamond core
        gfx.fillStyle(0xffffff, 0.95);
        gfx.fillRect(sx - 1, sy, 3, 1);
        gfx.fillRect(sx, sy - 1, 1, 3);
      }
      // 10 Cross Highlight Stars
      else if (i === 17 || i === 29 || i === 44 || i === 58 || i === 71 || i === 85 || i === 99 || i === 107 || i === 124 || i === 131) {
        gfx.fillStyle(0xd0e2fc, 0.85);
        gfx.fillRect(sx - 1, sy, 3, 1);
        gfx.fillRect(sx, sy - 1, 1, 3);
        gfx.fillStyle(0xffffff, 0.95);
        gfx.fillRect(sx, sy, 1, 1);
      }
      // Medium Stars (2x2 px) (~32 stars)
      else if (i % 4 === 0) {
        const alpha = 0.50 + (rng() * 0.35);
        const col = (i % 8 === 0) ? 0xa8c4ea : 0xe2eaf6;
        gfx.fillStyle(col, alpha);
        gfx.fillRect(sx, sy, 2, 2);
      }
      // Small Crisp Pinpoint Stars (1x1 px) (~89 stars)
      else {
        const alpha = 0.30 + (rng() * 0.45);
        const cols = [0xcad4e2, 0x94b0d4, 0xb8cce8, 0xd0d8e8];
        const col = cols[i % cols.length];
        gfx.fillStyle(col, alpha);
        gfx.fillRect(sx, sy, 1, 1);
      }
    }

    // ── 3. Eclipsed Astral Moon (Another +25% Diameter Increase = 34.375px) ──
    const moonX = width * 0.82;
    const moonY = horizonY * 0.28;

    // Proportional astral halo (scaled up by 1.25)
    gfx.fillStyle(0x3a4560, 0.02);
    gfx.fillCircle(moonX, moonY, 60);
    gfx.fillStyle(0x4e5e80, 0.035);
    gfx.fillCircle(moonX, moonY, 45);
    gfx.fillStyle(0x687c9f, 0.055);
    gfx.fillCircle(moonX, moonY, 32.5);
    gfx.fillStyle(0x8698be, 0.08);
    gfx.fillCircle(moonX, moonY, 22.5);

    // Silver crescent arc (Current radius 13.75 * 1.25 = 17.1875, New Diameter = 34.375px)
    gfx.fillStyle(0xd5dded, 0.88);
    gfx.fillCircle(moonX, moonY, 17.1875);

    // Inner shadow cut circle (Scaled by 1.25 around moon center)
    // Offset: (-4.375 * 1.25 = -5.46875, -1.875 * 1.25 = -2.34375), Radius: 12.75 * 1.25 = 15.9375
    gfx.fillStyle(0x0e0a1c, 1.0);
    gfx.fillCircle(moonX - 5.46875, moonY - 2.34375, 15.9375);

    // ── 4. Irregular Dark-Fantasy Pixel-Art Cloud Formations ─────────
    // Multi-tiered stepped shading with asymmetrical billows and broken edges
    const drawOrganicPixelCloud = (cx, cy, totalW, baseH, seedOffset) => {
      const crng = mulberry32(seedOffset);
      const tiers = [
        { dy: 3, h: baseH, color: 0x0d0b1a, alpha: 0.48 },
        { dy: 1, h: baseH * 0.72, color: 0x171228, alpha: 0.52 },
        { dy: -1, h: baseH * 0.48, color: 0x231a38, alpha: 0.46 },
        { dy: -3, h: Math.max(2, baseH * 0.24), color: 0x362b4e, alpha: 0.35 }
      ];

      const numLobes = 4;
      const lobeWidth = totalW / numLobes;

      for (let l = 0; l < numLobes; l++) {
        const lx = cx - (totalW * 0.5) + (l * lobeWidth) + (lobeWidth * 0.5);
        const lobeHScale = 0.65 + (crng() * 0.55);
        const lobeW = lobeWidth * (0.85 + (crng() * 0.4));

        for (const tier of tiers) {
          gfx.fillStyle(tier.color, tier.alpha);
          const curH = tier.h * lobeHScale;
          const halfLobeW = lobeW * 0.5;
          const steps = 6;
          const stepW = halfLobeW / steps;

          for (let s = 0; s < steps; s++) {
            const frac = s / steps;
            const segH = curH * (1 - Math.pow(frac, 1.6));
            if (segH < 1.5) continue;
            const yPos = Math.round(cy + tier.dy - segH * 0.5);
            const hPos = Math.round(segH);
            gfx.fillRect(Math.round(lx - (s + 1) * stepW), yPos, Math.ceil(stepW + 1), hPos);
            gfx.fillRect(Math.round(lx + s * stepW), yPos, Math.ceil(stepW + 1), hPos);
          }
        }
      }
    };

    // Cloud Bank 1: High North-West sweeping drift
    drawOrganicPixelCloud(width * 0.22, horizonY * 0.20, width * 0.36, 20, 101);
    // Cloud Bank 2: Mid-Sky Central cloud bank with broken billows
    drawOrganicPixelCloud(width * 0.54, horizonY * 0.34, width * 0.44, 18, 202);
    // Cloud Bank 3: Sub-lunar wispy bank beneath and framing the moon
    drawOrganicPixelCloud(width * 0.84, horizonY * 0.40, width * 0.28, 14, 303);

    // ── 5. Layer 1: Farthest Alpine Peaks (Grounded Silhouette, NO FLOATING TRIANGLES!) ──
    gfx.fillStyle(0x19152c, 0.90);
    gfx.beginPath();
    gfx.moveTo(0, horizonY);
    const stepX = 14;
    const peakPoints = [];
    for (let x = 0; x <= width + stepX; x += stepX) {
      const p1 = Math.sin(x * 0.005 + 0.3) * 36;
      const p2 = Math.cos(x * 0.016 + 1.2) * 20;
      const p3 = Math.sin(x * 0.038 - 0.5) * 11;
      const p4 = Math.cos(x * 0.082) * 4;
      const py = horizonY - 46 + p1 + p2 + p3 + p4;
      peakPoints.push({ x, y: py });
      gfx.lineTo(x, py);
    }
    gfx.lineTo(width, horizonY);
    gfx.closePath();
    gfx.fillPath();

    // Continuous Grounded Facet Lighting on Layer 1 (Connected to silhouette down to horizonY)
    // Completely replaces the isolated floating triangles with grounded moon-facing slope facets
    gfx.fillStyle(0x241d3d, 0.38);
    for (let i = 0; i < peakPoints.length - 3; i += 4) {
      const ptA = peakPoints[i];
      const ptB = peakPoints[i + 2];
      // Only draw on slopes facing towards the moon (descending rightward)
      if (ptB.y > ptA.y + 4) {
        gfx.beginPath();
        gfx.moveTo(ptA.x, ptA.y);
        gfx.lineTo(ptB.x, ptB.y);
        gfx.lineTo(ptB.x, horizonY);
        gfx.lineTo(ptA.x, horizonY);
        gfx.closePath();
        gfx.fillPath();
      }
    }

    // ── 6. Layer 2: Mid-Distance Mountain Massifs & Ruined Spire Skeletons ─
    gfx.fillStyle(0x100d1c, 0.96);
    gfx.beginPath();
    gfx.moveTo(0, horizonY);
    for (let x = 0; x <= width + 14; x += 14) {
      const p1 = Math.sin(x * 0.011 + 2.1) * 22;
      const p2 = Math.cos(x * 0.027 - 1.1) * 12;
      const p3 = Math.sin(x * 0.054 + 0.8) * 5;
      gfx.lineTo(x, horizonY - 24 + p1 + p2 + p3);
    }
    gfx.lineTo(width, horizonY);
    gfx.closePath();
    gfx.fillPath();

    // Distant Gothic Ruined Watchtowers & Spire Silhouettes Embedded in Mid Ridge
    gfx.fillStyle(0x0c0a18, 0.94);
    // Left Fortress Skeletons
    const citL = width * 0.04;
    gfx.fillRect(citL + 6, horizonY - 52, 9, 52);
    gfx.fillRect(citL + 9, horizonY - 64, 3, 12);  // Spire pinnacle
    gfx.fillRect(citL + 22, horizonY - 38, 14, 38); // Broken rampart
    gfx.fillRect(citL + 42, horizonY - 48, 8, 48);  // Watch post
    gfx.fillRect(citL + 54, horizonY - 32, 18, 32);

    // Right Citadel Skeletons
    const citR = width * 0.74;
    gfx.fillRect(citR + 12, horizonY - 38, 16, 38);
    gfx.fillRect(citR + 32, horizonY - 58, 8, 58);
    gfx.fillRect(citR + 34, horizonY - 68, 4, 10);  // Cathedral pinnacle
    gfx.fillRect(citR + 48, horizonY - 44, 11, 44);
    gfx.fillRect(citR + 66, horizonY - 50, 8, 50);

    // ── 7. Layer 3: Near Horizon Ridge, Pines & Atmospheric Low Mist ─────
    gfx.fillStyle(0x08060e, 1.0);
    gfx.beginPath();
    gfx.moveTo(0, horizonY);
    for (let x = 0; x <= width + 12; x += 12) {
      const p1 = Math.sin(x * 0.018 + 0.7) * 9;
      const p2 = Math.cos(x * 0.042) * 5;
      gfx.lineTo(x, horizonY - 12 + p1 + p2);
    }
    gfx.lineTo(width, horizonY);
    gfx.closePath();
    gfx.fillPath();

    // Natural pine tree silhouettes along the near ridge crest
    for (let x = 20; x < width; x += 55) {
      const treeH = 6 + ((x * 17) % 7);
      const ridgeY = horizonY - 12 + Math.sin(x * 0.018 + 0.7) * 9 + Math.cos(x * 0.042) * 5;
      gfx.fillStyle(0x06040a, 0.95);
      gfx.beginPath();
      gfx.moveTo(x, ridgeY - treeH);
      gfx.lineTo(x - 3, ridgeY);
      gfx.lineTo(x + 3, ridgeY);
      gfx.closePath();
      gfx.fillPath();
    }

    // Atmospheric Low Mist along horizon seam (bridges distant world into playable ground)
    gfx.fillGradientStyle(0x181328, 0x181328, 0x110e1c, 0x110e1c, 0.50);
    gfx.fillRect(0, horizonY - 8, width, 16);

    // ── 8. Walkable Ground Plane Base ──────────────────────────────
    gfx.fillGradientStyle(0x14111c, 0x14111c, 0x07060a, 0x07060a, 1);
    gfx.fillRect(0, horizonY, width, height - horizonY);

    // ── 9. Organic Cobblestone & Weathered Sanctuary Paving ─────────
    const groundH = height - horizonY;
    const roadTop = horizonY + groundH * 0.22;
    const roadHeight = groundH * 0.72;
    gfx.fillStyle(0x16131e, 0.5);
    gfx.fillRect(0, roadTop, width, roadHeight);

    // Weathered flagstone pavers
    const numRows = 8;
    for (let r = 0; r < numRows; r++) {
      const rowY = roadTop + (r / numRows) * roadHeight + 4;
      const stoneHeight = Math.max(7, Math.floor(groundH * 0.06) + (r % 3) * 2);
      const rowStagger = (r * 37) % 60;
      let curX = -20 + rowStagger;

      while (curX < width + 40) {
        const stoneWidth = 26 + ((curX * 17 + r * 31) % 28);
        const stoneColorIdx = (Math.floor(curX * 0.05) + r) % 4;
        const stoneColors = [0x1d1828, 0x241e30, 0x1b1624, 0x181e19];
        const stoneColor = stoneColors[stoneColorIdx];

        gfx.fillStyle(stoneColor, 0.65);
        gfx.fillRoundedRect(curX + 2, rowY + 1, stoneWidth - 3, stoneHeight - 2, 2);

        gfx.lineStyle(1, 0x362d45, 0.35);
        gfx.lineBetween(curX + 3, rowY + 1, curX + stoneWidth - 2, rowY + 1);

        gfx.lineStyle(1, 0x09070d, 0.7);
        gfx.strokeRoundedRect(curX + 2, rowY + 1, stoneWidth - 3, stoneHeight - 2, 2);

        curX += stoneWidth + 3;
      }
    }

    // Mossy overgrowth patches along the northern edge of the road
    const mossColors = [0x172118, 0x223023, 0x131a14];
    for (let i = 0; i < 20; i++) {
      const mx = (i * 93 + 24) % (width - 40);
      const my = horizonY + 12 + ((i * 47) % Math.floor(groundH * 0.28));
      const mw = 22 + (i % 4) * 8;
      const mh = 8 + (i % 3) * 4;
      gfx.fillStyle(mossColors[i % 3], 0.45);
      gfx.fillEllipse(mx, my, mw, mh);
    }

    // Scattered pebbles and gravel clusters along the road borders
    gfx.fillStyle(0x2c253b, 0.6);
    for (let i = 0; i < 40; i++) {
      const px = (i * 61 + 17) % width;
      const py = horizonY + ((i * 89 + 33) % Math.floor(groundH * 0.95));
      if (Math.abs(px - (width * 0.5 - 22)) > 60 || Math.abs(py - (height * 0.75 - 12)) > 30) {
        gfx.fillRect(px, py, (i % 3) + 1.5, (i % 2) + 1.5);
      }
    }

    // ── 10. Believable Architectural Foundations & Continuous Stylobates ──
    const baseLineY = height * 0.73;

    // A) Left Ruins Ashlar Foundation Plinth & Rubble Footprint
    gfx.fillStyle(0x181520, 0.95);
    gfx.fillRect(width * 0.01, baseLineY - 8, width * 0.31, 10);
    gfx.fillStyle(0x322d3d, 0.85); // Plinth bevel top highlight
    gfx.fillRect(width * 0.01, baseLineY - 8, width * 0.31, 2);
    gfx.fillStyle(0x0d0b12, 0.95); // Deep bedrock mortar joint
    gfx.fillRect(width * 0.01, baseLineY + 2, width * 0.31, 2);

    // Weathered ashlar foundation stone vertical seams
    for (let bx = width * 0.02; bx < width * 0.31; bx += 32) {
      gfx.fillStyle(0x0e0c14, 0.85);
      gfx.fillRect(bx, baseLineY - 8, 2, 10);
    }

    // B) Right Gatehouse Foundation Plinth & Continuous Enclosure Stylobate
    gfx.fillStyle(0x181520, 0.95);
    gfx.fillRect(width * 0.68, baseLineY - 8, width * 0.32, 10);
    gfx.fillStyle(0x322d3d, 0.85); // Plinth bevel top highlight
    gfx.fillRect(width * 0.68, baseLineY - 8, width * 0.32, 2);
    gfx.fillStyle(0x0d0b12, 0.95); // Deep bedrock mortar joint
    gfx.fillRect(width * 0.68, baseLineY + 2, width * 0.32, 2);

    // Weathered ashlar foundation stone vertical seams
    for (let bx = width * 0.69; bx < width; bx += 34) {
      gfx.fillStyle(0x0e0c14, 0.85);
      gfx.fillRect(bx, baseLineY - 8, 2, 10);
    }

    // ── 11. Contact Shadows (Ambient Occlusion) for Structures ───────
    gfx.fillStyle(0x000000, 0.48);
    gfx.fillEllipse(width * 0.10, height * 0.73, 130, 22);
    gfx.fillEllipse(width * 0.22, height * 0.73, 140, 24);
    gfx.fillEllipse(width * 0.16, height * 0.77, 50, 14);
    gfx.fillEllipse(width * 0.29, height * 0.67, 65, 18);
    gfx.fillEllipse(width * 0.34, height * 0.72, 34, 12);
    gfx.fillEllipse(width * 0.76, height * 0.73, 140, 24);
    gfx.fillEllipse(width * 0.835, height * 0.73, 130, 22); // connecting curtain wall
    gfx.fillEllipse(width * 0.91, height * 0.73, 140, 26);
    gfx.fillEllipse(width * 0.99, height * 0.73, 130, 22); // outer perimeter wall
    gfx.fillEllipse(width * 0.85, height * 0.74, 30, 10);
    gfx.fillEllipse(width * 0.97, height * 0.74, 30, 10);

    // ── 11. Campfire Hearth Ground Shadow & Warm Ember Underglow ────
    // ABSOLUTE RULE: PROTECT THE ENTIRE CAMPFIRE & HEARTH!
    const campX = width * 0.50 - 22;
    const campY = height * 0.75 - 12;
    gfx.fillStyle(0x000000, 0.5);
    gfx.fillEllipse(campX, campY, 115, 46);
    gfx.fillStyle(0x421b0d, 0.38);
    gfx.fillEllipse(campX, campY, 80, 30);
    gfx.fillStyle(0x662912, 0.2);
    gfx.fillEllipse(campX, campY, 48, 18);
  }

  createAmbientAsh() {
    this.ashZone = new Phaser.Geom.Rectangle(0, 0, this.scale.width, 1);
    this.ambientAsh = this.add.particles(0, 0, 'ash_particle', {
      emitZone: { type: 'random', source: this.ashZone },
      y: -10,
      lifespan: 7000,
      speedY: { min: 18, max: 55 },
      speedX: { min: -12, max: 12 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.25, end: 0 },
      tint: [0xffaa33, 0xff7700, 0xff4500, 0xcc3300, 0x3a180c],
      blendMode: 'ADD',
      frequency: 340
    });
    this.ambientAsh.setDepth(999);
  }

  // ═════════════════════════════════════════════════════════════════
  //  CONTROLS & PHYSICS RESOLUTION
  // ═════════════════════════════════════════════════════════════════

  setupControls() {
    if (!this.input.keyboard) return;
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      interactF: Phaser.Input.Keyboard.KeyCodes.F,     // Keybind updated to 'F'
      interactSpace: Phaser.Input.Keyboard.KeyCodes.SPACE
    });
    this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.keyM.on('down', () => this.toggleWorldMap());
    this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
    this.keyN.on('down', () => this.toggleMiniMap());
  }

  update(time, delta) {
    if (this.isAnyModalOpen()) {
      if (this.player) this.player.anims.play('player-idle', true);
      return;
    }

    this.handlePlayerMovement(delta);
    this.handleProximityAndInteraction();
    this.updateMiniMapHUD();
    this.handleDynamicYSorting();
  }

  handlePlayerMovement(delta) {
    if (!this.player) return;

    let moveX = 0;
    let moveY = 0;

    // Desktop Keyboard
    if (this.cursors && this.wasd) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) moveX -= 1;
      if (this.cursors.right.isDown || this.wasd.right.isDown) moveX += 1;
      if (this.cursors.up.isDown || this.wasd.up.isDown) moveY -= 1;
      if (this.cursors.down.isDown || this.wasd.down.isDown) moveY += 1;
    }

    // Mobile Virtual Joystick
    if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
      moveX += this.joystickVector.x;
      moveY += this.joystickVector.y;
    }

    const dt = delta / 1000;
    const speed = 180;

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      const normX = moveX / len;
      const normY = moveY / len;

      const dx = normX * speed * dt;
      const dy = normY * speed * dt;

      const obstacles = this.staticObstacleBoxes || this.getObstacleBoxes();
      const bounds = this.getWalkBounds();

      // Separate X and Y collision resolution against solid footprints
      // 1. Resolve X movement (Feet AABB)
      const targetX = Phaser.Math.Clamp(this.player.x + dx, bounds.minX, bounds.maxX);
      const fXMin = targetX - 10;
      const fXMax = targetX + 10;
      const fYMin = this.player.y - 10;
      const fYMax = this.player.y;

      let collidesX = false;
      for (let i = 0; i < obstacles.length; i++) {
        const b = obstacles[i];
        if (!(fXMax <= b.minX || fXMin >= b.maxX || fYMax <= b.minY || fYMin >= b.maxY)) {
          collidesX = true;
          break;
        }
      }
      if (!collidesX) {
        this.player.x = targetX;
      }

      // 2. Resolve Y movement (Feet AABB)
      const targetY = Phaser.Math.Clamp(this.player.y + dy, bounds.minY, bounds.maxY);
      const fyXMin = this.player.x - 10;
      const fyXMax = this.player.x + 10;
      const fyYMin = targetY - 10;
      const fyYMax = targetY;

      let collidesY = false;
      for (let i = 0; i < obstacles.length; i++) {
        const b = obstacles[i];
        if (!(fyXMax <= b.minX || fyXMin >= b.maxX || fyYMax <= b.minY || fyYMin >= b.maxY)) {
          collidesY = true;
          break;
        }
      }
      if (!collidesY) {
        this.player.y = targetY;
      }

      // Sprite orientation & walk cycle
      if (moveX < 0) this.player.setFlipX(true);
      else if (moveX > 0) this.player.setFlipX(false);

      this.player.anims.play('player-walk', true);
    } else {
      this.player.anims.play('player-idle', true);
    }

    this.player.sortY = this.player.y;
  }

  handleDynamicYSorting() {
    if (!this.player) return;
    const playerDepth = Math.floor(this.player.y);
    if (this.player.depth !== playerDepth) {
      this.player.setDepth(playerDepth);
    }
  }

  handleProximityAndInteraction() {
    if (!this.player) return;
    const targets = this.interactionTargets;
    if (!targets) return;

    let closest = null;
    let minDist = Infinity;

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, t.x, t.y);
      if (dist <= t.radius && dist < minDist) {
        minDist = dist;
        closest = t;
      }
    }

    if (this.activeTarget !== closest) {
      this.activeTarget = closest;
      if (closest) {
        this.showPrompt(closest);
      } else {
        this.hidePrompt();
      }
    }

    // Keyboard trigger on 'F' or 'Space'
    if (this.wasd) {
      const justPressedF = Phaser.Input.Keyboard.JustDown(this.wasd.interactF);
      const justPressedSpace = Phaser.Input.Keyboard.JustDown(this.wasd.interactSpace);
      if ((justPressedF || justPressedSpace) && closest) {
        closest.action();
      }
    }
  }

  isAnyModalOpen() {
    const hearth = document.getElementById('hearth-modal');
    const dialogue = document.getElementById('dialogue-modal');
    const gate = document.getElementById('gate-modal');
    const inv = document.getElementById('inventory-overlay');
    const lore = document.getElementById('lore-modal');
    return (
      (hearth && !hearth.classList.contains('hidden')) ||
      (dialogue && !dialogue.classList.contains('hidden')) ||
      (gate && !gate.classList.contains('hidden')) ||
      (inv && !inv.classList.contains('inv-hidden')) ||
      (lore && !lore.classList.contains('hidden'))
    );
  }

  // ═════════════════════════════════════════════════════════════════
  //  DOM UI: HUD, MODALS & PROMPTS
  // ═════════════════════════════════════════════════════════════════

  buildDOMUI() {
    // 1. HUD: Stat Pills Pinned to Top-Left
    let hud = document.getElementById('camp-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'camp-hud';
      hud.style.cssText = 'position:fixed;top:18px;left:24px;z-index:500;pointer-events:auto;';
      document.body.appendChild(hud);
    }
    this.refreshHud();

    // 2. Floating Interaction Prompt with [F] Badge
    let promptEl = document.getElementById('hamlet-prompt');
    if (!promptEl) {
      promptEl = document.createElement('div');
      promptEl.id = 'hamlet-prompt';
      promptEl.className = 'hamlet-prompt';
      promptEl.style.display = 'none';
      promptEl.innerHTML = `<span class="key-badge">F</span><span id="hamlet-prompt-text">Interact</span>`;
      promptEl.onclick = () => {
        if (this.activeTarget) this.activeTarget.action();
      };
      document.body.appendChild(promptEl);
    }
    this.promptEl = promptEl;

    // 3. Item Acquired Toast Banner
    let toastBanner = document.getElementById('item-toast-banner');
    if (!toastBanner) {
      toastBanner = document.createElement('div');
      toastBanner.id = 'item-toast-banner';
      toastBanner.className = 'item-acquired-toast';
      document.body.appendChild(toastBanner);
    }
    this.toastBanner = toastBanner;

    // 4. Focus Hearth Modal
    let hearthModal = document.getElementById('hearth-modal');
    if (!hearthModal) {
      hearthModal = document.createElement('div');
      hearthModal.id = 'hearth-modal';
      hearthModal.className = 'hearth-modal-overlay hidden';
      const player = getPlayer();
      hearthModal.innerHTML = `
        <div class="hearth-modal-frame">
          <button id="hearth-close-btn" class="hearth-modal-close" type="button" aria-label="Close">✕</button>
          <div style="font-family:'Cinzel',serif;font-size:24px;font-weight:600;letter-spacing:0.18em;color:var(--color-text-bone,#cfc7b8);text-transform:uppercase;margin-bottom:6px;">THE ASHEN HEARTH</div>
          <div style="font-family:'Crimson Text',serif;font-size:16px;color:var(--color-text-muted,#7a7265);letter-spacing:0.02em;margin-bottom:14px;">Rest near the embers, ${player.name || 'Wanderer'}. Focus thy mind to gather coin and restore sanity.</div>
          <div class="archaic-divider"><span class="crosshair">✧</span></div>
          <div id="camp-timer" style="font-family:'Cinzel',serif;font-size:42px;font-weight:700;letter-spacing:0.1em;color:var(--color-text-bone,#cfc7b8);margin:16px 0 22px;">00:00</div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
            <button id="camp-focus-btn" class="btn-focus" type="button">START FOCUS</button>
            <button id="hearth-return-btn" class="btn-vault" type="button">✕ RETURN TO HAMLET</button>
          </div>
          <div id="camp-toast" style="font-family:'Crimson Text',serif;font-size:16px;color:var(--color-gold-tarnished,#9d8a68);margin-top:20px;opacity:0;transition:opacity .5s;"></div>
        </div>`;
      document.body.appendChild(hearthModal);

      document.getElementById('camp-focus-btn').onclick = () => {
        if (this.focusing) this.stopFocus();
        else this.startFocus();
      };
      document.getElementById('hearth-close-btn').onclick = () => this.closeHearthModal();
      document.getElementById('hearth-return-btn').onclick = () => this.closeHearthModal();
    }

    // 5. The Ashen Watcher Dialogue Modal
    let diagModal = document.getElementById('dialogue-modal');
    if (!diagModal) {
      diagModal = document.createElement('div');
      diagModal.id = 'dialogue-modal';
      diagModal.className = 'dialogue-modal-overlay hidden';
      diagModal.innerHTML = `
        <div class="dialogue-modal-frame">
          <div class="dialogue-npc-header">
            <span class="dialogue-npc-title">THE ASHEN WATCHER · Mysterious Wayfarer</span>
            <button id="diag-close-btn" class="hearth-modal-close" type="button">✕</button>
          </div>
          <div id="dialogue-text" class="dialogue-npc-text"></div>
          <div id="dialogue-choices" class="dialogue-choices"></div>
        </div>`;
      document.body.appendChild(diagModal);
      document.getElementById('diag-close-btn').onclick = () => this.closeWatcherDialogue();
    }

    // 6. Hamlet Gate Modal (Unsealed: Starter Borderland Departure)
    let gateModal = document.getElementById('gate-modal');
    if (!gateModal) {
      gateModal = document.createElement('div');
      gateModal.id = 'gate-modal';
      gateModal.className = 'dialogue-modal-overlay hidden';
      gateModal.innerHTML = `
        <div class="dialogue-modal-frame">
          <div class="dialogue-npc-header">
            <span class="dialogue-npc-title">✧ THE HAMLET GATE ✧</span>
            <button id="gate-modal-close" class="hearth-modal-close" type="button">✕</button>
          </div>
          <div class="dialogue-npc-text">
            Beyond this colossal stone archway lies the ancient highway through the Gray Thickets toward <b>Oakhaven Outpost</b>—the frontier stronghold and Adventurers' Guild of the Empire.
            <br><br>
            As a borderland haven for forgotten souls, no permits or renown are required to cross this threshold. The eastern road stands open.
            <br><br>
            <em style="color:#c9a45c;">Status: UNLOCKED · Required Renown: 0 · Safe Passage to Oakhaven</em>
          </div>
          <div class="dialogue-choices">
            <button id="gate-travel-btn" class="dialogue-choice-btn" style="color:#ffd700;" type="button">✦ [Depart to Oakhaven Outpost (0 Renown)] ⟶</button>
            <button id="gate-map-btn" class="dialogue-choice-btn" type="button">✦ [Examine Continental Atlas [M]]</button>
            <button id="gate-return-btn" class="dialogue-choice-btn" type="button">✦ [Step Back to Hamlet]</button>
          </div>
        </div>`;
      document.body.appendChild(gateModal);
      document.getElementById('gate-modal-close').onclick = () => this.closeGateModal();
      document.getElementById('gate-travel-btn').onclick = () => {
        this.closeGateModal();
        this.travelToOakhaven();
      };
      document.getElementById('gate-map-btn').onclick = () => {
        this.closeGateModal();
        this.openWorldMapModal();
      };
      document.getElementById('gate-return-btn').onclick = () => this.closeGateModal();
    }

    // 7. Sanctuary Lore Modal (Lightweight Environmental Lore)
    let loreModal = document.getElementById('lore-modal');
    if (!loreModal) {
      loreModal = document.createElement('div');
      loreModal.id = 'lore-modal';
      loreModal.className = 'dialogue-modal-overlay hidden';
      loreModal.innerHTML = `
        <div class="dialogue-modal-frame" style="max-width: 620px;">
          <div class="dialogue-npc-header">
            <span id="lore-title" class="dialogue-npc-title">SANCTUARY INSCRIPTION</span>
            <button id="lore-close-x" class="hearth-modal-close" type="button" aria-label="Close">✕</button>
          </div>
          <div id="lore-text" class="dialogue-npc-text"></div>
          <div style="display:flex;justify-content:flex-end;margin-top:16px;">
            <button id="lore-close-btn" class="dialogue-choice-btn" type="button">✦ [Return to Hamlet]</button>
          </div>
        </div>`;
      document.body.appendChild(loreModal);
      document.getElementById('lore-close-x').onclick = () => this.closeLoreModal();
      document.getElementById('lore-close-btn').onclick = () => this.closeLoreModal();
    }

    // 8. Mobile Virtual Joystick & Touch Interact Button
    this.setupMobileControls();
  }

  showPrompt(target) {
    if (!this.promptEl) return;
    const txt = document.getElementById('hamlet-prompt-text');
    if (txt) txt.textContent = target.prompt.replace('[F] ', '');

    // Position prompt in viewport space accounting for camera scroll!
    const screenX = target.x - this.cameras.main.scrollX;
    const screenY = target.y - this.cameras.main.scrollY;
    this.promptEl.style.left = `${screenX}px`;
    this.promptEl.style.top = `${screenY - 45}px`;
    this.promptEl.style.display = 'flex';
  }

  hidePrompt() {
    if (this.promptEl) this.promptEl.style.display = 'none';
  }

  showItemAcquiredToast(message) {
    if (!this.toastBanner) return;
    this.toastBanner.innerHTML = message;
    this.toastBanner.classList.add('show');
    setTimeout(() => {
      if (this.toastBanner) this.toastBanner.classList.remove('show');
    }, 4500);
  }

  setupMobileControls() {
    let mobileEl = document.getElementById('mobile-controls');
    if (!mobileEl) {
      mobileEl = document.createElement('div');
      mobileEl.id = 'mobile-controls';
      mobileEl.innerHTML = `
        <div id="joystick-base" class="mobile-joystick-area">
          <div id="joystick-thumb" class="mobile-joystick-thumb"></div>
        </div>
        <button id="mobile-interact" class="mobile-interact-btn" type="button">INTERACT [F]</button>`;
      document.body.appendChild(mobileEl);

      const base = document.getElementById('joystick-base');
      const thumb = document.getElementById('joystick-thumb');
      const interactBtn = document.getElementById('mobile-interact');

      let touchId = null;
      const radius = 45;

      const handleTouchStart = e => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (touchId === null) {
            touchId = t.identifier;
            updateJoystick(t.clientX, t.clientY);
            break;
          }
        }
      };

      const handleTouchMove = e => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touchId) {
            updateJoystick(t.clientX, t.clientY);
            break;
          }
        }
      };

      const handleTouchEnd = e => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touchId) {
            touchId = null;
            this.joystickVector = { x: 0, y: 0 };
            thumb.style.transform = 'translate(0px, 0px)';
            break;
          }
        }
      };

      const updateJoystick = (clientX, clientY) => {
        const rect = base.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = clientX - centerX;
        let dy = clientY - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist > radius) {
          dx = (dx / dist) * radius;
          dy = (dy / dist) * radius;
        }

        thumb.style.transform = `translate(${dx}px, ${dy}px)`;
        this.joystickVector = {
          x: dx / radius,
          y: dy / radius
        };
      };

      base.addEventListener('touchstart', handleTouchStart, { passive: false });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd, { passive: false });
      window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

      interactBtn.onclick = () => {
        if (this.activeTarget) this.activeTarget.action();
      };
    }
  }

  // ═════════════════════════════════════════════════════════════════
  //  MODAL ACTIONS: HEARTH, THE ASHEN WATCHER, GATE
  // ═════════════════════════════════════════════════════════════════

  openHearthModal() {
    const el = document.getElementById('hearth-modal');
    if (!el) return;
    el.classList.remove('hidden');
    const timerEl = document.getElementById('camp-timer');
    if (timerEl) timerEl.textContent = this.formatTime(this.focusElapsed);
  }

  closeHearthModal() {
    const el = document.getElementById('hearth-modal');
    if (el) el.classList.add('hidden');
    this.refreshHud();
  }

  // ── Multi-Branching RPG Dialogue System: The Ashen Watcher ─────────
  openWatcherDialogue() {
    const modal = document.getElementById('dialogue-modal');
    const textEl = document.getElementById('dialogue-text');
    const choicesEl = document.getElementById('dialogue-choices');
    if (!modal || !textEl || !choicesEl) return;

    modal.classList.remove('hidden');

    const renderNode = (dialogueText, choices) => {
      textEl.innerHTML = dialogueText;
      choicesEl.innerHTML = choices.map((c, i) =>
        `<button class="dialogue-choice-btn" data-idx="${i}" type="button">${c.label}</button>`
      ).join('');

      choicesEl.querySelectorAll('.dialogue-choice-btn').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.idx, 10);
          choices[idx].action();
        };
      });
    };

    const showRoot = () => {
      renderNode(
        `<p><em>The Ashen Watcher leans heavily upon his weathered ash-wood stave, tattered charcoal cowl veiling all save a pair of luminous, steady eyes. Cold wind stirs the embers at his feet as you approach.</em></p>
         <p style="margin-top:12px;">“Thou art awake, then. Few who tumble through the Abyssal Gate retain their wits—most succumb to the void-rot before their feet touch stone. Speak, wanderer. What memory yet flickers within thee?”</p>`,
        [
          {
            label: '✦ [1] "Who art thou, and why didst thou pull me from the ash?"',
            action: () => showBranch1()
          },
          {
            label: '✦ [2] "What is this desolate place, and where lies civilization?"',
            action: () => showBranch2()
          },
          {
            label: '✦ [3] "I am unarmed. How am I to survive the road ahead?"',
            action: () => showBranch3()
          },
          {
            label: '✦ [4] "Submit a Trial of the Mind (Awakening Quest)"',
            action: () => showBranch4()
          },
          {
            label: '✦ [5] "I must take my leave. Farewell."',
            action: () => this.closeWatcherDialogue()
          }
        ]
      );
    };

    // Branch 1: Identity & Void-Ash Warning
    const showBranch1 = () => {
      renderNode(
        `<p>“Names are brittle relics in this forsaken borderland. They call me the <b>Ashen Watcher</b>. For longer than mortal reckoning, I have walked the perimeter of the Gate, watching for those who breach the veil.”</p>
         <p style="margin-top:12px;">“When the gate cast thee out, the ash had already begun to gnaw upon thy spirit. Know this: in Aethelgard, <b>Sanity is thy true lifeblood</b>. If thy thoughts fracture and wander, the abyss will devour thee from within. Rest at the hearth fire [F] to focus thy mind and mend the rot.”</p>`,
        [
          { label: '✦ [Ask something else...]', action: () => showRoot() },
          { label: '✦ "I will remember thy counsel. Farewell."', action: () => this.closeWatcherDialogue() }
        ]
      );
    };

    // Branch 2: The Hamlet & Oakhaven Outpost
    const showBranch2 = () => {
      renderNode(
        `<p>“Thou standest in <b>The Ashen Hamlet</b>—the final stone redoubt before the endless wastes. Long ago, vanguard legions gathered here to prepare for the descent. Now, only ash and echoes abide.”</p>
         <p style="margin-top:12px;">“If it is civilization thou seekest, thy path lies beyond the Eastern Gate before us. The road leads through the Gray Thickets toward <b>Oakhaven Outpost</b>—the frontier bastion of the Empire. There thou wilt find the Adventurers' Guild, overseen by their insufferable young prodigy, <b>Archmage Malakor</b>. He will demand proof of thy intellect before permitting thee entry to the inner realm.”</p>`,
        [
          { label: '✦ [Ask something else...]', action: () => showRoot() },
          { label: '✦ "Understood. Farewell."', action: () => this.closeWatcherDialogue() }
        ]
      );
    };

    // Branch 3: Starter Equipment Grant Event
    const showBranch3 = () => {
      if (!this.watcherState.giftClaimed) {
        // Grant starter equipment directly to inventory: sword, potion, and scroll-a (Atlas)
        const inv = getInventoryOverlay();
        if (inv) {
          inv.addItem('sword-rusted', 1);
          inv.addItem('potion-red', 1);
          inv.addItem('scroll-a', 1);
        }
        this.watcherState.giftClaimed = true;
        try {
          localStorage.setItem('aethelgard_watcher_gift', 'true');
        } catch (_) {}

        this.showItemAcquiredToast('✦ ACQUIRED: Rusty Iron Blade, Crimson Vitality Draught & Weathered Atlas [M] ✦');

        renderNode(
          `<p>“To wander these wastes with empty hands is suicide. Take this steel, this restorative draught, and this parchment—the <b>Weathered Atlas of Aethelgard [M]</b>.”</p>
           <div class="dialogue-reward-banner">✦ RECEIVED: Rusty Iron Blade, Crimson Vitality Draught & Weathered Atlas [M] ✦</div>
           <p>“A rusty blade, but its edge still bites. Drink the crimson draught if thy sanity fractures. And unroll thy <b>Atlas [M]</b> to chart thy voyage across the nine continental realms. Examine the <b>Atlas Table [F]</b> beside my archway before venturing east toward <b>Oakhaven Outpost</b>.”</p>`,
          [
            { label: '✦ [Ask something else...]', action: () => showRoot() },
            { label: '✦ "My gratitude, Watcher. Farewell."', action: () => this.closeWatcherDialogue() }
          ]
        );
      } else {
        renderNode(
          `<p>“Thou hast already received what little steel I could spare. Guard thy blade well, and seek the smithy at <b>Oakhaven Outpost</b> if thou desirest greater armaments.”</p>`,
          [
            { label: '✦ [Ask something else...]', action: () => showRoot() },
            { label: '✦ "Farewell."', action: () => this.closeWatcherDialogue() }
          ]
        );
      }
    };

    // Branch 4: Awakening Quest / Trial of the Mind
    const showBranch4 = () => {
      const inv = getInventoryOverlay();
      const hasBlade = inv ? (inv.hasItem('sword-rusted') || inv.getItems().length > 0) : false;
      const player = getPlayer();
      const hasFocused = player.gold > 0 || this.focusElapsed >= 60;

      if (!this.watcherState.trialCompleted && hasBlade && hasFocused) {
        // Complete the Awakening Trial!
        player.gold += 50;
        player.renown += 25;
        this.watcherState.trialCompleted = true;
        try {
          localStorage.setItem('aethelgard_watcher_trial', 'true');
        } catch (_) {}

        this.refreshHud();
        this.showItemAcquiredToast('✦ TRIAL COMPLETED: +50 Gold · +25 Renown ✦');

        renderNode(
          `<p>“Thy resolve is steadfast. The hearth has tempered thy mind, and thy hand does not tremble upon the hilt. As promised, take this blessing of coin and renown.”</p>
           <div class="dialogue-reward-banner">✦ TRIAL CONQUERED: +50 Gold · +25 Renown ✦</div>
           <p>“When the gate to <b>Oakhaven Outpost</b> unseals, tell Archmage Malakor that the Ashen Watcher judged thee worthy.”</p>`,
          [
            { label: '✦ [Ask something else...]', action: () => showRoot() },
            { label: '✦ "I shall honor this trial. Farewell."', action: () => this.closeWatcherDialogue() }
          ]
        );
      } else if (this.watcherState.trialCompleted) {
        renderNode(
          `<p>“Thou hast already conquered the Awakening Trial. Thy mind is fortified against the abyss. Prepare thyself for the road to Oakhaven Outpost.”</p>`,
          [
            { label: '✦ [Ask something else...]', action: () => showRoot() },
            { label: '✦ "Farewell."', action: () => this.closeWatcherDialogue() }
          ]
        );
      } else {
        // Display active trial requirements
        renderNode(
          `<p>“The gatekeepers of Oakhaven Outpost admit no mindless vagrants. The Empire permits entry only to those who prove their intellect through the <b>Rites of Chronos</b>.”</p>
           <div class="trial-objectives-box">
             <div class="trial-item ${hasFocused ? 'done' : ''}">
               ${hasFocused ? '☑' : '☐'} Meditate at the Ashen Hearth [F] for at least 1 full minute (Hearth Focus)
             </div>
             <div class="trial-item ${hasBlade ? 'done' : ''}">
               ${hasBlade ? '☑' : '☐'} Arm thyself with an iron blade (Ask the Watcher or inspect the Vault)
             </div>
           </div>
           <p>“Return to me once both rites have been fulfilled.”</p>`,
          [
            { label: '✦ [Ask something else...]', action: () => showRoot() },
            { label: '✦ "I will return when ready."', action: () => this.closeWatcherDialogue() }
          ]
        );
      }
    };

    showRoot();
  }

  closeWatcherDialogue() {
    const modal = document.getElementById('dialogue-modal');
    if (modal) modal.classList.add('hidden');
  }

  openGateModal() {
    const modal = document.getElementById('gate-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeGateModal() {
    const modal = document.getElementById('gate-modal');
    if (modal) modal.classList.add('hidden');
  }

  // ── Environmental Lore Interactions (Non-blocking, zero state changes) ──
  openLoreModal(type) {
    let title = '';
    let body = '';
    if (type === 'plaque') {
      title = '✦ SANCTUARY BOUNDARY RUNESTONE ✦';
      body = '“Here marked the Outer Cloister of the Ashen Sanctuary, raised by the Silent Keepers in the Third Age of Solitude.<br><br>Traveler, tread softly upon these weathered flagstones: the earth beneath still weeps what the heavens have forgotten.”';
    } else if (type === 'altar') {
      title = '✧ FRACTURED SANCTUARY ALTAR ✧';
      body = '“A lingering breath of primordial aether stirs across the cracked consecrated marble.<br><br>A cold, celestial chime resonates within thy mind as the ancient runes pulse with pale luminescence, acknowledging thy presence before fading into eternal quietude.”';
      if (this.altarResonanceParticles && this.sanctuaryAltar) {
        this.altarResonanceParticles.explode(22);
      }
    } else if (type === 'banner') {
      title = '⚔ TATTERED CREST OF AETHELGARD ⚔';
      body = '“A tattered war pennant bearing the double-crescent emblem of the Old Kingdom.<br><br>Though frayed by centuries of abyssal ash and harsh border winds, the defiant silver weave refuses to surrender to rot.”';
      if (this.tatteredBanner) {
        this.tweens.add({
          targets: this.tatteredBanner,
          angle: { from: -4, to: 4 },
          duration: 220,
          yoyo: true,
          repeat: 3,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            if (this.tatteredBanner) this.tatteredBanner.setAngle(0);
          }
        });
      }
    }

    const modal = document.getElementById('lore-modal');
    const tEl = document.getElementById('lore-title');
    const bEl = document.getElementById('lore-text');
    if (modal && tEl && bEl) {
      tEl.textContent = title;
      bEl.innerHTML = body;
      modal.classList.remove('hidden');
    }
  }

  closeLoreModal() {
    const modal = document.getElementById('lore-modal');
    if (modal) modal.classList.add('hidden');
  }

  // ═════════════════════════════════════════════════════════════════
  //  HUD & CHRONOS STATE MACHINE
  // ═════════════════════════════════════════════════════════════════

  refreshHud() {
    const hud = document.getElementById('camp-hud');
    if (!hud) return;
    const p = getPlayer();

    const miniBadgeHtml = this.focusing
      ? `<div id="mini-timer-badge" class="hearth-mini-badge" title="Click to view Hearth Focus">🔥 FOCUSING: ${this.formatTime(this.focusElapsed)}</div>`
      : '';

    hud.innerHTML = `
      <div class="stat-pill-row">
        <div class="stat-pill"><span class="label">LVL</span><span class="value">${p.level}</span></div>
        <div class="stat-pill sanity"><span class="label">SANITY</span><span class="value">${p.sanity}/${CHRONOS.MAX_SANITY}</span></div>
        <div class="stat-pill gold"><span class="label">GOLD</span><span class="value">${p.gold}</span></div>
        <div class="stat-pill"><span class="label">RENOWN</span><span class="value">${p.renown}</span></div>
        ${miniBadgeHtml}
      </div>`;

    const miniBtn = document.getElementById('mini-timer-badge');
    if (miniBtn) miniBtn.onclick = () => this.openHearthModal();
  }

  formatTime(totalSec) {
    const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const s = String(totalSec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  async startFocus() {
    if (this.focusing) return;

    this.focusing = true;
    this.focusElapsed = 0;
    console.log('%c[Chronos] ═══ FOCUS SESSION STARTED ═══', 'color:#4caf50;font-weight:bold');

    const btn = document.getElementById('camp-focus-btn');
    if (btn) {
      btn.textContent = 'STOP FOCUS';
      btn.style.background = 'linear-gradient(180deg, #821c17 0%, #5c1411 100%)';
      btn.style.borderColor = '#b83b33';
    }

    const user = getUser();
    if (!isDemo() && user) {
      try {
        await setFocusStartTime(user.uid);
        console.log('[Chronos] ✓ focusStartTime written');
      } catch (e) {
        console.error('[Chronos] ✗ Failed to write focusStartTime:', e.code, e.message);
      }
    }

    const timerEl = document.getElementById('camp-timer');
    this.intervalId = setInterval(() => {
      this.focusElapsed++;
      if (timerEl) timerEl.textContent = this.formatTime(this.focusElapsed);
      const miniBadge = document.getElementById('mini-timer-badge');
      if (miniBadge) miniBadge.textContent = `🔥 FOCUSING: ${this.formatTime(this.focusElapsed)}`;
      if (this.focusElapsed % 30 === 0) {
        console.log(`[Chronos] Tick — ${this.focusElapsed}s`);
      }
    }, 1000);

    this.refreshHud();
  }

  async stopFocus() {
    if (!this.focusing) return;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.focusing = false;
    const totalSeconds = this.focusElapsed;
    const minutesFocused = Math.floor(totalSeconds / 60);

    console.log(`[Chronos] Stopped — Total: ${totalSeconds}s (${minutesFocused} min)`);

    const goldEarned = minutesFocused * CHRONOS.GOLD_PER_MINUTE;
    const sanityGained = minutesFocused * CHRONOS.SANITY_PER_MINUTE;

    const player = getPlayer();
    player.gold += goldEarned;
    player.sanity = Math.min(player.sanity + sanityGained, CHRONOS.MAX_SANITY);

    this.refreshHud();

    const toastEl = document.getElementById('camp-toast');
    if (toastEl) {
      toastEl.textContent = minutesFocused > 0
        ? `${minutesFocused} min · +${goldEarned} Gold · +${sanityGained} Sanity`
        : 'Focus at least 1 full minute to earn spoils.';
      toastEl.style.opacity = '1';
      setTimeout(() => { if (toastEl) toastEl.style.opacity = '0'; }, 4000);
    }

    const btn = document.getElementById('camp-focus-btn');
    if (btn) {
      btn.textContent = 'START FOCUS';
      btn.style.background = '';
      btn.style.borderColor = '';
    }
    const timerEl = document.getElementById('camp-timer');
    if (timerEl) timerEl.textContent = '00:00';
    this.focusElapsed = 0;

    const user = getUser();
    if (!isDemo() && user) {
      try {
        await saveFocusResults(user.uid, {
          gold: player.gold,
          sanity: player.sanity
        });
        console.log('[Chronos] ✓ Firestore updated with rewards');
      } catch (e) {
        console.error('[Chronos] ✗ Firestore update failed:', e.code, e.message);
      }
    }
  }

  async recoverFocusSession() {
    const user = getUser();
    if (isDemo() || !user) return;

    try {
      const snap = await getUserDocument(user.uid);
      if (!snap.exists()) return;
      const data = snap.data();
      if (!data.focusStartTime) return;

      const startMs = data.focusStartTime.toMillis();
      const elapsed = Math.floor((Date.now() - startMs) / 1000);

      if (elapsed > 0 && elapsed < 86400) {
        console.log(`[Chronos] Resuming active focus session (${elapsed}s)`);
        this.focusing = true;
        this.focusElapsed = elapsed;

        const btn = document.getElementById('camp-focus-btn');
        if (btn) {
          btn.textContent = 'STOP FOCUS';
          btn.style.background = 'linear-gradient(180deg, #821c17 0%, #5c1411 100%)';
          btn.style.borderColor = '#b83b33';
        }
        const timerEl = document.getElementById('camp-timer');
        if (timerEl) timerEl.textContent = this.formatTime(elapsed);

        this.intervalId = setInterval(() => {
          this.focusElapsed++;
          if (timerEl) timerEl.textContent = this.formatTime(this.focusElapsed);
          const miniBadge = document.getElementById('mini-timer-badge');
          if (miniBadge) miniBadge.textContent = `🔥 FOCUSING: ${this.formatTime(this.focusElapsed)}`;
        }, 1000);

        this.refreshHud();
      } else if (elapsed >= 86400) {
        await clearFocusStartTime(user.uid);
      }
    } catch (e) {
      console.error('[Chronos] Recovery failed:', e.code, e.message);
    }
  }

  // ═════════════════════════════════════════════════════════════════
  //  EYELID BLINK TRANSITION
  // ═════════════════════════════════════════════════════════════════

  createEyelidBlinkSequence() {
    $('eyelid-overlay')?.remove();
    const eyelids = document.createElement('div');
    eyelids.id = 'eyelid-overlay';
    eyelids.setAttribute('aria-hidden', 'true');
    eyelids.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: #060608;
      pointer-events: auto;
      will-change: mask-image, -webkit-mask-image;
      -webkit-mask-image: radial-gradient(ellipse 120% 0% at 50% 50%, transparent 45%, black 55%);
      mask-image: radial-gradient(ellipse 120% 0% at 50% 50%, transparent 45%, black 55%);
      -webkit-mask-composite: destination-out;
      mask-composite: exclude;
    `;
    document.body.appendChild(eyelids);
    this.eyelidOverlay = eyelids;

    const setAperture = yPercent => {
      const maskVal = `radial-gradient(ellipse 135% ${yPercent}% at 50% 50%, transparent 40%, black 55%)`;
      eyelids.style.webkitMaskImage = maskVal;
      eyelids.style.maskImage = maskVal;
    };

    const animateAperture = (fromY, toY, duration, onComplete) => {
      const start = performance.now();
      const step = now => {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / duration);
        const ease = 0.5 - Math.cos(progress * Math.PI) / 2;
        const currentY = fromY + (toY - fromY) * ease;
        setAperture(currentY);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else if (onComplete) {
          onComplete();
        }
      };
      requestAnimationFrame(step);
    };

    // Phase 1: Slit open to 16% over 400ms
    animateAperture(0, 16, 400, () => {
      // Phase 2: Snap close back to 0% over 150ms
      animateAperture(16, 0, 150, () => {
        // Phase 3: Open wide to 160% over 1500ms
        animateAperture(0, 160, 1500, () => {
          eyelids.remove();
          this.eyelidOverlay = null;
          console.log('[Scene_Camp] Eyelids fully opened to 2.5D Hamlet');
        });
      });
    });
  }

  // ═════════════════════════════════════════════════════════════════
  //  TEARDOWN
  // ═════════════════════════════════════════════════════════════════


  // ═════════════════════════════════════════════════════════════════
  //  AWAKENING SEQUENCE, TRAVEL TRANSITION, WORLD MAP & MINI-MAP
  // ═════════════════════════════════════════════════════════════════

  showAwakeningSequence() {
    if (!this.player) return;
    this.player.setAlpha(0);
    this.player.y += 14;
    this.tweens.add({
      targets: this.player,
      alpha: 1,
      y: this.player.y - 14,
      duration: 1400,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.player.play('player-idle');
      }
    });

    let toast = document.getElementById('awakening-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'awakening-toast';
      toast.className = 'awakening-toast-banner';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
      <span class="awakening-toast-rune">✧ ᛟ ᚨ ᛞ ✧</span>
      Thou awakest amidst the borderland ash...
      <span class="awakening-toast-sub">Speak with The Ashen Watcher [F] by the Eastern Arch.</span>
    `;
    setTimeout(() => toast.classList.add('show'), 400);
    setTimeout(() => toast.classList.remove('show'), 6500);
  }

  travelToOakhaven() {
    this.showTravelTransition(
      'OAKHAVEN OUTPOST',
      'Traveling the eastern road through the Gray Thickets toward the Imperial Frontier...',
      () => {
        this.scene.start('Scene_Oakhaven', { entrySide: 'west' });
      }
    );
  }

  showTravelTransition(title, subtitle, onComplete) {
    let overlay = document.getElementById('travel-screen');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'travel-screen';
      overlay.className = 'travel-transition-overlay';
      overlay.innerHTML = `
        <div class="travel-title"></div>
        <div class="travel-subtitle"></div>
        <div class="travel-spinner"></div>
      `;
      document.body.appendChild(overlay);
    }

    overlay.querySelector('.travel-title').textContent = title;
    overlay.querySelector('.travel-subtitle').textContent = subtitle;
    overlay.classList.add('active');

    setTimeout(() => {
      overlay.classList.remove('active');
      if (onComplete) onComplete();
    }, 1800);
  }

  openWorldMapModal() {
    worldMapOverlay.open('ashen-hamlet', (dest) => {
      if (dest.id === 'oakhaven-outpost') {
        this.travelToOakhaven();
      }
    });
  }

  toggleWorldMap() {
    if (worldMapOverlay.isOpen()) {
      worldMapOverlay.close();
    } else {
      this.openWorldMapModal();
    }
  }

  drawSpringWater() {
    const player = getPlayer();
    player.sanity = Math.min(100, (player.sanity || 100) + 10);
    this.showItemAcquiredToast('✦ DREW SPRING WATER · Restored 10 Sanity ✦');
  }

  createMiniMapHUD() {
    let container = document.getElementById('minimap-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'minimap-container';
      document.body.appendChild(container);
    }
    container.className = 'minimap-container';
    container.title = 'Click to open Continental Atlas [M]';
    container.innerHTML = `
      <div class="minimap-header">
        <span class="minimap-region-name">🔥 THE ASHEN HAMLET</span>
        <div style="display:flex;gap:4px;align-items:center;">
          <span class="minimap-key-badge atlas-badge" id="minimap-open-atlas" title="Open World Atlas [M]">[M] ATLAS</span>
          <span class="minimap-key-badge" id="minimap-toggle-key" title="Toggle Mini-Map [N]">[N]</span>
        </div>
      </div>
      <canvas id="minimap-canvas" width="208" height="70"></canvas>
      <div class="minimap-legend">
        <div class="minimap-legend-item"><span class="blip-sample blip-player"></span>You</div>
        <div class="minimap-legend-item"><span class="blip-sample blip-hearth"></span>Hearth</div>
        <div class="minimap-legend-item"><span class="blip-sample blip-vault"></span>Vault</div>
        <div class="minimap-legend-item"><span class="blip-sample blip-npc"></span>Watcher</div>
        <div class="minimap-legend-item"><span class="blip-sample blip-gate"></span>Gate</div>
      </div>
    `;

    // Click anywhere on mini-map container to open World Map (unless clicking toggle [N])
    container.onclick = (e) => {
      if (e.target.closest('#minimap-toggle-key')) {
        this.toggleMiniMap();
      } else {
        this.toggleWorldMap();
      }
    };

    this.miniMapContainer = container;
    this.miniMapCanvas = container.querySelector('#minimap-canvas');
    this.miniMapCtx = this.miniMapCanvas.getContext('2d');
  }

  toggleMiniMap() {
    if (!this.miniMapContainer) return;
    this.miniMapContainer.classList.toggle('hidden');
  }

  updateMiniMapHUD() {
    if (!this.miniMapCtx || !this.player || this.miniMapContainer?.classList.contains('hidden')) return;

    const ctx = this.miniMapCtx;
    const cw = this.miniMapCanvas.width;
    const ch = this.miniMapCanvas.height;

    // Atmospheric dark background with subtle twilight sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, ch);
    skyGrad.addColorStop(0, '#06070e');
    skyGrad.addColorStop(0.5, '#120e24');
    skyGrad.addColorStop(1, '#08070b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, cw, ch);

    // Mountain silhouettes in background
    ctx.fillStyle = '#0a0814';
    ctx.beginPath();
    ctx.moveTo(0, ch * 0.48);
    ctx.lineTo(cw * 0.25, ch * 0.32);
    ctx.lineTo(cw * 0.5, ch * 0.42);
    ctx.lineTo(cw * 0.75, ch * 0.30);
    ctx.lineTo(cw, ch * 0.45);
    ctx.lineTo(cw, ch * 0.55);
    ctx.lineTo(0, ch * 0.55);
    ctx.closePath();
    ctx.fill();

    // Ground plane
    ctx.fillStyle = '#120f1c';
    ctx.fillRect(0, ch * 0.55, cw, ch * 0.45);

    // Cobblestone stone road line across Hamlet
    ctx.strokeStyle = '#4a3b5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, ch * 0.72);
    ctx.lineTo(cw - 4, ch * 0.72);
    ctx.stroke();

    const W = this.worldWidth || 2400;
    const toMapX = (worldX) => (worldX / W) * (cw - 16) + 8;
    const toMapY = (worldY) => {
      const H = (this.scale.height && this.scale.height > 100) ? this.scale.height : 720;
      const progress = (worldY - H * 0.54) / (H * 0.40);
      return Phaser.Math.Clamp(ch * 0.58 + progress * (ch * 0.36), ch * 0.56, ch - 5);
    };

    // Vault Chest (Cyan: x ~ 380)
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(toMapX(380), ch * 0.72 - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Ancient Well (Sky Blue: x ~ 620)
    ctx.fillStyle = '#40c4ff';
    ctx.beginPath();
    ctx.arc(toMapX(620), ch * 0.72 - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Sanctuary Altar (Teal: x ~ 780)
    ctx.fillStyle = '#7fe0d4';
    ctx.beginPath();
    ctx.arc(toMapX(780), ch * 0.72 - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Cart (Warm Brown: x ~ 1060)
    ctx.fillStyle = '#a1887f';
    ctx.fillRect(toMapX(1060) - 2.5, ch * 0.72 - 4, 5, 4);

    // Campfire Hearth (Orange dot: x ~ 1200)
    ctx.fillStyle = '#ff6a00';
    ctx.beginPath();
    ctx.arc(toMapX(1200), ch * 0.72 - 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Map Table (Parchment Gold dot: x ~ 1640)
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath();
    ctx.arc(toMapX(1640), ch * 0.72 - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Ashen Watcher (Arcane Violet: x ~ 1830)
    ctx.fillStyle = '#b388ff';
    ctx.fillRect(toMapX(1830) - 2.5, ch * 0.72 - 6, 5, 8);

    // Hamlet Gate (Emerald Green Arch: x ~ 2240)
    ctx.fillStyle = '#69f0ae';
    ctx.fillRect(toMapX(2240) - 2.5, ch * 0.72 - 6, 5, 8);

    // Player (Glowing Gold Diamond)
    const px = toMapX(this.player.x);
    const py = toMapY(this.player.y);

    // Outer glow ring
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Gold diamond
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(px, py - 4.5);
    ctx.lineTo(px + 4, py);
    ctx.lineTo(px, py + 4.5);
    ctx.lineTo(px - 4, py);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  teardown() {
    this.eyelidOverlay?.remove();
    this.eyelidOverlay = null;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.resizeCb) {
      this.scale.off('resize', this.resizeCb);
      this.resizeCb = null;
    }

    document.getElementById('camp-hud')?.remove();
    document.getElementById('hamlet-prompt')?.remove();
    document.getElementById('item-toast-banner')?.remove();
    document.getElementById('hearth-modal')?.remove();
    document.getElementById('dialogue-modal')?.remove();
    document.getElementById('gate-modal')?.remove();
    document.getElementById('lore-modal')?.remove();
    document.getElementById('mobile-controls')?.remove();

    if (this.backdropRT) {
      this.backdropRT.destroy();
      this.backdropRT = null;
    }

    destroyActiveInventoryOverlay();
    console.log('[Scene_Camp] Teardown complete');
  }
}