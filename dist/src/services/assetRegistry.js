// ═══════════════════════════════════════════════════════════════════════════
//  ASSET REGISTRY — Aethelgard Dark Fantasy Asset Pack Catalog & Loader
// ═══════════════════════════════════════════════════════════════════════════

import { ASSET_MAP, resolveAssetPath } from '../config/AssetRegistry.js';

class AssetRegistry {
  constructor() {
    this.basePath = './assets/';
    this.manifest = null;
    this.byId = new Map();
    this.byCategory = new Map();
    this.initialized = false;
  }

  /* Set base path if running under subpath or custom base URL */
  setBasePath(basePath) {
    this.basePath = basePath.endsWith('/') ? basePath : basePath + '/';
  }

  /* Initialize registry from Phaser JSON cache or fetch */
  async init(phaserScene = null) {
    if (this.initialized) return this;

    if (phaserScene && phaserScene.cache && phaserScene.cache.json.exists('aethelgard-manifest')) {
      this.manifest = phaserScene.cache.json.get('aethelgard-manifest');
    } else if (phaserScene && phaserScene.cache && phaserScene.cache.json.exists('manifest')) {
      this.manifest = phaserScene.cache.json.get('manifest');
    } else {
      try {
        const base = new URL(this.basePath, document.baseURI);
        const manifestUrl = new URL('manifest.json', base).href;
        const res = await fetch(manifestUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        this.manifest = await res.json();
      } catch (e) {
        console.warn('[AssetRegistry] Failed to fetch manifest, using fallback:', e);
      }
    }

    if (this.manifest && Array.isArray(this.manifest.assets)) {
      this.manifest.assets.forEach(asset => {
        this.byId.set(asset.id, asset);
        if (asset.name) this.byId.set(asset.name, asset);
        const cat = asset.category || 'misc';
        if (!this.byCategory.has(cat)) {
          this.byCategory.set(cat, []);
        }
        this.byCategory.get(cat).push(asset);
      });
      this.initialized = true;
      console.log(`%c[AssetRegistry] Initialized with ${this.byId.size} assets across ${this.byCategory.size} categories`, 'color:#a88c5d;font-weight:bold');
    } else {
      // Fallback from static ASSET_MAP
      for (const [k, v] of Object.entries(ASSET_MAP)) {
        this.byId.set(k, { id: k, path: v });
      }
      this.initialized = true;
      console.log(`%c[AssetRegistry] Initialized from static ASSET_MAP with ${this.byId.size} keys`, 'color:#a88c5d;font-weight:bold');
    }

    if (typeof window !== 'undefined') {
      window.assetRegistry = this;
    }

    return this;
  }

  /* Get asset definition by ID or name */
  get(id) {
    return this.byId.get(id) || null;
  }

  /* Get relative URL for an asset */
  getUrl(id) {
    const asset = this.get(id);
    if (asset && asset.path) {
      if (asset.path.startsWith('./') || asset.path.startsWith('http')) return asset.path;
      return `${this.basePath}${asset.path}`;
    }
    return resolveAssetPath(id);
  }

  /* Get list of assets in a specific category */
  getByCategory(category) {
    return this.byCategory.get(category) || [];
  }

  /* Get all registered categories */
  getCategories() {
    return Array.from(this.byCategory.keys());
  }

  /* Preload an individual asset safely into a Phaser scene */
  preload(scene, id, key = null) {
    const textureKey = key || id;
    const asset = this.get(id);
    if (asset?.category === 'character-atlas') {
      if (!scene.cache.json.exists(textureKey)) scene.load.json(textureKey, this.getUrl(id));
      return;
    }
    if (!scene.textures.exists(textureKey)) {
      if (asset?.frameWidth && asset?.frameHeight) scene.load.spritesheet(textureKey, this.getUrl(id), { frameWidth: asset.frameWidth, frameHeight: asset.frameHeight });
      else scene.load.image(textureKey, this.getUrl(id));
    }
  }

  /* Preload assets in category using Phaser scene loader */
  preloadCategory(scene, category, idPrefix = '') {
    const assets = this.getByCategory(category);
    assets.forEach(asset => {
      const key = idPrefix ? `${idPrefix}${asset.id}` : asset.id;
      this.preload(scene, asset.id, key);
    });
    console.log(`[AssetRegistry] Queued preload for ${assets.length} assets in '${category}'`);
  }
}

export const assetRegistry = new AssetRegistry();
export default assetRegistry;
