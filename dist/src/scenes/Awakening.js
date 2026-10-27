// ═══════════════════════════════════════════════════════════════════════════
//  SCENE: THE AWAKENING  (Lore Introduction & Name Etching)
// ═══════════════════════════════════════════════════════════════════════════

import {
  $,
  lore,
  getPlayer,
  getUser,
  isDemo,
  setScene
} from '../services/gameState.js';

import {
  updatePlayerName,
  errorText
} from '../services/firebase.js';

import { getAwakeningTemplates } from '../ui/GateUI.js';

export default class Scene_Awakening extends Phaser.Scene {
  constructor() {
    super('Scene_Awakening');
  }

  ensureAshTextures() {
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
  }

  create() {
    // Ensure Mini-Map and HUD are completely hidden on Awakening screen
    document.getElementById('minimap-container')?.remove();
    document.getElementById('camp-hud')?.remove();

    const player = getPlayer();
    // Saved data is loaded before game startup. Never build UI for a named soul.
    if (typeof player?.name === 'string' && player.name.trim().length > 0) {
      this.isTransitioning = true;
      $('dialogue')?.remove();
      $('name-form')?.remove();
      this.scene.start('Scene_Camp');
      return;
    }

    // Procedural Ash Texture Generation (Immune to 404 & network errors)
    this.ensureAshTextures();

    console.log('[Scene_Awakening] create — lore sequence begins');
    setScene(this);
    this.line = 0;
    this.typing = false;
    this.finished = false;
    this.saving = false;
    this.isTransitioning = false;

    const templates = getAwakeningTemplates();
    for (const template of templates) {
      if (!$(template.id)) $('game-shell').append(template.cloneNode(true));
    }
    $('game-shell').inert = false;

    const awakeningTop = document.querySelector('.game-top');
    if (awakeningTop) {
      awakeningTop.hidden = false;
      awakeningTop.style.opacity = '1';
    }

    this.dialogueBox = { destroy: () => $('dialogue')?.remove() };
    this.dialogueText = { destroy: () => $('lore')?.remove() };
    this.nameInput = { destroy: () => $('soul-name')?.remove() };
    this.nameForm = { destroy: () => $('name-form')?.remove() };

    $('lore').hidden = false;
    $('arrival').hidden = true;
    $('arrival').style.opacity = '0';
    $('dialogue').hidden = false;
    $('name-form').hidden = true;
    $('name-error').textContent = '';
    $('soul-name').value = player.name || '';

    // ── Responsive Cinematic Ash: Dynamic density & extreme chaotic physics ──
    const camW = this.cameras.main.width;
    const camH = this.cameras.main.height;
    this.ashZone = new Phaser.Geom.Rectangle(0, -20, camW, camH + 40);
    const ashQuantity = Math.max(7, Math.floor(camW / 21));

    this.ash = this.add.particles(0, 0, 'ash_particle', {
      emitZone: { type: 'random', source: this.ashZone },
      quantity: ashQuantity,
      lifespan: { min: 3375, max: 7594 },
      speed: { min: 20, max: 110 },
      speedY: { min: 14, max: 80 },
      speedX: { min: -40, max: 40 },
      gravityY: { min: 5, max: 30 },
      gravityX: { min: -15, max: 15 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0.05 },
      alpha: { start: 0.5, end: 0 },
      tint: [0xffaa33, 0xff7700, 0xff4500, 0xcc3300, 0x3a180c],
      blendMode: 'ADD',
      frequency: 250
    });

    this.resize = size => {
      this.ashZone.setTo(0, -20, size.width, size.height + 40);
    };
    this.scale.on('resize', this.resize);

    this.advance = () => {
      if (this.isTransitioning || this.saving || !$('name-form').hidden || this.finished) return;
      if (this.typing) {
        this.timer.remove();
        this.typing = false;
        $('lore').textContent = this.current;
        this.afterLine();
      } else if (this.line < 3) {
        this.line++;
        this.write(lore[this.line]);
      } else if (this.line === 4) {
        this.endAwakening();
      }
    };
    $('next').onclick = this.advance;
    // Mobile touch support: tapping dialogue box or screen advances narrative
    $('dialogue').onclick = e => {
      if (['INPUT', 'BUTTON'].includes(e.target?.tagName) || !$('name-form').hidden) return;
      this.advance();
    };
    this.input.on('pointerdown', () => {
      if ($('name-form').hidden && !this.isTransitioning) {
        this.advance();
      }
    });

    this.keyboardHandler = e => {
      if (this.isTransitioning || ['INPUT', 'BUTTON'].includes(document.activeElement?.tagName)) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.advance();
      }
    };
    window.addEventListener('keydown', this.keyboardHandler);

    $('name-form').onsubmit = e => {
      e.preventDefault();
      if (!this.isTransitioning) this.saveName();
    };

    this.events.once('shutdown', () => {
      window.removeEventListener('keydown', this.keyboardHandler);
      this.scale.off('resize', this.resize);
      this.timer?.remove();
      this.input.removeAllListeners();
      if ($('next')) $('next').onclick = null;
      if ($('dialogue')) $('dialogue').onclick = null;
      if ($('name-form')) $('name-form').onsubmit = null;
    });

    this.write(lore[0]);
  }

  write(text) {
    if (this.isTransitioning) return;
    this.timer?.remove();
    this.current = text;
    this.typing = true;
    let i = 0;
    $('lore').textContent = '';
    $('next').hidden = false;
    $('next').textContent = 'Reveal ▾';
    this.timer = this.time.addEvent({
      delay: 30,
      repeat: text.length - 1,
      callback: () => {
        if (this.isTransitioning) return;
        $('lore').textContent = text.slice(0, ++i);
        if (i === text.length) {
          this.typing = false;
          this.afterLine();
        }
      }
    });
  }

  afterLine() {
    if (this.isTransitioning) return;
    if (this.line === 4) {
      this.endAwakening();
    } else if (this.line === 3) {
      $('next').hidden = true;
      $('name-form').hidden = false;
      $('soul-name').focus();
    } else {
      $('next').textContent = 'Continue ▾';
    }
  }

  async saveName() {
    if (this.isTransitioning || this.saving) return;
    const name = $('soul-name').value.trim().replace(/\s+/g, ' ');
    if (!name || name.length > 32 || /[\u0000-\u001f\u007f]/.test(name)) {
      $('name-error').textContent = 'Speak a name of one to thirty-two characters.';
      return;
    }
    this.saving = true;
    const button = $('name-form').querySelector('button');
    button.disabled = true;
    button.textContent = 'Etching…';
    $('name-error').textContent = '';

    const user = getUser();
    const player = getPlayer();
    try {
      if (!isDemo() && user) {
        await updatePlayerName(user.uid, name);
      }
      if (this.isTransitioning || !this.sys.isActive()) return;
      player.name = name;
      $('name-form').hidden = true;
      this.line = 4;
      this.write(`Ah, ${name}... A pitiful title. Welcome to the Ashen Hamlet. May thy sanity hold.`);
    } catch (e) {
      if (!this.isTransitioning && this.sys.isActive()) {
        $('name-error').textContent = errorText(e);
      }
    } finally {
      this.saving = false;
      if (!this.isTransitioning && this.sys.isActive()) {
        button.disabled = false;
        button.textContent = 'Etch thy name ⟶';
      }
    }
  }

  /* ── Transition: Awakening → Camp ──────────────────────────────── */
  endAwakening() {
    if (this.isTransitioning || this.finished) return;
    this.isTransitioning = true;
    this.finished = true;
    console.log('[Scene_Awakening] endAwakening — starting original noise shatter transition');

    this.time.removeAllEvents();
    if (this.timer) { this.time.removeEvent(this.timer); this.timer = null; }
    this.tweens.killAll();

    // Lock input immediately
    $('next').onclick = null;
    $('name-form').onsubmit = null;
    $('arrival').hidden = true;
    const gameTop = document.querySelector('.game-top');
    if (gameTop) gameTop.hidden = true;
    $('game-shell').inert = true;
    this.input.enabled = false;
    if (this.input.keyboard) {
      this.input.keyboard.enabled = false;
      this.input.keyboard.removeAllListeners();
    }
    this.input.removeAllListeners();
    window.removeEventListener('keydown', this.keyboardHandler);

    this.typing = false;
    this.current = '';

    // Guarantee procedural ash texture exists before initializing the transition emitter
    this.ensureAshTextures();

    const dialogue = $('dialogue');
    const emissionZone = new Phaser.Geom.Rectangle();
    const alignEmissionZone = () => {
      const box = dialogue.getBoundingClientRect();
      const canvas = this.game.canvas.getBoundingClientRect();
      const sx = this.scale.width / canvas.width;
      const sy = this.scale.height / canvas.height;
      emissionZone.setTo(
        (box.left - canvas.left) * sx,
        (box.top - canvas.top) * sy,
        box.width * sx,
        box.height * sy
      );
    };
    alignEmissionZone();

    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    const gameLayer = $('game');
    const previousLayerStyle = gameLayer.getAttribute('style');
    gameLayer.style.zIndex = '60';
    gameLayer.style.pointerEvents = 'none';
    this.events.once('shutdown', () => {
      if (previousLayerStyle === null) gameLayer.removeAttribute('style');
      else gameLayer.setAttribute('style', previousLayerStyle);
      $('game-shell')?.removeAttribute('data-cinematic');
    });

    // ── Restored Original Disintegration: Dynamic Canvas Noise Threshold Mask ──
    const mask = document.createElement('canvas');
    mask.width = Math.max(1, Math.ceil(emissionZone.width / 5));
    mask.height = Math.max(1, Math.ceil(emissionZone.height / 5));
    const maskContext = mask.getContext('2d');
    const maskPixels = maskContext.createImageData(mask.width, mask.height);
    const thresholds = Float32Array.from({ length: mask.width * mask.height }, () => Math.random());

    let prevProgress = 0;
    const dissolveSurface = currProgress => {
      const dissolving = [];
      const endProgress = Math.min(1, currProgress);
      for (let i = 0; i < thresholds.length; i++) {
        const th = thresholds[i];
        const offset = i * 4;
        maskPixels.data[offset] = maskPixels.data[offset + 1] = maskPixels.data[offset + 2] = 255;
        maskPixels.data[offset + 3] = th >= endProgress ? 255 : 0;
        if (th >= prevProgress && th < endProgress) {
          dissolving.push(i);
        }
      }
      maskContext.putImageData(maskPixels, 0, 0);
      const image = `url("${mask.toDataURL()}")`;
      dialogue.style.maskImage = image;
      dialogue.style.webkitMaskImage = image;

      // ── Progressive Ash Spawning: Emit ONLY from pixels dissolving in this exact frame ──
      // Total particle count reduced by an additional 25% (0.2325 * total dissolving pixels)
      if (dissolving.length > 0 && this.scatter) {
        const emitCount = Math.min(dissolving.length, Math.max(1, Math.round(dissolving.length * 0.2325)));
        const step = dissolving.length / emitCount;
        const cellW = emissionZone.width / mask.width;
        const cellH = emissionZone.height / mask.height;
        for (let k = 0; k < emitCount; k++) {
          const idx = dissolving[Math.floor(k * step)];
          const col = idx % mask.width;
          const row = Math.floor(idx / mask.width);
          const px = emissionZone.x + (col + Math.random()) * cellW;
          const py = emissionZone.y + (row + Math.random()) * cellH;
          this.scatter.emitParticleAt(px, py, 1);
        }
      }
      prevProgress = endProgress;
    };
    dialogue.style.maskSize = dialogue.style.webkitMaskSize = '100% 100%';
    dissolveSurface(0);

    const initialScales = new WeakMap();

    // ── Progressive Ash Disintegration Emitter (Fiery ember palette, high upward drift) ──
    this.scatter = this.add.particles(0, 0, 'ash_particle', {
      emitting: false,
      lifespan: { min: 886, max: 1709 },
      speed: { min: 180, max: 460 },
      angle: { min: 235, max: 305 },
      scale: {
        onEmit: particle => {
          const scale = Phaser.Math.FloatBetween(0.12, 0.85);
          initialScales.set(particle, scale);
          return scale;
        },
        onUpdate: (particle, key, t) => initialScales.get(particle) * (1 - t)
      },
      alpha: { start: 1, end: 0 },
      tint: [0xffaa33, 0xff7700, 0xff4500, 0xcc3300, 0x3a180c],
      gravityY: -100,
      accelerationY: { min: -500, max: -280 },
      accelerationX: { min: -75, max: 75 },
      blendMode: 'ADD'
    }).setDepth(20);

    dialogue.style.transition = 'none';
    dialogue.style.opacity = '1';
    const dissolve = { opacity: 1 };
    let uiFinished = false;
    let particlesFinished = false;
    let routed = false;

    const destroyDialogue = () => {
      this.dialogueText?.destroy?.();
      this.dialogueBox?.destroy?.();
      this.nameInput?.destroy?.();
      this.nameForm?.destroy?.();
    };

    const finishExit = () => {
      if (routed || !uiFinished || !particlesFinished || !this.sys.isActive()) return;
      routed = true;
      $('game-shell')?.removeAttribute('data-cinematic');
      destroyDialogue();
      this.children.removeAll(true);
      this.scatter = null;
      $('chapter-title').textContent = 'II · THE ASHEN HAMLET';
      this.scene.start('Scene_Camp');
    };

    // Safety timeout ensuring scene transition never hangs on throttled mobile devices
    this.time.delayedCall(7500, () => {
      uiFinished = true;
      particlesFinished = true;
      finishExit();
    });

    // Disintegration duration increased by 50%: 2931ms * 1.5 = 4397ms
    this.tweens.add({
      targets: dissolve,
      opacity: 0,
      duration: 4397,
      ease: 'Sine.easeInOut',
      onStart: () => {
        $('game-shell').dataset.cinematic = 'ash-scatter';
      },
      onUpdate: () => {
        alignEmissionZone();
        dialogue.style.opacity = String(dissolve.opacity);
        dissolveSurface(1 - dissolve.opacity);
      },
      onComplete: () => {
        dialogue.style.opacity = '0';
        uiFinished = true;
        // Allow the rising ember-ash cloud to drift high into the sky before switching scenes
        this.time.delayedCall(506, () => {
          particlesFinished = true;
          finishExit();
        });
      }
    });
  }
}
