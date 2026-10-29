// Cosmetic outfit definitions and fixed 64px animation layouts.
export const DEFAULT_OUTFIT = 'modern_stranger';
export const OUTFITS = Object.freeze({
  modern_stranger: { id: 'modern_stranger', label: 'The Modern Stranger', texture: 'player-modern', portrait: 'portrait-modern', item: null },
  ashen_wayfarer: { id: 'ashen_wayfarer', label: 'The Ashen Wayfarer', texture: 'player-wayfarer', portrait: 'portrait-wayfarer', item: 'armor-wayfarer-tattered' }
});
export const EQUIPMENT_DOC = '__equipment';
export const STARTER_DOC = '__starter_bundle';
export const STARTER_ITEMS = ['sword-rusted', 'potion-red', 'scroll-a', 'armor-wayfarer-tattered'];
export const FRAME_LAYOUT = { idle: [0, 1, 2, 3], walk: [6, 7, 8, 9, 10, 11], run: [12, 13, 14, 15], blade: [16] };
export function decodeEquipment(value = 0) {
  const code = Number.isInteger(value) && value >= 0 && value <= 3 ? value : 0;
  return { equippedOutfit: code & 1 ? 'ashen_wayfarer' : DEFAULT_OUTFIT, equippedWeapon: code & 2 ? 'sword-rusted' : null };
}
export function encodeEquipment(outfit, weapon) {
  return (outfit === 'ashen_wayfarer' ? 1 : 0) | (weapon === 'sword-rusted' ? 2 : 0);
}
