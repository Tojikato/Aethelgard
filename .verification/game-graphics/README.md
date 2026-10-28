# Dark fantasy graphics pack

Copy this entire `game-graphics` folder into your project's public/static asset directory. Read `AGENTS.md` before using the artwork. No engine or external dependency is required to use the PNG files.

## Contents

- `original/props-sheet.png`: source reference cropped to exclude all characters.
- `crops/`: 14 individual PNG crops with their original background preserved.
- `sprites/`: matching transparent PNGs with expanded background cleanup, detached-speckle removal, and protected detail regions.
- `manifest.json`: asset IDs, paths, dimensions, source rectangles, and suggested anchors.

These are static prototype assets, NOT a finished animation sheet. All images retain the uploaded resolution; converting JPEG to PNG does not restore original pixel data.

## Quick use

For a Vite project, put this folder under `public/game-graphics`, then load `/game-graphics/manifest.json`. Each asset path in the manifest is relative to this folder.

```js
const base = "/game-graphics/";
const manifest = await fetch(base + "manifest.json").then(r => r.json());
const potion = manifest.assets.find(a => a.id === "potion-red");
const image = new Image();
image.src = base + potion.path;
```

Canvas: set `context.imageSmoothingEnabled = false`. HTML: use `image-rendering: pixelated`. Prefer whole-number scales. In Phaser, enable `pixelArt: true` and load each PNG as an image, not as a spritesheet.

This pack contains only weapons, potions, and scenery; no characters are included. Place `camp` as scenery and use `potion-red` as a pickup. Store collision shapes separately from the artwork.

## Quality and rights

Transparency has been cleaned with automated masks and protected detail regions, but is still JPEG-derived: subtle fringes or background-colored pixels may remain. Inspect outlines, weapon glow, and camp shadows at your intended game scale. Use the preserved crops or props sheet for further manual repair. No animations, seamless terrain tiles, rigging, or verified collision shapes are supplied.

No license or ownership claim is inferred from the upload. Confirm your right to use and distribute the source artwork before publishing a game.
