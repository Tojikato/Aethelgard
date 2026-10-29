// Equipment persistence uses reserved inventory records accepted by the current
// owner-only rules: itemId is stable; quantity encodes outfit/weapon selection.
import { getPlayer, getUser, isDemo, setEquipment, getEquippedOutfit, getEquippedWeapon, readDemoWardrobe, DEMO_WARDROBE_KEY } from './gameState.js';
import { loadFirebase } from '../config/firebase.js';
import { OUTFITS, EQUIPMENT_DOC, STARTER_DOC, STARTER_ITEMS, encodeEquipment, decodeEquipment } from '../config/outfits.js';

let pending = Promise.resolve();
function serialize(action) {
  const uid = getUser()?.uid, demo = isDemo();
  const operation = pending.then(() => {
    if (!sameOwner(uid, demo)) throw new Error('Thy session changed. Open the vault anew.');
    return action();
  });
  pending = operation.catch(() => {});
  return operation;
}
function sameOwner(uid, demo) {
  return isDemo() === demo && (demo || getUser()?.uid === uid);
}
export function persistDemoWardrobe(inventory) {
  const saved = { equippedOutfit: getEquippedOutfit(), equippedWeapon: getEquippedWeapon(), starterBundleClaimed: Boolean(getPlayer().starterBundleClaimed), inventory };
  localStorage.setItem(DEMO_WARDROBE_KEY, JSON.stringify(saved));
  localStorage.setItem('aethelgard_inventory', JSON.stringify(inventory));
}
export function isEquipmentRecord(item) { return item.docId === EQUIPMENT_DOC || item.docId === STARTER_DOC || item.itemId === EQUIPMENT_DOC || item.itemId === STARTER_DOC; }

export function equipOutfit(outfitId, inventory) {
  return serialize(async () => {
    const outfit = OUTFITS[outfitId];
    if (!outfit) throw new Error('That weave belongs to no known realm.');
    if (outfit.item && !inventory?.hasItem(outfit.item)) throw new Error('Thou dost not possess this garb.');
    const demo = isDemo(), uid = getUser()?.uid;
    const equipment = { equippedOutfit: outfitId, equippedWeapon: getEquippedWeapon() };
    if (demo) {
      const saved = { equippedOutfit: outfitId, equippedWeapon: equipment.equippedWeapon, starterBundleClaimed: Boolean(getPlayer().starterBundleClaimed), inventory: inventory?.getItems() || [] };
      localStorage.setItem(DEMO_WARDROBE_KEY, JSON.stringify(saved));
    } else {
      if (!uid) throw new Error('Thy soul must first be bound to the archive.');
      const fb = await loadFirebase();
      await fb.runTransaction(fb.db, async tx => {
        const eqRef = fb.doc(fb.db, 'users', uid, 'inventory', EQUIPMENT_DOC);
        const current = await tx.get(eqRef);
        if (outfit.item) {
          const owned = await tx.get(fb.doc(fb.db, 'users', uid, 'inventory', outfit.item));
          if (!owned.exists() || owned.data().quantity < 1) throw new Error('The archive bears no record of this garb.');
        }
        equipment.equippedWeapon = decodeEquipment(current.exists() ? current.data().quantity : 0).equippedWeapon;
        const quantity = encodeEquipment(outfitId, equipment.equippedWeapon);
        // Missing metadata already means unarmed modern clothes. Existing rules
        // allow quantity 0 on update, but require >= 1 on initial creation.
        if (current.exists() || quantity > 0) tx.set(eqRef, { itemId: EQUIPMENT_DOC, quantity });
      });
    }
    if (sameOwner(uid, demo)) { setEquipment(equipment); inventory?.render(); }
    return equipment;
  });
}

export function equipStarterBlade(inventory) {
  return serialize(async () => {
    if (!inventory?.hasItem('sword-rusted')) throw new Error('Thy hand holds no starter blade.');
    const demo = isDemo(), uid = getUser()?.uid;
    const equipment = { equippedOutfit: getEquippedOutfit(), equippedWeapon: getEquippedWeapon() ? null : 'sword-rusted' };
    if (demo) {
      const saved = { ...readDemoWardrobe(), ...equipment, starterBundleClaimed: Boolean(getPlayer().starterBundleClaimed), inventory: inventory.getItems() };
      localStorage.setItem(DEMO_WARDROBE_KEY, JSON.stringify(saved));
    } else {
      if (!uid) throw new Error('Thy soul must first be bound to the archive.');
      const fb = await loadFirebase();
      await fb.runTransaction(fb.db, async tx => {
        const eqRef = fb.doc(fb.db, 'users', uid, 'inventory', EQUIPMENT_DOC);
        const [current, blade] = await Promise.all([tx.get(eqRef), tx.get(fb.doc(fb.db, 'users', uid, 'inventory', 'sword-rusted'))]);
        if (!blade.exists() || blade.data().quantity < 1) throw new Error('The archive bears no record of thy blade.');
        const previous = decodeEquipment(current.exists() ? current.data().quantity : 0);
        equipment.equippedOutfit = previous.equippedOutfit;
        equipment.equippedWeapon = previous.equippedWeapon ? null : 'sword-rusted';
        tx.set(eqRef, { itemId: EQUIPMENT_DOC, quantity: encodeEquipment(equipment.equippedOutfit, equipment.equippedWeapon) });
      });
    }
    if (sameOwner(uid, demo)) { setEquipment(equipment); inventory.render(); }
    return equipment;
  });
}

export function claimStarterBundle(inventory) {
  return serialize(async () => {
    if (!inventory) throw new Error('The vault is not yet ready.');
    const demo = isDemo(), uid = getUser()?.uid;
    let claimed = false, resultItems, equipment;
    if (demo) {
      const saved = readDemoWardrobe();
      if (saved?.starterBundleClaimed) {
        equipment = { equippedOutfit: saved.equippedOutfit, equippedWeapon: saved.equippedWeapon };
        resultItems = saved.inventory;
      } else {
        resultItems = inventory.getItems().map(item => ({ ...item }));
        // The GDD makes the Atlas soulbound: it survives consumed potions and
        // lost gear, so it is the durable witness of the old starter claim.
        const legacy = resultItems.some(i => i.itemId === 'scroll-a' && i.quantity > 0);
        for (const id of STARTER_ITEMS) {
          const item = resultItems.find(i => i.itemId === id);
          if (legacy && id !== 'armor-wayfarer-tattered') continue;
          if (item) item.quantity = (item.quantity || 0) + 1;
          else resultItems.push({ itemId: id, quantity: 1 });
        }
        equipment = { equippedOutfit: 'ashen_wayfarer', equippedWeapon: null };
        localStorage.setItem(DEMO_WARDROBE_KEY, JSON.stringify({ ...equipment, starterBundleClaimed: true, inventory: resultItems }));
        claimed = true;
      }
    } else {
      if (!uid) throw new Error('Thy soul must first be bound to the archive.');
      const fb = await loadFirebase();
      const ref = id => fb.doc(fb.db, 'users', uid, 'inventory', id);
      const result = await fb.runTransaction(fb.db, async tx => {
        // All reads precede writes. The marker and all rewards commit atomically.
        const [marker, current, ...items] = await Promise.all([
          tx.get(ref(STARTER_DOC)), tx.get(ref(EQUIPMENT_DOC)), ...STARTER_ITEMS.map(id => tx.get(ref(id)))
        ]);
        if (marker.exists() && marker.data().quantity === 1) return { claimed: false, equipment: decodeEquipment(current.exists() ? current.data().quantity : 0), items: items.filter(s => s.exists() && s.data().quantity > 0).map(s => s.data()) };
        const legacy = items[2].exists() && items[2].data().quantity > 0;
        const rewards = STARTER_ITEMS.map((id, index) => {
          const quantity = items[index].exists() ? items[index].data().quantity : 0;
          return { itemId: id, quantity: legacy && index < 3 ? quantity : quantity + 1 };
        });
        rewards.forEach(item => {
          if (!legacy || item.itemId === 'armor-wayfarer-tattered') tx.set(ref(item.itemId), item);
        });
        tx.set(ref(STARTER_DOC), { itemId: STARTER_DOC, quantity: 1 });
        tx.set(ref(EQUIPMENT_DOC), { itemId: EQUIPMENT_DOC, quantity: 1 });
        return { claimed: true, equipment: decodeEquipment(1), items: rewards.filter(item => item.quantity > 0) };
      });
      claimed = result.claimed; equipment = result.equipment; resultItems = result.items;
    }
    if (sameOwner(uid, demo)) {
      for (const item of resultItems || []) {
        const current = inventory.items.find(i => i.itemId === item.itemId);
        if (current) Object.assign(current, item); else inventory.items.push(item);
      }
      getPlayer().starterBundleClaimed = true;
      setEquipment(equipment);
      if (demo) localStorage.setItem('aethelgard_inventory', JSON.stringify(inventory.items));
      inventory.render();
    }
    return { claimed, ...equipment };
  });
}

