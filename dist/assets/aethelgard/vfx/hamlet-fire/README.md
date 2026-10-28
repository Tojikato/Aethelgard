# Localized hearth flame assets

The original `assets/sprites/camp.png` and `assets/aethelgard/props/dungeon/brazier-orange.png` are preserved.

- `*-body.png`: original image with only the selected flame silhouette removed.
- `*-flame.png`: twelve nearest-neighbor frames of the extracted flame, with row-dependent tip sway, width, and height changes. Camp frames are 72x76; brazier frames are 48x62. Playback: 10 fps.
- `*-mask.png`: the exact source pixels selected for removal, retained for preservation checks.

Frames are placed at the original flame base. The campsite body never scales, rotates, or pulses. Reduced-motion mode holds a still flame frame and stops fire ember emitters.

Preparation is reproducible with `.verification/prepare-fire.py` from the project root. It uses the original assets and Pillow; no runtime image-processing dependency is needed.
