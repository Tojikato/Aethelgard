// ═══════════════════════════════════════════════════════════════════════════
//  SCENE: OAKHAVEN OUTPOST — Frontier Stronghold of the Empire
//  Interactive 2.5D Belt-Scroller RPG Environment
// ═══════════════════════════════════════════════════════════════════════════

import { $, getPlayer } from '../services/gameState.js';
import { CAMP } from '../config/camp.js';
import { CHRONOS } from '../services/chronos.js';
import { getInventoryOverlay } from '../ui/InventoryOverlay.js';
import { worldMapOverlay } from '../ui/WorldMapOverlay.js';
import { createPlayer, ensureProceduralActorTextures } from '../services/playerFactory.js';

export default class Scene_Oakhaven extends Phaser.Scene {
  constructor() {
    super('Scene_Oakhaven');
    this.worldWidth = 2400;
  }

  init(data = {}) {
    this.entrySide = data.entrySide || 'west';
    this.spawnPosition = data.position || null;
  }

  create() {
    // Generate procedural actor textures if not yet present
    ensureProceduralActorTextures(this);

    const W = this.worldWidth || 2400;
    const H = (this.scale.height && this.scale.height > 100)
      ? this.scale.height
      : (window.innerHeight > 100 ? window.innerHeight : 720);

    // Camera setup
    const camera = this.cameras.main;
    camera.resetFX();
    camera.setBackgroundColor('#060608');
    camera.setBounds(0, 0, W, H);

    // Unhide top bar and set chapter title
    const gameTop = document.querySelector('.game-top');
    if (gameTop) {
      gameTop.style.transition = 'none';
      gameTop.style.opacity = '1';
      gameTop.hidden = false;
    }
    const ch = document.getElementById('chapter-title');
    if (ch) ch.textContent = 'III · OAKHAVEN OUTPOST';

    const gameShell = document.getElementById('game-shell');
    if (gameShell) {
      gameShell.hidden = false;
      gameShell.inert = false;
    }

    // 0. Top-left HUD Stat Bars (LVL, SANITY, GOLD, RENOWN)
    this.buildHud();

    // 1. Procedural Backdrop & Town Streets
    this.renderOakhavenBackdrop(W, H);

    // 2. Build Town Entities & Buildings
    this.buildOakhavenEntities(W, H);

    // 3. Setup Controllable Player Character
    const spawnX = this.spawnPosition ? this.spawnPosition.x : (this.entrySide === 'east' ? W - 200 : 220);
    const spawnY = this.spawnPosition ? this.spawnPosition.y : H * 0.76;

    this.player = createPlayer(this, spawnX, spawnY);
    this.playerShadow = this.add.ellipse(this.player.x, this.player.y, 32, 9, 0x030305, 0.48);

    // Camera follow
    camera.startFollow(this.player, true, 0.1, 0.1);

    // 4. Scenery list for 2.5D Y-sorting
    this.ySortedObjects = [
      this.westGate,
      this.watchtower,
      this.noticeboard,
      this.shopStall,
      this.merchant,
      this.cottage,
      this.timberHouse,
      this.tallHouse,
      this.tavern,
      this.cathedral,
      this.malakor,
      this.player
    ].filter(Boolean);

    // 5. Layout all town buildings and actors firmly on ground line
    this.layoutOakhaven(W, H);

    // 6. Controls & Inputs
    this.setupControls();

    // 7. DOM UI & Interactive Mini-Map HUD
    this.buildOakhavenDOM();
    this.createMiniMapHUD();

    // Fade in
    camera.fadeIn(1000, 0, 0, 0);

    // Awakening / Arrival Toast
    this.showTownBanner('✦ ENTERING OAKHAVEN OUTPOST · FRONTIER STRONGHOLD ✦');

    // Handle window resize
    this.resizeCb = (gameSize) => this.handleResize(gameSize);
    this.scale.on('resize', this.resizeCb);

    // Teardown
    this.events.once('shutdown', () => {
      this.teardown();
    });
  }

  renderOakhavenBackdrop(width, height) {
    if (!this.backdropGfx) {
      this.backdropGfx = this.add.graphics().setDepth(-10);
    } else {
      this.backdropGfx.clear();
    }

    const gfx = this.backdropGfx;
    const horizonY = height * 0.52;

    // Midnight forest twilight sky
    gfx.fillGradientStyle(0x05070e, 0x05070e, 0x141028, 0x1c1634, 1);
    gfx.fillRect(0, 0, width, horizonY);

    // Distant mountain ridgeline
    gfx.fillStyle(0x0a0812, 1);
    gfx.beginPath();
    gfx.moveTo(0, horizonY);
    for (let x = 0; x <= width + 20; x += 30) {
      const my = horizonY - 45 + Math.sin(x * 0.005) * 25 + Math.cos(x * 0.012) * 15;
      gfx.lineTo(x, my);
    }
    gfx.lineTo(width, horizonY);
    gfx.closePath();
    gfx.fillPath();

    // Distant Pine Forest Silhouettes
    for (let x = 10; x < width; x += 40) {
      const treeH = 18 + ((x * 19) % 15);
      const ty = horizonY - 8 + Math.sin(x * 0.006) * 12;
      gfx.fillStyle(0x0e0c18, 0.9);
      gfx.beginPath();
      gfx.moveTo(x, ty - treeH);
      gfx.lineTo(x - 6, ty);
      gfx.lineTo(x + 6, ty);
      gfx.closePath();
      gfx.fillPath();
    }

    // Ground plane base
    gfx.fillGradientStyle(0x13101c, 0x13101c, 0x07060a, 0x07060a, 1);
    gfx.fillRect(0, horizonY, width, height - horizonY);

    // Paved stone thoroughfare (The King's Way)
    const groundH = height - horizonY;
    const roadTop = horizonY + groundH * 0.22;
    const roadHeight = groundH * 0.72;

    gfx.fillStyle(0x181422, 0.6);
    gfx.fillRect(0, roadTop, width, roadHeight);

    // Weathered town flagstones
    for (let r = 0; r < 7; r++) {
      const rowY = roadTop + (r / 7) * roadHeight + 4;
      const stoneH = Math.max(8, Math.floor(groundH * 0.07));
      let curX = -20 + (r * 29) % 50;

      while (curX < width + 40) {
        const stoneW = 34 + ((curX * 13 + r * 19) % 24);
        const stoneColors = [0x221c2c, 0x272033, 0x1d1726, 0x2a2236];
        const color = stoneColors[(Math.floor(curX * 0.03) + r) % 4];

        gfx.fillStyle(color, 0.7);
        gfx.fillRoundedRect(curX + 2, rowY + 1, stoneW - 3, stoneH - 2, 2);

        gfx.lineStyle(1, 0x3d324c, 0.3);
        gfx.lineBetween(curX + 3, rowY + 1, curX + stoneW - 2, rowY + 1);

        gfx.lineStyle(1, 0x0a080f, 0.75);
        gfx.strokeRoundedRect(curX + 2, rowY + 1, stoneW - 3, stoneH - 2, 2);

        curX += stoneW + 4;
      }
    }

    // Street foundation plinths beneath town buildings
    const baseLineY = height * 0.73;
    gfx.fillStyle(0x16131f, 0.95);
    gfx.fillRect(300, baseLineY - 8, width - 400, 10);
    gfx.fillStyle(0x352f40, 0.85);
    gfx.fillRect(300, baseLineY - 8, width - 400, 2);
    gfx.fillStyle(0x0c0a10, 0.95);
    gfx.fillRect(300, baseLineY + 2, width - 400, 2);
  }

  buildHud() {
    let hud = document.getElementById('camp-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'camp-hud';
      hud.style.cssText = 'position:fixed;top:18px;left:24px;z-index:500;pointer-events:auto;';
      document.body.appendChild(hud);
    }
    this.refreshHud();
  }

  refreshHud() {
    const hud = document.getElementById('camp-hud');
    if (!hud) return;
    const p = getPlayer();
    hud.innerHTML = `
      <div class="stat-pill-row">
        <div class="stat-pill"><span class="label">LVL</span><span class="value">${p.level || 1}</span></div>
        <div class="stat-pill sanity"><span class="label">SANITY</span><span class="value">${p.sanity || 100}/${CHRONOS.MAX_SANITY || 100}</span></div>
        <div class="stat-pill gold"><span class="label">GOLD</span><span class="value">${p.gold || 0}</span></div>
        <div class="stat-pill"><span class="label">RENOWN</span><span class="value">${p.renown || 0}</span></div>
      </div>`;
  }

  buildOakhavenEntities(W, H) {
    const baseLineY = H * 0.74;

    // 1. West Gate (Return to Hamlet)
    this.westGate = this.add.image(140, baseLineY, 'arch-stone')
      .setOrigin(0.5, 1)
      .setScale(0.95);

    // 2. Frontier Watchtower
    this.watchtower = this.add.image(380, baseLineY, 'building-watchtower')
      .setOrigin(0.5, 1);

    // 3. Quest Notice Board
    this.noticeboard = this.add.image(540, baseLineY + 15, 'noticeboard')
      .setOrigin(0.5, 1)
      .setScale(1.2);

    // 4. Merchant Brand's Shop Stall
    this.shopStall = this.add.image(780, baseLineY, 'building-shop-stall')
      .setOrigin(0.5, 1);

    // Merchant NPC sprite
    this.merchant = this.add.sprite(780, baseLineY + 2, 'watcher_idle_0')
      .setOrigin(0.5, 1)
      .setScale(2.2)
      .setTint(0xedd8a8);
    if (this.anims.exists('watcher-idle')) {
      this.merchant.play('watcher-idle');
    }

    // 5. Residential District: Cottages & Houses
    this.cottage = this.add.image(1080, baseLineY, 'building-cottage')
      .setOrigin(0.5, 1);

    this.timberHouse = this.add.image(1320, baseLineY, 'building-timber-house')
      .setOrigin(0.5, 1);

    this.tallHouse = this.add.image(1560, baseLineY, 'building-tall-house')
      .setOrigin(0.5, 1);

    // 6. The Ashen Flagon Tavern
    this.tavern = this.add.image(1840, baseLineY, 'building-tavern')
      .setOrigin(0.5, 1);

    // 7. Grand Cathedral / Adventurers' Guild
    this.cathedral = this.add.image(2160, baseLineY, 'building-cathedral')
      .setOrigin(0.5, 1);

    // Archmage Malakor Guild Master NPC
    this.malakor = this.add.sprite(2160, baseLineY + 5, 'watcher_idle_0')
      .setOrigin(0.5, 1)
      .setScale(2.4)
      .setTint(0xcaa8ff); // Arcane purple aura
    if (this.anims.exists('watcher-idle')) {
      this.malakor.play('watcher-idle');
    }

    // Ambient Braziers along the thoroughfare
    const brazierKey = this.textures.exists('brazier-body')
      ? 'brazier-body'
      : (this.textures.exists('brazier-orange') ? 'brazier-orange' : 'prop-brazier-orange');
    const brazierPositions = [140 - 55, 140 + 55, 380 + 70, 780 - 80, 1840 - 80, 2160 - 110, 2160 + 110];
    this.braziers = [];
    if (this.textures.exists(brazierKey)) {
      for (const bx of brazierPositions) {
        const br = this.add.image(bx, baseLineY + 10, brazierKey).setOrigin(0.5, 1).setScale(0.8);
        this.braziers.push(br);
      }
    }
  }

  layoutOakhaven(W, H) {
    const baseLineY = H * 0.74;

    if (this.westGate) this.westGate.setPosition(140, baseLineY);
    if (this.watchtower) this.watchtower.setPosition(380, baseLineY);
    if (this.noticeboard) this.noticeboard.setPosition(540, baseLineY + 15);
    if (this.shopStall) this.shopStall.setPosition(780, baseLineY);
    if (this.merchant) this.merchant.setPosition(780, baseLineY + 2);
    if (this.cottage) this.cottage.setPosition(1080, baseLineY);
    if (this.timberHouse) this.timberHouse.setPosition(1320, baseLineY);
    if (this.tallHouse) this.tallHouse.setPosition(1560, baseLineY);
    if (this.tavern) this.tavern.setPosition(1840, baseLineY);
    if (this.cathedral) this.cathedral.setPosition(2160, baseLineY);
    if (this.malakor) this.malakor.setPosition(2160, baseLineY + 5);

    if (this.braziers) {
      const brazierPositions = [140 - 55, 140 + 55, 380 + 70, 780 - 80, 1840 - 80, 2160 - 110, 2160 + 110];
      this.braziers.forEach((br, idx) => {
        if (br && brazierPositions[idx]) br.setPosition(brazierPositions[idx], baseLineY + 10);
      });
    }

    if (this.player) {
      const bounds = this.getWalkBounds();
      this.player.x = Phaser.Math.Clamp(this.player.x, bounds.minX, bounds.maxX);
      this.player.y = Phaser.Math.Clamp(this.player.y, bounds.minY, bounds.maxY);
      if (this.playerShadow) this.playerShadow.setPosition(this.player.x, this.player.y);
    }

    this.updateSortYProperties();
    this.rebuildObstacleBoxes();
    this.rebuildInteractionTargets();
  }

  getWalkBounds() {
    const W = this.worldWidth || 2400;
    const H = (this.scale.height && this.scale.height > 100) ? this.scale.height : (window.innerHeight > 100 ? window.innerHeight : 720);
    return {
      minX: 45,
      maxX: W - 45,
      minY: H * 0.54,
      maxY: H * 0.94
    };
  }

  updateSortYProperties() {
    for (const obj of this.ySortedObjects) {
      if (!obj) continue;
      obj.sortY = obj.y;
      obj.setDepth(Math.floor(obj.sortY));
    }
    if (this.player) {
      this.player.sortY = this.player.y;
      this.player.setDepth(Math.floor(this.player.sortY));
    }
  }

  rebuildObstacleBoxes() {
    this.obstacleBoxes = [];
    const addBox = (obj, halfW, halfH, offsetY = 0) => {
      if (!obj) return;
      this.obstacleBoxes.push({
        minX: obj.x - halfW,
        maxX: obj.x + halfW,
        minY: obj.y - halfH + offsetY,
        maxY: obj.y + offsetY
      });
    };

    // Buildings footprints (solid collision footprints)
    addBox(this.westGate, 65, 20);
    addBox(this.watchtower, 60, 24);
    addBox(this.noticeboard, 25, 15);
    addBox(this.shopStall, 75, 25);
    addBox(this.cottage, 85, 25);
    addBox(this.timberHouse, 90, 25);
    addBox(this.tallHouse, 85, 25);
    addBox(this.tavern, 110, 28);
    addBox(this.cathedral, 140, 32);
  }

  rebuildInteractionTargets() {
    const H = this.scale.height;
    const baseLineY = H * 0.73;

    this.interactionTargets = [
      {
        id: 'west_gate',
        title: 'West Road Gate',
        prompt: '[F] RETURN TO THE ASHEN HAMLET',
        x: 140,
        y: baseLineY - 10,
        radius: 75,
        action: () => this.travelToHamlet()
      },
      {
        id: 'noticeboard',
        title: 'Frontier Noticeboard',
        prompt: '[F] READ BOUNTY NOTICEBOARD',
        x: 540,
        y: baseLineY + 5,
        radius: 65,
        action: () => this.openNoticeboardModal()
      },
      {
        id: 'merchant',
        title: 'Merchant Brand',
        prompt: '[F] TRADE WITH MERCHANT BRAND',
        x: 780,
        y: baseLineY,
        radius: 75,
        action: () => this.openMerchantModal()
      },
      {
        id: 'tavern',
        title: 'The Ashen Flagon',
        prompt: '[F] REST AT THE TAVERN (100 SANITY)',
        x: 1840,
        y: baseLineY,
        radius: 90,
        action: () => this.restAtTavern()
      },
      {
        id: 'malakor',
        title: 'Archmage Malakor',
        prompt: '[F] AUDIENCE WITH ARCHMAGE MALAKOR',
        x: 2160,
        y: baseLineY,
        radius: 85,
        action: () => this.openMalakorDialogue()
      }
    ];
  }

  setupControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.keyF.on('down', () => this.triggerActiveInteraction());
    this.keySpace.on('down', () => this.triggerActiveInteraction());
    this.keyM.on('down', () => this.toggleWorldMap());
    this.keyN.on('down', () => this.toggleMiniMap());
  }

  update(time, delta) {
    if (this.isTransitioning) return;
    this.handlePlayerMovement(delta);
    this.handleProximityAndInteraction();
    this.updateMiniMapHUD();
  }

  handlePlayerMovement(delta) {
    if (!this.player) return;

    let moveX = 0;
    let moveY = 0;

    if (this.cursors.left.isDown || this.keyA.isDown) moveX -= 1;
    if (this.cursors.right.isDown || this.keyD.isDown) moveX += 1;
    if (this.cursors.up.isDown || this.keyW.isDown) moveY -= 1;
    if (this.cursors.down.isDown || this.keyS.isDown) moveY += 1;

    // Mobile joystick input
    if (this.joystickVector && (Math.abs(this.joystickVector.x) > 0.1 || Math.abs(this.joystickVector.y) > 0.1)) {
      moveX = this.joystickVector.x;
      moveY = this.joystickVector.y;
    }

    const isMoving = moveX !== 0 || moveY !== 0;

    if (isMoving) {
      const mag = Math.hypot(moveX, moveY);
      const normX = moveX / mag;
      const normY = moveY / mag;

      const speed = CAMP.movementSpeed || 288;
      const step = (speed * delta) / 1000;

      let nextX = this.player.x + normX * step;
      let nextY = this.player.y + normY * step;

      // Bounds clamping
      const H = this.scale.height;
      const minX = 45;
      const maxX = this.worldWidth - 45;
      const minY = H * 0.54;
      const maxY = H * 0.94;

      nextX = Phaser.Math.Clamp(nextX, minX, maxX);
      nextY = Phaser.Math.Clamp(nextY, minY, maxY);

      // Obstacle collision testing
      if (!this.isObstacleBlocked(nextX, this.player.y)) {
        this.player.x = nextX;
      }
      if (!this.isObstacleBlocked(this.player.x, nextY)) {
        this.player.y = nextY;
      }

      if (this.playerShadow) {
        this.playerShadow.setPosition(this.player.x, this.player.y);
      }

      // Sprite flip
      if (normX < -0.1) this.player.setFlipX(true);
      else if (normX > 0.1) this.player.setFlipX(false);

      if (this.anims.exists('player-walk') && this.player.anims.currentAnim?.key !== 'player-walk') {
        this.player.play('player-walk');
      }
    } else {
      if (this.anims.exists('player-idle') && this.player.anims.currentAnim?.key !== 'player-idle') {
        this.player.play('player-idle');
      }
    }

    // 2.5D Dynamic Y-Sorting
    this.player.sortY = this.player.y;
    this.player.setDepth(Math.floor(this.player.sortY));
    if (this.playerShadow) {
      this.playerShadow.setDepth(this.player.depth - 1);
    }
  }

  isObstacleBlocked(x, y) {
    for (const b of this.obstacleBoxes || []) {
      if (x + 10 > b.minX && x - 10 < b.maxX && y > b.minY && y - 10 < b.maxY) {
        return true;
      }
    }
    return false;
  }

  handleProximityAndInteraction() {
    let closest = null;
    let minDist = Infinity;

    for (const t of this.interactionTargets || []) {
      const d = Math.hypot(this.player.x - t.x, this.player.y - t.y);
      if (d <= t.radius && d < minDist) {
        minDist = d;
        closest = t;
      }
    }

    this.activeTarget = closest;
    if (closest) {
      this.showPrompt(closest);
    } else {
      this.hidePrompt();
    }
  }

  triggerActiveInteraction() {
    if (this.activeTarget && this.activeTarget.action) {
      this.activeTarget.action();
    }
  }

  showPrompt(target) {
    if (!this.promptEl) return;
    const txt = document.getElementById('hamlet-prompt-text');
    if (txt) txt.textContent = target.prompt.replace('[F] ', '');

    // Screen-space position accounting for camera scroll!
    const screenX = target.x - this.cameras.main.scrollX;
    const screenY = target.y - this.cameras.main.scrollY;

    this.promptEl.style.left = `${screenX}px`;
    this.promptEl.style.top = `${screenY - 45}px`;
    this.promptEl.style.display = 'flex';
  }

  hidePrompt() {
    if (this.promptEl) this.promptEl.style.display = 'none';
  }

  showTownBanner(message) {
    let banner = document.getElementById('oakhaven-toast');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'oakhaven-toast';
      banner.className = 'awakening-toast-banner';
      document.body.appendChild(banner);
    }
    banner.innerHTML = `<span class="awakening-toast-rune">✧ ᛟ ᚨ ᛞ ✧</span>${message}`;
    banner.classList.add('show');
    setTimeout(() => {
      banner.classList.remove('show');
    }, 4500);
  }

  // ═════════════════════════════════════════════════════════════════
  //  MODALS & TOWN INTERACTIONS
  // ═════════════════════════════════════════════════════════════════

  travelToHamlet() {
    this.showTravelTransition('THE ASHEN HAMLET', 'Returning westward through the borderland wastes...', () => {
      this.scene.start('Scene_Camp', { returnPosition: { x: 2150, y: this.scale.height * 0.77 } });
    });
  }

  toggleWorldMap() {
    if (worldMapOverlay.isOpen()) {
      worldMapOverlay.close();
    } else {
      worldMapOverlay.open('oakhaven-outpost', (dest) => {
        if (dest.id === 'ashen-hamlet') {
          this.travelToHamlet();
        }
      });
    }
  }

  showTravelTransition(title, subtitle, onComplete) {
    this.isTransitioning = true;
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
      this.isTransitioning = false;
      if (onComplete) onComplete();
    }, 1800);
  }

  openNoticeboardModal() {
    let modal = document.getElementById('oakhaven-modal');
    if (!modal) modal = this.createTownModal();
    modal.classList.remove('hidden');

    modal.querySelector('#town-modal-title').textContent = '✧ FRONTIER BOUNTY NOTICEBOARD ✧';
    modal.querySelector('#town-modal-content').innerHTML = `
      <div style="font-family:'Crimson Text',serif;font-size:16px;line-height:1.7;">
        <p><b>[CONTRACT I: Abyssal Stray Slime Culling]</b><br>
        Reward: 40 Gold · 10 Renown<br>
        <em>"Oozes breach the borderland perimeter nightly. Slay five strays to protect our sheepfold."</em> — Commander Vane</p>
        <hr style="border-color:#5a472c;margin:12px 0;">
        <p><b>[CONTRACT II: Ashen Ore Delivery]</b><br>
        Reward: 75 Gold · 25 Renown<br>
        <em>"Smith Brand requires four chunks of meteoritic iron salvaged from the Abyssal Crater."</em></p>
      </div>
    `;
  }

  openMerchantModal() {
    let modal = document.getElementById('oakhaven-modal');
    if (!modal) modal = this.createTownModal();
    modal.classList.remove('hidden');

    const inv = getInventoryOverlay();
    const player = getPlayer();

    modal.querySelector('#town-modal-title').textContent = '✧ MERCHANT BRAND · FRONTIER WARES ✧';
    modal.querySelector('#town-modal-content').innerHTML = `
      <p style="font-family:'Crimson Text',serif;font-size:16px;margin-bottom:14px;">
        “Welcome, wanderer. Few make it past the Hamlet with purse intact. Thy Gold: <b style="color:#ffd700;">${player.gold || 0} G</b>.”
      </p>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(20,16,25,0.7);padding:8px 12px;border:1px solid #5a472c;border-radius:4px;">
          <span>🧪 <b>Crimson Vitality Draught</b> (Restores 35 Sanity)</span>
          <button id="buy-potion-btn" class="dialogue-choice-btn" style="padding:4px 12px;" type="button">Buy (20 Gold)</button>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(20,16,25,0.7);padding:8px 12px;border:1px solid #5a472c;border-radius:4px;">
          <span>⚗️ <b>Aetheric Focus Elixir</b> (2x Gold during Focus)</span>
          <button id="buy-elixir-btn" class="dialogue-choice-btn" style="padding:4px 12px;" type="button">Buy (35 Gold)</button>
        </div>
      </div>
    `;

    modal.querySelector('#buy-potion-btn').onclick = () => {
      if ((player.gold || 0) >= 20) {
        player.gold -= 20;
        if (inv) inv.addItem('potion-red', 1);
        this.showTownBanner('✦ Purchased Crimson Vitality Draught ✦');
        this.openMerchantModal();
      } else {
        alert('Thou lackest sufficient gold.');
      }
    };
    modal.querySelector('#buy-elixir-btn').onclick = () => {
      if ((player.gold || 0) >= 35) {
        player.gold -= 35;
        if (inv) inv.addItem('potion-teal', 1);
        this.showTownBanner('✦ Purchased Aetheric Focus Elixir ✦');
        this.openMerchantModal();
      } else {
        alert('Thou lackest sufficient gold.');
      }
    };
  }

  restAtTavern() {
    const player = getPlayer();
    player.sanity = 100;
    this.showTownBanner('✦ RESTED AT THE ASHEN FLAGON · SANITY RESTORED TO 100 ✦');
  }

  openMalakorDialogue() {
    let modal = document.getElementById('oakhaven-modal');
    if (!modal) modal = this.createTownModal();
    modal.classList.remove('hidden');

    modal.querySelector('#town-modal-title').textContent = '✧ ARCHMAGE MALAKOR · ADVENTURERS’ GUILD ✧';
    modal.querySelector('#town-modal-content').innerHTML = `
      <div style="font-family:'Crimson Text',serif;font-size:16px;line-height:1.7;">
        <p><em>Archmage Malakor tilts his ornate amethyst-inlaid staff, observing you with a piercing, analytical gaze.</em></p>
        <p style="margin-top:10px;">“So. The Abyssal Gate spat out another living soul. The Ashen Watcher sent word of thy survival. Rare indeed.”</p>
        <p style="margin-top:10px;">“As Grand Overseer of the Oakhaven Guild, I hereby induct thee into our ranks. Keep thy sanity intact, consult thy <b>Atlas [M]</b>, and prepare for the road to the <b>Bastion of Iron</b> once thy Renown reaches 100.”</p>
      </div>
    `;
  }

  createTownModal() {
    const modal = document.createElement('div');
    modal.id = 'oakhaven-modal';
    modal.className = 'dialogue-modal-overlay hidden';
    modal.innerHTML = `
      <div class="dialogue-modal-frame" style="max-width:620px;">
        <div class="dialogue-npc-header">
          <span id="town-modal-title" class="dialogue-npc-title">OAKHAVEN</span>
          <button id="town-modal-close-x" class="hearth-modal-close" type="button">✕</button>
        </div>
        <div id="town-modal-content" class="dialogue-npc-text"></div>
        <div style="display:flex;justify-content:flex-end;margin-top:16px;">
          <button id="town-modal-return" class="dialogue-choice-btn" type="button">✦ [Close]</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#town-modal-close-x').onclick = () => modal.classList.add('hidden');
    modal.querySelector('#town-modal-return').onclick = () => modal.classList.add('hidden');
    return modal;
  }

  buildOakhavenDOM() {
    // Shared prompt element
    this.promptEl = document.getElementById('hamlet-prompt');
    if (!this.promptEl) {
      this.promptEl = document.createElement('div');
      this.promptEl.id = 'hamlet-prompt';
      this.promptEl.className = 'hamlet-prompt';
      this.promptEl.innerHTML = `<span class="prompt-badge">[F]</span><span id="hamlet-prompt-text">INTERACT</span>`;
      document.body.appendChild(this.promptEl);
    }
  }

  // ═════════════════════════════════════════════════════════════════
  //  MINI-MAP HUD (Oakhaven Outpost)
  // ═════════════════════════════════════════════════════════════════

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
        <span class="minimap-region-name">🏰 OAKHAVEN OUTPOST</span>
        <div style="display:flex;gap:4px;align-items:center;">
          <span class="minimap-key-badge atlas-badge" id="minimap-open-atlas" title="Open World Atlas [M]">[M] ATLAS</span>
          <span class="minimap-key-badge" id="minimap-toggle-key" title="Toggle Mini-Map [N]">[N]</span>
        </div>
      </div>
      <canvas id="minimap-canvas" width="208" height="70"></canvas>
      <div class="minimap-legend">
        <div class="minimap-legend-item"><span class="blip-sample blip-player"></span>You</div>
        <div class="minimap-legend-item"><span class="blip-sample blip-gate"></span>Gate</div>
        <div class="minimap-legend-item"><span class="blip-sample blip-vault"></span>Shop</div>
        <div class="minimap-legend-item"><span class="blip-sample blip-hearth"></span>Tavern</div>
        <div class="minimap-legend-item"><span class="blip-sample blip-npc"></span>Guild</div>
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

    // Cobblestone street line
    ctx.strokeStyle = '#4a3b5c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, ch * 0.72);
    ctx.lineTo(cw - 4, ch * 0.72);
    ctx.stroke();

    const toMapX = (worldX) => (worldX / this.worldWidth) * (cw - 16) + 8;
    const toMapY = (worldY) => {
      const H = (this.scale.height && this.scale.height > 100) ? this.scale.height : 720;
      const progress = (worldY - H * 0.54) / (H * 0.40);
      return Phaser.Math.Clamp(ch * 0.58 + progress * (ch * 0.36), ch * 0.56, ch - 5);
    };

    // West Gate (Green/White arch)
    ctx.fillStyle = '#69f0ae';
    ctx.fillRect(toMapX(140) - 2.5, ch * 0.72 - 6, 5, 8);

    // Shop Stall (Cyan)
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(toMapX(780), ch * 0.72 - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Tavern (Warm Orange)
    ctx.fillStyle = '#ff6a00';
    ctx.beginPath();
    ctx.arc(toMapX(1840), ch * 0.72 - 2, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Cathedral / Guild (Arcane Violet)
    ctx.fillStyle = '#b388ff';
    ctx.fillRect(toMapX(2160) - 3.5, ch * 0.72 - 7, 7, 9);

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

  handleResize(gameSize) {
    const H = (gameSize.height && gameSize.height > 100) ? gameSize.height : (window.innerHeight || 720);
    this.cameras.main.setBounds(0, 0, this.worldWidth, H);
    this.renderOakhavenBackdrop(this.worldWidth, H);
    this.layoutOakhaven(this.worldWidth, H);
  }

  teardown() {
    this.scale.off('resize', this.resizeCb);
    document.getElementById('camp-hud')?.remove();
    document.getElementById('minimap-container')?.remove();
    document.getElementById('hamlet-prompt')?.remove();
    document.getElementById('oakhaven-modal')?.remove();
    document.getElementById('travel-screen')?.remove();
    if (this.backdropGfx) {
      this.backdropGfx.destroy();
      this.backdropGfx = null;
    }
  }
}
