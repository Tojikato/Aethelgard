# Instructions for game-development agents

- Read `manifest.json` as the authoritative asset catalog. Paths are relative to this directory.
- Use `sprites/` for prototype rendering; preserve `crops/` and `original/` as repair references.
- Transparent sprites use automated cleanup with protected detail regions, not pixel-by-pixel manual tracing. Subtle edge artifacts may remain. Do not describe them as final production artwork or animation-ready.
- This pack includes only weapons, potions, and scenery. Character artwork must be supplied separately.
- Use the suggested normalized bottom-center anchors for scenery, and center anchors for inventory items. Dimensions differ; do not assume a uniform frame grid.
- The displayed artwork is pixel-style JPEG-derived art, not a verified native-resolution pixel grid. Disable image smoothing and prefer integer scaling.
- Keep the props-only source reference unchanged. Store newly generated or edited artwork in a separate folder and document provenance.
- Weapons are standalone inventory artwork, not pre-aligned character attachments. Match their scale and grip position explicitly when equipping them.
- Scenery is standalone prop artwork, not a seamless tile set. Define collision bounds in game code, not from full image rectangles.
- Do not infer potion mechanics, combat statistics, or licensing from colors or filenames. These are descriptive identifiers only.
- No credentials, engine-specific code, or network services are required by this asset pack.
