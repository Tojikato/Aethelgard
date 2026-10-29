# Aethelgard — Modern Stranger and Wayfarer Wardrobe

## Production artwork
Generated with the built-in image-generation tool from the approved Concept 01 four-view character. The modern concept preserves the protagonist's identity and anatomy, with contemporary ash-stained clothes and separate smartphone, thermos and notebook studies.

- `concepts/modern-stranger-concept-01.png`: original modern four-view approval sheet.
- `concepts/wayfarer-concept-01.png`: approved medieval four-view reference.
- `portrait-modern.png`, `portrait-wayfarer.png`: 256×256 transparent RGBA.
- `player-modern.png`, `player-wayfarer.png`: 384×192 sheets, six columns and three rows of 64×64 transparent frames.
- Matching `.json` files are standard untrimmed atlas descriptions.
- `armor-wayfarer-tattered.png`: wardrobe item icon.

The exported sprites use a shared 32-color palette, binary alpha, nearest-neighbor sampling, a common standing height of 48 native pixels and a common foot baseline at y=60. Source artwork was cut and registered into fixed production cells; original generated artwork remains preserved separately. No animation cells include labels, grids or backgrounds.

| Animation | Frame indices | Count |
| --- | --- | --- |
| Idle | 0–3 | 4 |
| Walk | 6–11 | 6 |
| Run / dash | 12–15 | 4 |
| Starter blade stance, Wayfarer only | 16 | 1 |

Unused slots stay transparent. Side-view movement uses the existing flip and distance-driven locomotion model. The existing Shift sprint behavior is retained. Actor display scale is 1.6; anchors use (0.5, 60/64), preserving the prior visible height and footprint collision model.

## Runtime integration
- `config/outfits.js`: outfit definitions and frame layout.
- `services/gameState.js`: `equippedOutfit` defaults to `modern_stranger`; active equipment is reflected on the player object.
- `services/playerAppearance.js`: asset preloading, outfit-specific animation keys, player reply portraits and finite ash bursts. Scene shutdown removes appearance listeners. Reduced motion omits swap particles.
- `services/wardrobe.js`: inventory ownership checks, serialized equipment changes and atomic starter rewards.
- Watcher Branch 3 grants sword-rusted, potion-red, scroll-a and armor-wayfarer-tattered. Garb equips automatically; the blade can be readied from the Vault.
- The Vault allows switching between modern clothes and owned Wayfarer garb. Selected sheets persist during movement, sprinting, modal idle and travel between Camp and Oakhaven.
- Portraits are identified as the PLAYER'S REPLY, separate from NPC speaker headings.

## Save compatibility
No new Firestore rules or deployment are required for these records. Existing owner-only inventory rules already permit a stable string itemId and numeric quantity.

Reserved inventory records:
- `users/{uid}/inventory/__equipment`: quantity 0 = modern/unarmed, 1 = Wayfarer/unarmed, 2 = modern/blade readied, 3 = Wayfarer/blade readied. A missing record defaults to modern/unarmed. ItemId remains unchanged on updates.
- `users/{uid}/inventory/__starter_bundle`: quantity 1 marks the starter bundle claimed.

These records are filtered out of visible inventory and item counts. The gift marker, rewards and initial garb selection commit in ONE Firestore transaction. A failed transaction grants nothing and leaves the claim retryable. Repeat/concurrent claims cannot duplicate rewards. The soulbound Weathered Atlas identifies a legacy starter claim even after potions were consumed or gear was lost; these inventories receive only the new garb, preserving their original stock and losses.

Account login hydrates the equipment records before game startup. Demo saves use the separate `aethelgard_wardrobe_demo_v1` storage record, including the demo inventory, and do not override authenticated profiles. Session checks prevent a queued operation from applying to another account. No progression, stat balance, quest reward amounts, travel destinations or unrelated save fields were reset.

## Validation
- JavaScript syntax checks.
- Image dimensions, alpha channels, palette size and atlas frame counts.
- Existing manifest and item-path checks adapted in memory to the current D: project location.
- Transaction-contract tests against the current rule shape: atomic failure rollback, concurrent and duplicate claims, ownership checks, legacy migration, outfit and blade selection.
- Browser end-to-end: modern spawn and portrait, Watcher gift, manual outfit swaps, blade stance, walk/run frame routing, both travel directions, and reload via the real preview/prologue flow.
- Desktop/mobile wardrobe layout, reduced-motion behavior and automatic particle cleanup.
- Live authenticated Firestore round-trip was not exercised: no account credentials were supplied. Cloud persistence was verified at the transaction-contract level; the browser persistence test used an isolated demo context.

No publication, rules deployment or dependency upgrade was performed.

