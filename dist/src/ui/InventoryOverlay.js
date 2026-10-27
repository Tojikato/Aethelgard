// ═══════════════════════════════════════════════════════════════════════════
//  VAULT OF ECHOES — Inventory Overlay UI & Catalog
// ═══════════════════════════════════════════════════════════════════════════

import { isDemo, getUser } from '../services/gameState.js';
import { firebase } from '../services/firebase.js';
import { ITEM_DATABASE, getItem } from '../config/items.js';

export const ITEM_CATALOG = ITEM_DATABASE;

export class InventoryOverlay {
  constructor() {
    this.el = null;
    this.visible = false;
    this.items = [];           // live inventory items
    this.unsubscribe = null;   // Firestore onSnapshot listener

    // In demo mode, restore from localStorage if present
    if (isDemo()) {
      try {
        const saved = localStorage.getItem('aethelgard_inventory');
        if (saved) {
          this.items = JSON.parse(saved);
        }
      } catch (_) {}
    }
    console.log('[InventoryOverlay] constructed, loaded items:', this.items.length);
  }

  /* Build the overlay DOM once and inject into the page. */
  build() {
    if (this.el) return;
    const overlay = document.createElement('div');
    overlay.id = 'inventory-overlay';
    overlay.className = 'inv-overlay inv-hidden';
    overlay.innerHTML = `
      <div class="inv-frame">
        <div class="inv-header">
          <span class="inv-title">✧ VAULT OF ECHOES ✧</span>
          <button class="inv-close quiet" aria-label="Close inventory">✕</button>
        </div>
        <div class="inv-body" id="inv-items">
          <p class="inv-empty">The vault is barren. Thy journey has yet to yield spoils.<br><span style="font-family:'Crimson Text',serif;font-size:15px;color:#9d8a68;margin-top:10px;display:block;">Speak with the Ashen Watcher [F] near the Eastern Arch to claim thy starter blade.</span></p>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    this.el = overlay;
    overlay.querySelector('.inv-close').onclick = () => this.hide();
    console.log('[InventoryOverlay] DOM built and appended');
  }

  /* Subscribe to Firestore inventory sub-collection in real time. */
  subscribe(uid) {
    if (isDemo() || !firebase) {
      console.log('[InventoryOverlay] demo mode — skipping Firestore subscription');
      return;
    }
    const colRef = firebase.collection(firebase.db, 'users', uid, 'inventory');
    this.unsubscribe = firebase.onSnapshot(colRef, snap => {
      this.items = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
      console.log(`[InventoryOverlay] snapshot received — ${this.items.length} item(s)`, this.items);
      this.render();
    }, err => {
      console.error('[InventoryOverlay] onSnapshot error', err);
    });
    console.log(`[InventoryOverlay] subscribed to /users/${uid}/inventory`);
  }

  /* Helper to check if player possesses an item */
  hasItem(itemId) {
    return this.items.some(i => i.itemId === itemId && (i.quantity ?? 1) > 0);
  }

  /* Helper to get all current inventory items */
  getItems() {
    return this.items;
  }

  /* Add an item to the player's inventory and persist */
  async addItem(itemId, quantity = 1) {
    let existing = this.items.find(i => i.itemId === itemId);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + quantity;
    } else {
      this.items.push({ itemId, quantity });
    }

    if (isDemo()) {
      try {
        localStorage.setItem('aethelgard_inventory', JSON.stringify(this.items));
      } catch (_) {}
    } else {
      const user = getUser();
      if (user && firebase && firebase.db) {
        try {
          const colRef = firebase.collection(firebase.db, 'users', user.uid, 'inventory');
          const docRef = firebase.doc(colRef, itemId);
          await firebase.setDoc(docRef, { itemId, quantity: (existing ? existing.quantity : quantity) }, { merge: true });
        } catch (e) {
          console.error('[InventoryOverlay] failed to persist item to Firestore:', e);
        }
      }
    }
    this.render();
    console.log(`[InventoryOverlay] added ${quantity}x ${itemId}, total unique items: ${this.items.length}`);
  }

  /* Render current items into the overlay panel. */
  render() {
    const container = document.getElementById('inv-items');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = `<p class="inv-empty">The vault is barren. Thy journey has yet to yield spoils.<br><span style="font-family:'Crimson Text',serif;font-size:15px;color:#9d8a68;margin-top:10px;display:block;">Speak with the Ashen Watcher [F] near the Eastern Arch to claim thy starter blade.</span></p>`;
      return;
    }

    container.innerHTML = this.items.map(item => {
      const meta = getItem(item.itemId);
      const iconHtml = meta.image
        ? `<div class="inv-sprite-frame"><img src="${meta.image}" class="inv-sprite-img" alt="${meta.name}"></div>`
        : `<span class="inv-icon">${meta.icon || '❓'}</span>`;
      
      const statsHtml = meta.stats
        ? Object.entries(meta.stats).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(' · ')
        : (meta.effect ? `${meta.effect.stat.toUpperCase()}: +${meta.effect.value}` : '');

      return `<div class="inv-card rarity-${meta.rarity || 'common'}">
        ${iconHtml}
        <div class="inv-info">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="inv-name">${meta.name || item.itemId}</span>
            <span class="inv-rarity-badge ${meta.rarity || 'common'}">${(meta.rarity || 'common').toUpperCase()}</span>
          </div>
          <span class="inv-desc">${meta.description || ''}</span>
          ${statsHtml ? `<span class="inv-stats" style="font-family:'Cinzel',serif;font-size:11px;color:#9d8a68;margin-top:2px;display:block;">${statsHtml}</span>` : ''}
        </div>
        <span class="inv-qty">×${item.quantity ?? 1}</span>
      </div>`;
    }).join('');
    console.log('[InventoryOverlay] rendered', this.items.length, 'items');
  }

  show()   { this.build(); this.render(); this.el.classList.remove('inv-hidden'); this.visible = true; document.getElementById('minimap-container')?.classList.add('hidden'); console.log('[InventoryOverlay] shown'); }
  hide()   { if (this.el) this.el.classList.add('inv-hidden');     this.visible = false; document.getElementById('minimap-container')?.classList.remove('hidden'); console.log('[InventoryOverlay] hidden'); }
  toggle() { this.visible ? this.hide() : this.show(); }

  destroy() {
    if (this.unsubscribe) { this.unsubscribe(); this.unsubscribe = null; }
    if (this.el) { this.el.remove(); this.el = null; }
    this.items = [];
    this.visible = false;
    console.log('[InventoryOverlay] destroyed');
  }
}

let activeInventoryOverlay = null;

export function getInventoryOverlay() {
  return activeInventoryOverlay;
}

export function setInventoryOverlay(instance) {
  activeInventoryOverlay = instance;
}

export function destroyActiveInventoryOverlay() {
  if (activeInventoryOverlay) {
    activeInventoryOverlay.destroy();
    activeInventoryOverlay = null;
  }
}
