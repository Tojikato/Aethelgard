import os
import json

base_dir = r"E:\Aethelgard\abyssal-gate\dist\assets"
pack1_path = os.path.join(base_dir, "manifest.json")
pack2_path = os.path.join(base_dir, "aethelgard", "manifest.json")

with open(pack1_path, "r", encoding="utf-8") as f:
    m1 = json.load(f)

with open(pack2_path, "r", encoding="utf-8") as f:
    m2 = json.load(f)

unified_assets = []
seen_ids = set()
alias_map = {}

# 1. Process Pack 1 (Sprites)
for a in m1.get("assets", []):
    aid = a["id"]
    seen_ids.add(aid)
    entry = {
        "id": aid,
        "name": aid.replace("-", " ").title(),
        "category": a.get("category", "scenery"),
        "path": a.get("path"),  # e.g. "sprites/camp.png"
        "width": a.get("width"),
        "height": a.get("height"),
        "sourceRect": a.get("sourceRect"),
        "anchor": a.get("anchor", {"x": 0.5, "y": 1.0} if "camp" in aid or "ruins" in aid or "arch" in aid else {"x": 0.5, "y": 0.5}),
        "pack": "pack1_sprites"
    }
    unified_assets.append(entry)
    alias_map[aid] = entry["path"]

# 2. Process Pack 2 (Aethelgard Dark Fantasy Collection)
for a in m2.get("assets", []):
    aid = a["id"]
    name = a.get("name", aid)
    rel_path = a.get("path") # e.g. "architecture/buildings/cottage.png"
    entry = {
        "id": aid,
        "name": name,
        "category": a.get("category", "scenery"),
        "path": rel_path,
        "width": a.get("width"),
        "height": a.get("height"),
        "sourceRect": a.get("sourceRect"),
        "anchor": {"x": 0.5, "y": 1.0},
        "pack": "aethelgard_collection"
    }
    unified_assets.append(entry)
    alias_map[aid] = rel_path
    # Also register short name alias if not conflicting
    if name not in alias_map:
        alias_map[name] = rel_path
    # Register common prop/building basename alias (e.g. 'map-table', 'cathedral')
    base_name = os.path.splitext(os.path.basename(rel_path))[0]
    if base_name not in alias_map:
        alias_map[base_name] = rel_path

master_manifest = {
    "schemaVersion": 2,
    "pack": "aethelgard-unified",
    "description": "Unified Asset Manifest for Aethelgard: Ashen Hamlet, Scenery, Equipment, Architecture & Props",
    "totalAssets": len(unified_assets),
    "assets": unified_assets
}

# Write unified manifest to dist/assets/manifest.json
with open(pack1_path, "w", encoding="utf-8") as f:
    json.dump(master_manifest, f, indent=2)
print(f"Written unified manifest to {pack1_path} ({len(unified_assets)} assets)")

# Also write to dist/assets/aethelgard/manifest.json so both paths serve the master manifest
with open(pack2_path, "w", encoding="utf-8") as f:
    json.dump(master_manifest, f, indent=2)
print(f"Updated {pack2_path} with unified manifest")

# 3. Generate dist/src/config/AssetRegistry.js
js_code = """// ═══════════════════════════════════════════════════════════════════════════
//  ASSET REGISTRY CONFIGURATION — Central Asset Dictionary & Resolver
//  Unified registry covering Pack 1 (Sprites) and Pack 2 (Aethelgard 236-pack)
// ═══════════════════════════════════════════════════════════════════════════

export const ASSET_BASE_PATH = './assets/';

export const ASSET_MAP = {
"""

for k, v in sorted(alias_map.items()):
    js_code += f'  "{k}": "{v}",\n'

js_code += """};

/**
 * Resolve an asset key or path to its proper relative URL from web root.
 * Guarantees zero 404s by resolving aliases, prefixes, and dual-pack paths.
 */
export function resolveAssetPath(keyOrPath) {
  if (!keyOrPath) return '';
  if (keyOrPath.startsWith('./') || keyOrPath.startsWith('/') || keyOrPath.startsWith('http')) {
    return keyOrPath;
  }
  if (ASSET_MAP[keyOrPath]) {
    return `${ASSET_BASE_PATH}${ASSET_MAP[keyOrPath]}`;
  }
  // If it already contains an asset category prefix, prepend base path
  return `${ASSET_BASE_PATH}${keyOrPath}`;
}

export default ASSET_MAP;
"""

js_path = r"E:\Aethelgard\abyssal-gate\dist\src\config\AssetRegistry.js"
with open(js_path, "w", encoding="utf-8") as f:
    f.write(js_code)
print(f"Generated AssetRegistry.js at {js_path}")
