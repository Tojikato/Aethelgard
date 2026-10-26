// ═══════════════════════════════════════════════════════════════════════════
//  WORLD MAP OVERLAY — The 9 Continental Realms of Aethelgard [M]
// ═══════════════════════════════════════════════════════════════════════════

import { getPlayer } from '../services/gameState.js';

export const CONTINENTAL_NODES = [
  {
    id: 'ashen-hamlet',
    name: 'The Ashen Hamlet',
    sceneKey: 'Scene_Camp',
    requiredRenown: 0,
    x: 100,
    y: 280,
    region: 'Borderlands',
    description: 'The final stone sanctuary before the Abyssal Gate. A desolate outpost sheltered by ancient runestones and a crackling hearth.',
    icon: '🔥',
    features: ['Hearth of Focus', 'Vault of Echoes', 'The Ashen Watcher']
  },
  {
    id: 'oakhaven-outpost',
    name: 'Oakhaven Outpost',
    sceneKey: 'Scene_Oakhaven',
    requiredRenown: 0,
    x: 230,
    y: 240,
    region: 'Frontier Marches',
    description: 'The fortified frontier settlement of the Empire. Home to the Adventurers’ Guild, Archmage Malakor, the Ashen Flagon Tavern, and merchant bazaars.',
    icon: '🏰',
    features: ['Adventurers’ Guild', 'Archmage Malakor', 'The Ashen Flagon Tavern', 'Merchant Stall', 'Bounty Board']
  },
  {
    id: 'bastion-of-iron',
    name: 'Bastion of Iron',
    sceneKey: null,
    requiredRenown: 100,
    x: 370,
    y: 290,
    region: 'Iron Mountains',
    description: 'An impenetrable citadel carved into the granite peaks of Mount Grimrock, garrisoned by the Holy Order of the Vigil.',
    icon: '🛡️',
    features: ['Vanguard Armory', 'Cathedral of Stone', 'Grand Foundry']
  },
  {
    id: 'port-azure',
    name: 'Port Azure',
    sceneKey: null,
    requiredRenown: 250,
    x: 300,
    y: 120,
    region: 'Sunken Tides',
    description: 'A mist-veiled harbor city where tides whisper secrets from drowned civilizations. Harbor for trade schooners and corsairs.',
    icon: '⚓',
    features: ['Lighthouse of Eons', 'Deepwater Docks', 'Smuggler’s Cove']
  },
  {
    id: 'obsidian-spire',
    name: 'The Obsidian Spire',
    sceneKey: null,
    requiredRenown: 500,
    x: 510,
    y: 160,
    region: 'Arcane Highlands',
    description: 'A colossal monolith of volcanic glass pulsing with leylines. High seat of imperial sorcery and celestial astromancy.',
    icon: '🔮',
    features: ['Leyline Core', 'Celestial Astrolabe', 'Arcane Athenaeum']
  },
  {
    id: 'abyssal-nexus',
    name: 'Abyssal Nexus',
    sceneKey: null,
    requiredRenown: 800,
    x: 500,
    y: 330,
    region: 'Wounded Earth',
    description: 'The catastrophic breach where the mortal plane tore open during the Great sundering. Pure void-essence leaks into the world.',
    icon: '🌀',
    features: ['Void Rift Crater', 'Chaos Monoliths', 'Corrupted Vanguard Remains']
  },
  {
    id: 'shadowfen-mire',
    name: 'Shadowfen Mire',
    sceneKey: null,
    requiredRenown: 1200,
    x: 650,
    y: 280,
    region: 'Sunless Marshes',
    description: 'A decaying, toxic wetland drowned in eternal dusk. Spectral lantern-flies guide foolish wanderers into peat bogs.',
    icon: '🌿',
    features: ['Witch’s Willow', 'Sunken Crypts', 'Black Lotus Groves']
  },
  {
    id: 'astral-sanctuary',
    name: 'Astral Sanctuary',
    sceneKey: null,
    requiredRenown: 1800,
    x: 670,
    y: 110,
    region: 'Celestial Plateau',
    description: 'Floating marble ruins suspended among the clouds, untouched by the ash below. Where stellar deities once walked.',
    icon: '✨',
    features: ['Starfall Altar', 'Aetheric Bridges', 'Empyrean Pillars']
  },
  {
    id: 'imperial-capital',
    name: 'Valoria: The Imperial Capital',
    sceneKey: null,
    requiredRenown: 2500,
    x: 800,
    y: 200,
    region: 'The Golden Basin',
    description: 'The grand crown of civilization. Golden domes, soaring aqueducts, and the Sun-Throne of the Sovereign Emperor.',
    icon: '👑',
    features: ['Imperial Throne Room', 'Grand Colosseum', 'High Sanctum of Light']
  }
];

// Highways connecting the continental nodes
export const ROAD_CONNECTIONS = [
  ['ashen-hamlet', 'oakhaven-outpost'],
  ['oakhaven-outpost', 'port-azure'],
  ['oakhaven-outpost', 'bastion-of-iron'],
  ['port-azure', 'obsidian-spire'],
  ['bastion-of-iron', 'abyssal-nexus'],
  ['obsidian-spire', 'astral-sanctuary'],
  ['obsidian-spire', 'shadowfen-mire'],
  ['abyssal-nexus', 'shadowfen-mire'],
  ['astral-sanctuary', 'imperial-capital'],
  ['shadowfen-mire', 'imperial-capital']
];

if (typeof window !== 'undefined') {
  window.CONTINENTAL_NODES = CONTINENTAL_NODES;
}

export class WorldMapOverlay {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.isOpenState = false;
    this.currentLocation = 'ashen-hamlet';
    this.selectedNodeId = 'oakhaven-outpost';
    this.onTravelCallback = null;
    this.hoverNode = null;
    this.boundKeyDown = this.handleKeyDown.bind(this);
  }

  buildDOM() {
    if (this.container) return;

    const overlay = document.createElement('div');
    overlay.id = 'worldmap-modal';
    overlay.className = 'worldmap-overlay hidden';
    overlay.innerHTML = `
      <div class="worldmap-frame">
        <div class="worldmap-header">
          <div class="worldmap-title-wrap">
            <h2>✧ CONTINENTAL ATLAS OF AETHELGARD ✧</h2>
            <p>Charted by the Imperial Cartographers · Press [M] or [ESC] to close</p>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <div id="worldmap-renown" class="worldmap-renown-badge">RENOWN: 0</div>
            <button id="worldmap-close-btn" class="hearth-modal-close" type="button" aria-label="Close Map">✕</button>
          </div>
        </div>

        <div class="worldmap-canvas-container">
          <canvas id="worldmap-canvas" width="840" height="420"></canvas>
        </div>

        <div class="worldmap-details-panel">
          <div class="worldmap-node-info">
            <h3 id="worldmap-detail-title">Oakhaven Outpost</h3>
            <p id="worldmap-detail-desc">Frontier bastion and guild stronghold.</p>
          </div>
          <button id="worldmap-travel-action" class="worldmap-travel-btn" type="button">
            ✦ Fast Travel ⟶
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.container = overlay;

    this.canvas = overlay.querySelector('#worldmap-canvas');
    this.ctx = this.canvas.getContext('2d');

    overlay.querySelector('#worldmap-close-btn').onclick = () => this.close();
    overlay.querySelector('#worldmap-travel-action').onclick = () => this.handleTravelClick();

    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
  }

  open(currentLocation = 'ashen-hamlet', onTravel = null) {
    this.buildDOM();
    this.currentLocation = currentLocation;
    this.selectedNodeId = currentLocation === 'ashen-hamlet' ? 'oakhaven-outpost' : 'ashen-hamlet';
    this.onTravelCallback = onTravel;
    this.isOpenState = true;

    // Update Renown display
    const player = getPlayer();
    const renownEl = document.getElementById('worldmap-renown');
    if (renownEl) {
      renownEl.textContent = `RENOWN: ${player.renown || 0}`;
    }

    this.container.classList.remove('hidden');
    window.addEventListener('keydown', this.boundKeyDown);

    this.updateDetailPanel();
    this.render();
  }

  close() {
    if (!this.isOpenState) return;
    this.isOpenState = false;
    if (this.container) {
      this.container.classList.add('hidden');
    }
    window.removeEventListener('keydown', this.boundKeyDown);
  }

  isOpen() {
    return this.isOpenState;
  }

  handleKeyDown(e) {
    if (e.key === 'm' || e.key === 'M' || e.key === 'Escape') {
      this.close();
    }
  }

  updateDetailPanel() {
    const node = CONTINENTAL_NODES.find(n => n.id === this.selectedNodeId);
    if (!node) return;

    const player = getPlayer();
    const playerRenown = player.renown || 0;
    const isUnlocked = playerRenown >= node.requiredRenown;
    const isCurrent = node.id === this.currentLocation;

    const titleEl = document.getElementById('worldmap-detail-title');
    const descEl = document.getElementById('worldmap-detail-desc');
    const btn = document.getElementById('worldmap-travel-action');

    if (titleEl) {
      titleEl.innerHTML = `${node.icon} ${node.name} <span style="font-size:12px;color:#a49175;font-weight:normal;">[${node.region}]</span>`;
    }
    if (descEl) {
      let reqStr = '';
      if (!isUnlocked) {
        reqStr = `<br><span style="color:#d44a28;font-weight:bold;">Requires ${node.requiredRenown} Renown (Current: ${playerRenown}). Road locked by Imperial Decrees.</span>`;
      }
      descEl.innerHTML = `${node.description}${reqStr}`;
    }

    if (btn) {
      if (isCurrent) {
        btn.textContent = '✦ Thou Art Here';
        btn.disabled = true;
      } else if (!isUnlocked) {
        btn.textContent = `✦ Locked (${node.requiredRenown} Renown)`;
        btn.disabled = true;
      } else if (!node.sceneKey) {
        btn.textContent = '✦ Road In Dev';
        btn.disabled = true;
      } else {
        btn.textContent = `✦ Fast Travel to ${node.name} ⟶`;
        btn.disabled = false;
      }
    }
  }

  handleTravelClick() {
    const node = CONTINENTAL_NODES.find(n => n.id === this.selectedNodeId);
    if (!node || node.id === this.currentLocation || !node.sceneKey) return;

    this.close();
    if (this.onTravelCallback) {
      this.onTravelCallback(node);
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let found = null;
    for (const node of CONTINENTAL_NODES) {
      if (Math.hypot(mx - node.x, my - node.y) <= 22) {
        found = node;
        break;
      }
    }

    if (this.hoverNode !== found) {
      this.hoverNode = found;
      this.canvas.style.cursor = found ? 'pointer' : 'default';
      this.render();
    }
  }

  handleCanvasClick(e) {
    if (this.hoverNode) {
      this.selectedNodeId = this.hoverNode.id;
      this.updateDetailPanel();
      this.render();

      const player = getPlayer();
      const isUnlocked = (player.renown || 0) >= this.hoverNode.requiredRenown;
      const isDestination = this.hoverNode.id !== this.currentLocation && this.hoverNode.sceneKey;

      if (isUnlocked && isDestination) {
        this.handleTravelClick();
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // 1. Ancient Parchment / Leather Map Background
    ctx.fillStyle = '#0f0c16';
    ctx.fillRect(0, 0, W, H);

    // Subtle dark fantasy map parchment gradient
    const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.6);
    bgGrad.addColorStop(0, '#1c1726');
    bgGrad.addColorStop(0.7, '#110e18');
    bgGrad.addColorStop(1, '#08060d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle geographic elevation contours & parchment grid
    ctx.strokeStyle = 'rgba(125, 99, 58, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 40; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 40; y < H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // 2. Draw Connecting Roadways
    const nodeMap = new Map(CONTINENTAL_NODES.map(n => [n.id, n]));
    for (const [idA, idB] of ROAD_CONNECTIONS) {
      const a = nodeMap.get(idA);
      const b = nodeMap.get(idB);
      if (!a || !b) continue;

      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2.5;

      // Color route gold if both unlocked, dark slate if locked
      const player = getPlayer();
      const r = player.renown || 0;
      const routeUnlocked = r >= a.requiredRenown && r >= b.requiredRenown;

      ctx.strokeStyle = routeUnlocked ? 'rgba(201, 164, 92, 0.65)' : 'rgba(80, 70, 90, 0.35)';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Nodes
    const player = getPlayer();
    const playerRenown = player.renown || 0;

    for (const node of CONTINENTAL_NODES) {
      const isUnlocked = playerRenown >= node.requiredRenown;
      const isCurrent = node.id === this.currentLocation;
      const isSelected = node.id === this.selectedNodeId;
      const isHover = this.hoverNode === node;

      // Outer Selection Ring
      if (isSelected || isHover) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(229, 184, 105, 0.25)' : 'rgba(255, 255, 255, 0.12)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffd700' : '#c9a45c';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Current Location Pulsing Aura
      if (isCurrent) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 26, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 106, 0, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Base Node Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? '#4a1e0d' : isUnlocked ? '#261f33' : '#14121a';
      ctx.fill();
      ctx.strokeStyle = isCurrent ? '#ff6a00' : isUnlocked ? '#c9a45c' : '#4f4659';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node Icon / Indicator
      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (!isUnlocked) {
        ctx.fillStyle = '#6e657a';
        ctx.fillText('🔒', node.x, node.y);
      } else if (isCurrent) {
        ctx.fillStyle = '#ffd700';
        ctx.fillText('★', node.x, node.y);
      } else {
        ctx.fillStyle = '#f0e6d2';
        ctx.fillText('●', node.x, node.y);
      }

      // Node Label
      ctx.font = isSelected ? 'bold 11px Cinzel, serif' : '10px Cinzel, serif';
      ctx.fillStyle = isCurrent ? '#ffaa44' : isUnlocked ? '#f3e5c8' : '#6e657a';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y + 24);
    }
  }
}

export const worldMapOverlay = new WorldMapOverlay();
if (typeof window !== 'undefined') {
  window.worldMapOverlay = worldMapOverlay;
}
export default worldMapOverlay;
