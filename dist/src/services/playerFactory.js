// ═══════════════════════════════════════════════════════════════════════════
//  PLAYER & ACTOR PROCEDURAL TEXTURE FACTORY
//  Generates pixel-art Adventurer & NPC textures in memory before spawning
// ═══════════════════════════════════════════════════════════════════════════

export function ensureProceduralActorTextures(scene) {
  if (!scene || !scene.textures) return;

  // 1. Procedural Ash Particles & Flame Dots
  if (!scene.textures.exists('ash_particle')) {
    const gfx = scene.make.graphics({ x: 0, y: 0, add: false });
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
  if (!scene.textures.exists('ash')) {
    const dot = scene.make.graphics({ x: 0, y: 0, add: false });
    dot.fillStyle(0xffffff, 1.0).fillRect(0, 0, 4, 4);
    dot.generateTexture('ash', 4, 4);
    dot.destroy();
  }

  // 2. Side-View Adventurer Player Frames (Idle & Walk)
  if (!scene.textures.exists('player_idle_0')) {
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
      scene.textures.addCanvas(`player_idle_${i}`, c);
    }
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      drawAdventurer(c.getContext('2d'), i, true);
      scene.textures.addCanvas(`player_walk_${i}`, c);
    }

    if (!scene.anims.exists('player-idle')) {
      scene.anims.create({
        key: 'player-idle',
        frames: [
          { key: 'player_idle_0' },
          { key: 'player_idle_1' }
        ],
        frameRate: 2.5,
        repeat: -1
      });
    }

    if (!scene.anims.exists('player-walk')) {
      scene.anims.create({
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
  }

  // 3. "THE ASHEN WATCHER / NPC" Sprite Frames
  if (!scene.textures.exists('watcher_idle_0')) {
    const W = 22;
    const H = 34;
    const drawWatcher = (ctx, animPhase) => {
      ctx.clearRect(0, 0, W, H);
      const bob = animPhase === 1 ? -1 : 0;

      const C_CLOAK_DARK = '#141217';
      const C_CLOAK_MID = '#221f28';
      const C_CLOAK_LIGHT = '#373240';
      const C_LEATHER = '#3a2a1d';
      const C_ASH_HEM = '#484352';
      const C_TEAL = '#7fe0d4';
      const C_WOOD = '#523720';
      const C_WOOD_LIGHT = '#785333';

      // Stave
      ctx.fillStyle = C_WOOD;
      ctx.fillRect(18, 4 + bob, 2, 28);
      ctx.fillStyle = C_WOOD_LIGHT;
      ctx.fillRect(18, 4 + bob, 1, 28);
      ctx.fillStyle = C_TEAL;
      ctx.fillRect(17, 3 + bob, 4, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(18, 4 + bob, 2, 1);

      // Cloak
      ctx.fillStyle = C_CLOAK_DARK;
      ctx.fillRect(4, 12 + bob, 13, 19);
      ctx.fillStyle = C_CLOAK_MID;
      ctx.fillRect(5, 10 + bob, 11, 19);
      ctx.fillStyle = C_ASH_HEM;
      ctx.fillRect(4, 28 + bob, 13, 3);
      ctx.clearRect(6, 30 + bob, 2, 2);
      ctx.clearRect(12, 30 + bob, 2, 2);

      // Belt
      ctx.fillStyle = C_LEATHER;
      ctx.fillRect(5, 20 + bob, 11, 3);
      ctx.fillRect(6, 23 + bob, 4, 4);

      // Cowl / Hood
      ctx.fillStyle = C_CLOAK_LIGHT;
      ctx.fillRect(5, 2 + bob, 11, 10);
      ctx.fillStyle = '#0f0d14';
      ctx.fillRect(7, 4 + bob, 8, 6);
      ctx.fillStyle = '#ffaa33';
      ctx.fillRect(8, 6 + bob, 2, 2);
      ctx.fillRect(12, 6 + bob, 2, 2);
    };

    for (let i = 0; i < 2; i++) {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      drawWatcher(c.getContext('2d'), i);
      scene.textures.addCanvas(`watcher_idle_${i}`, c);
    }

    if (!scene.anims.exists('watcher-idle')) {
      scene.anims.create({
        key: 'watcher-idle',
        frames: [
          { key: 'watcher_idle_0' },
          { key: 'watcher_idle_1' }
        ],
        frameRate: 2,
        repeat: -1
      });
    }
  }
}

export function ensurePlayerTexture(scene) {
  ensureProceduralActorTextures(scene);
}

export function createPlayer(scene, spawnX, spawnY) {
  ensureProceduralActorTextures(scene);

  const H = (scene.scale.height && scene.scale.height > 100)
    ? scene.scale.height
    : (window.innerHeight > 100 ? window.innerHeight : 720);

  const safeX = (spawnX !== undefined && spawnX !== null && spawnX > 0) ? spawnX : 220;
  const safeY = (spawnY !== undefined && spawnY !== null && spawnY > 100) ? spawnY : H * 0.76;

  const player = scene.add.sprite(safeX, safeY, 'player_idle_0')
    .setOrigin(0.5, 31 / 32)
    .setScale(2.4);

  if (scene.anims.exists('player-idle')) {
    player.play('player-idle');
  }

  player.sortY = player.y;
  return player;
}
