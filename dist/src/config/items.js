// ═══════════════════════════════════════════════════════════════════════════
//  ITEM DATABASE — Weapons, Potions & Artifacts of Aethelgard
// ═══════════════════════════════════════════════════════════════════════════

import { resolveAssetPath } from './AssetRegistry.js';
export const ITEM_DATABASE = {
  'armor-wayfarer-tattered': {
    id: 'armor-wayfarer-tattered', name: 'Tattered Wayfarer Garb', category: 'armor', rarity: 'common',
    description: 'Ash-worn mantle, patched tunic and travel leathers offered by the Ashen Watcher. A familiar weave for an unfamiliar world.',
    outfit: 'ashen_wayfarer', image: resolveAssetPath('armor-wayfarer-tattered'), icon: '🧥'
  },
  // ── Weapons (from /assets/sprites/sword-*.png) ─────────────────────
  'sword-rusted': {
    id: 'sword-rusted',
    name: 'Rusty Iron Blade',
    category: 'weapon',
    rarity: 'common',
    description: 'A forgotten soldier’s sword, scarred by rust and ash. Still holds an edge.',
    stats: { attack: 5, durability: 40 },
    sprite: 'sword-rusted',
    image: './assets/sprites/sword-rusted.png',
    icon: '🗡️'
  },
  'sword-barbed': {
    id: 'sword-barbed',
    name: 'Barbed Ashen Saber',
    category: 'weapon',
    rarity: 'uncommon',
    description: 'Forged with jagged teeth designed to tear through abyssal flesh. Inflicts bleed.',
    stats: { attack: 9, bleed: 4 },
    sprite: 'sword-barbed',
    image: './assets/sprites/sword-barbed.png',
    icon: '⚔️'
  },
  'sword-cleaver': {
    id: 'sword-cleaver',
    name: 'Executioner’s Cleaver',
    category: 'weapon',
    rarity: 'rare',
    description: 'A heavy, brutal slab of blackened steel. Crushes armor with devastating force.',
    stats: { attack: 16, critChance: 0.12 },
    sprite: 'sword-cleaver',
    image: './assets/sprites/sword-cleaver.png',
    icon: '🪓'
  },
  'sword-curved': {
    id: 'sword-curved',
    name: 'Abyssal Scimitar',
    category: 'weapon',
    rarity: 'rare',
    description: 'Its curve whispers with phantom wind from the Void. Swift and deadly.',
    stats: { attack: 18, agility: 6 },
    sprite: 'sword-curved',
    image: './assets/sprites/sword-curved.png',
    icon: '🗡️'
  },
  'sword-long': {
    id: 'sword-long',
    name: 'Knight’s Vigil Greatsword',
    category: 'weapon',
    rarity: 'epic',
    description: 'Carried by the sacred paladins of the First Dawn. Imbued with steadfast resolve.',
    stats: { attack: 28, defense: 12 },
    sprite: 'sword-long',
    image: './assets/sprites/sword-long.png',
    icon: '⚔️'
  },
  'sword-glowing': {
    id: 'sword-glowing',
    name: 'Sunfire Relic Blade',
    category: 'weapon',
    rarity: 'legendary',
    description: 'Bathed in primordial solar fire. Cleaves dark sorcery and illuminates the abyss.',
    stats: { attack: 45, holyPower: 25 },
    sprite: 'sword-glowing',
    image: './assets/sprites/sword-glowing.png',
    icon: '✨'
  },

  // ── Potions (from /assets/sprites/potion-*.png) ────────────────────
  'potion-red': {
    id: 'potion-red',
    name: 'Crimson Vitality Draught',
    category: 'consumable',
    rarity: 'uncommon',
    description: 'Distilled from red star-berries and blessed spring water. Restores 35 Sanity.',
    effect: { stat: 'sanity', value: 35 },
    sprite: 'potion-red',
    image: './assets/sprites/potion-red.png',
    icon: '🧪'
  },
  'potion-teal': {
    id: 'potion-teal',
    name: 'Aetheric Focus Elixir',
    category: 'consumable',
    rarity: 'rare',
    description: 'Harnesses aetheric currents to sharpen consciousness. Doubles Gold earned while focusing.',
    effect: { stat: 'goldMultiplier', value: 2, durationMinutes: 30 },
    sprite: 'potion-teal',
    image: './assets/sprites/potion-teal.png',
    icon: '⚗️'
  },
  'potion-purple': {
    id: 'potion-purple',
    name: 'Void Transcendence Philter',
    category: 'consumable',
    rarity: 'epic',
    description: 'Liquid twilight harvested from the edge of reality. Grants 50 Renown immediately.',
    effect: { stat: 'renown', value: 50 },
    sprite: 'potion-purple',
    image: './assets/sprites/potion-purple.png',
    icon: '🔮'
  },

  // ── Key Items & Artifacts ─────────────────────────────────────────
  'scroll-a': {
    id: 'scroll-a',
    name: 'The Weathered Atlas of Aethelgard',
    category: 'key_item',
    rarity: 'rare',
    description: 'An ancient vellum cartograph charting the nine realms of Aethelgard. Unlocks the Continental World Map [M].',
    sprite: 'scroll-a',
    image: './assets/aethelgard/items/materials/scroll-a.png',
    icon: '📜'
  },
  'items-materials-scroll-a': {
    id: 'scroll-a',
    name: 'The Weathered Atlas of Aethelgard',
    category: 'key_item',
    rarity: 'rare',
    description: 'An ancient vellum cartograph charting the nine realms of Aethelgard. Unlocks the Continental World Map [M].',
    sprite: 'scroll-a',
    image: './assets/aethelgard/items/materials/scroll-a.png',
    icon: '📜'
  },

  // ── Aethelgard Asset Pack Weapons (from /assets/aethelgard/equipment/weapons/) ─
  'equipment-weapons-axe': {
    id: 'equipment-weapons-axe',
    name: 'Executioner’s War Axe',
    category: 'weapon',
    rarity: 'rare',
    description: 'A heavy, notched bearded axe used by the vanguards to cleave shields and bone.',
    stats: { attack: 22, cleave: 8 },
    image: './assets/aethelgard/equipment/weapons/axe.png',
    icon: '🪓'
  },
  'equipment-weapons-mace': {
    id: 'equipment-weapons-mace',
    name: 'Heavy Spiked Flanged Mace',
    category: 'weapon',
    rarity: 'uncommon',
    description: 'Forged from blackened iron with brutal flanges that crush plate armor.',
    stats: { attack: 14, stagger: 10 },
    image: './assets/aethelgard/equipment/weapons/mace.png',
    icon: '🔨'
  },
  'equipment-weapons-hammer': {
    id: 'equipment-weapons-hammer',
    name: 'Forge Master Warhammer',
    category: 'weapon',
    rarity: 'rare',
    description: 'An ancient smith’s warhammer bearing consecrated runes of thunder and iron.',
    stats: { attack: 24, armorPenetration: 15 },
    image: './assets/aethelgard/equipment/weapons/hammer.png',
    icon: '🔨'
  },
  'equipment-weapons-sickle': {
    id: 'equipment-weapons-sickle',
    name: 'Void Reaper Sickle',
    category: 'weapon',
    rarity: 'rare',
    description: 'Curves like a sliver of the dead moon. Inflicts lacerations that resist healing.',
    stats: { attack: 15, critChance: 0.18 },
    image: './assets/aethelgard/equipment/weapons/sickle.png',
    icon: '🌙'
  },
  'equipment-weapons-bow': {
    id: 'equipment-weapons-bow',
    name: 'Ashwood Ranger Recurve Bow',
    category: 'weapon',
    rarity: 'uncommon',
    description: 'Carved from flexible blackened ash-wood. Shoots with lethal range and whisper quietness.',
    stats: { attack: 17, range: 45 },
    image: './assets/aethelgard/equipment/weapons/bow.png',
    icon: '🏹'
  },
  'equipment-weapons-staff-purple': {
    id: 'equipment-weapons-staff-purple',
    name: 'Nether Void Stave',
    category: 'weapon',
    rarity: 'epic',
    description: 'Channels primordial dark matter from beyond the Abyssal Gate. Emits violet static.',
    stats: { attack: 26, voidPower: 20 },
    image: './assets/aethelgard/equipment/weapons/staff-purple.png',
    icon: '🔮'
  },
  'equipment-weapons-staff-blue': {
    id: 'equipment-weapons-staff-blue',
    name: 'Glacial Aether Scepter',
    category: 'weapon',
    rarity: 'epic',
    description: 'Inlaid with a cold cerulean aether-gem. Chills enemy movement upon impact.',
    stats: { attack: 24, frostDamage: 18 },
    image: './assets/aethelgard/equipment/weapons/staff-blue.png',
    icon: '❄️'
  },
  'equipment-weapons-staff-red': {
    id: 'equipment-weapons-staff-red',
    name: 'Infernal Pyromancer Stave',
    category: 'weapon',
    rarity: 'epic',
    description: 'Topped with an ever-burning ember embered from the core of Aethelgard’s mantle.',
    stats: { attack: 28, burnDamage: 22 },
    image: './assets/aethelgard/equipment/weapons/staff-red.png',
    icon: '🔥'
  },
  'equipment-weapons-staff-gold': {
    id: 'equipment-weapons-staff-gold',
    name: 'Primordial Sunfire Stave',
    category: 'weapon',
    rarity: 'legendary',
    description: 'Bathed in blinding solar resonance. Pierces shadow illusions and heals fraying sanity.',
    stats: { attack: 40, holyPower: 30 },
    image: './assets/aethelgard/equipment/weapons/staff-gold.png',
    icon: '☀️'
  },

  // ── Aethelgard Asset Pack Shields & Armor ──────────────────────────
  'equipment-armor-shield-round': {
    id: 'equipment-armor-shield-round',
    name: 'Reinforced Round Shield',
    category: 'armor',
    rarity: 'common',
    description: 'A sturdy circular shield of banded oak and iron rim. Deflects arrows and light strikes.',
    stats: { defense: 8, blockChance: 0.20 },
    image: './assets/aethelgard/equipment/armor/shield-round.png',
    icon: '🛡️'
  },
  'equipment-armor-shield-a': {
    id: 'equipment-armor-shield-a',
    name: 'Knight’s Heraldic Heater Shield',
    category: 'armor',
    rarity: 'uncommon',
    description: 'Engraved with forgotten family crests of the First Dawn. Balanced and steadfast.',
    stats: { defense: 14, blockChance: 0.28 },
    image: './assets/aethelgard/equipment/armor/shield-a.png',
    icon: '🛡️'
  },
  'equipment-armor-shield-b': {
    id: 'equipment-armor-shield-b',
    name: 'Iron Bastion Tower Shield',
    category: 'armor',
    rarity: 'rare',
    description: 'A massive wall of forged blackened steel. Capable of withstanding colossal beast charges.',
    stats: { defense: 24, blockChance: 0.40 },
    image: './assets/aethelgard/equipment/armor/shield-b.png',
    icon: '🛡️'
  },

  // ── Aethelgard Asset Pack Potions ─────────────────────────────────
  'items-potions-potion-01': {
    id: 'items-potions-potion-01',
    name: 'Distilled Blood-Berry Flask',
    category: 'consumable',
    rarity: 'common',
    description: 'Fermented star-berry tonic. Restores 20 Sanity upon drinking.',
    effect: { stat: 'sanity', value: 20 },
    image: './assets/aethelgard/items/potions/potion-01.png',
    icon: '🧪'
  },
  'items-potions-potion-02': {
    id: 'items-potions-potion-02',
    name: 'Cerulean Aether Draught',
    category: 'consumable',
    rarity: 'uncommon',
    description: 'A glowing cyan elixir that sharpens the mind and boosts Gold earnings.',
    effect: { stat: 'goldMultiplier', value: 1.5 },
    image: './assets/aethelgard/items/potions/potion-02.png',
    icon: '🧪'
  },
  'items-potions-potion-06': {
    id: 'items-potions-potion-06',
    name: 'Golden Ambrosia of Dawn',
    category: 'consumable',
    rarity: 'legendary',
    description: 'Nectar of the high celestials. Restores 100 Sanity and grants 100 Renown immediately.',
    effect: { stat: 'sanity', value: 100 },
    image: './assets/aethelgard/items/potions/potion-06.png',
    icon: '✨'
  },

  // ── Legacy Mappings ───────────────────────────────────────────────
  ashen_bread: {
    id: 'ashen_bread',
    name: 'Ashen Bread',
    category: 'consumable',
    rarity: 'common',
    description: 'Stale bread baked over ember pits. Recovers 15 Sanity.',
    effect: { stat: 'sanity', value: 15 },
    icon: '🍞'
  },
  rusty_blade: {
    id: 'rusty_blade',
    name: 'Rusty Iron Blade',
    category: 'weapon',
    rarity: 'common',
    description: 'A forgotten sword, caked in ash. Still holds an edge.',
    stats: { attack: 5 },
    sprite: 'sword-rusted',
    image: './assets/sprites/sword-rusted.png',
    icon: '🗡️'
  },
  focus_potion: {
    id: 'focus_potion',
    name: 'Aetheric Focus Elixir',
    category: 'consumable',
    rarity: 'rare',
    description: 'A vial of shimmering liquid. Boosts Gold gain during focus.',
    effect: { stat: 'goldMultiplier', value: 2 },
    sprite: 'potion-teal',
    image: './assets/sprites/potion-teal.png',
    icon: '🧪'
  }
};

export function getItem(itemId) {
  if (ITEM_DATABASE[itemId]) {
    return ITEM_DATABASE[itemId];
  }

  // Dynamic fallback from assetRegistry if available
  if (typeof window !== 'undefined' && window.assetRegistry) {
    const reg = window.assetRegistry.get(itemId);
    if (reg) {
      return {
        id: reg.id,
        name: reg.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        category: reg.category,
        rarity: 'uncommon',
        description: `Artifact from ${reg.category}. Dimensions: ${reg.width}×${reg.height}px.`,
        image: window.assetRegistry.getUrl(reg.id),
        icon: '📦'
      };
    }
  }

  return {
    id: itemId,
    name: itemId,
    category: 'misc',
    rarity: 'common',
    description: 'An unknown curio from the wasteland.',
    icon: '❓'
  };
}
