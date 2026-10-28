import os
import json

base_dir = r"E:\Aethelgard\abyssal-gate\dist\assets"
pack1_path = os.path.join(base_dir, "manifest.json")
pack2_path = os.path.join(base_dir, "aethelgard", "manifest.json")
registry_path = r"E:\Aethelgard\abyssal-gate\dist\src\config\AssetRegistry.js"

with open(pack1_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

bg_assets = [
    {
        "id": "bg-ashen-hamlet",
        "name": "Background Ashen Hamlet",
        "category": "background",
        "path": "backgrounds/bg-ashen-hamlet.png",
        "width": 1376,
        "height": 768,
        "anchor": {"x": 0.0, "y": 0.0},
        "pack": "backgrounds_pack"
    },
    {
        "id": "bg-oakhaven-outpost",
        "name": "Background Oakhaven Outpost",
        "category": "background",
        "path": "backgrounds/bg-oakhaven-outpost.png",
        "width": 1376,
        "height": 768,
        "anchor": {"x": 0.0, "y": 0.0},
        "pack": "backgrounds_pack"
    },
    {
        "id": "bg-bastion-of-iron",
        "name": "Background Bastion of Iron",
        "category": "background",
        "path": "backgrounds/bg-bastion-of-iron.png",
        "width": 1376,
        "height": 768,
        "anchor": {"x": 0.0, "y": 0.0},
        "pack": "backgrounds_pack"
    },
    {
        "id": "bg-port-azure",
        "name": "Background Port Azure",
        "category": "background",
        "path": "backgrounds/bg-port-azure.png",
        "width": 1376,
        "height": 768,
        "anchor": {"x": 0.0, "y": 0.0},
        "pack": "backgrounds_pack"
    },
    {
        "id": "bg-gilded-nexus",
        "name": "Background Gilded Nexus",
        "category": "background",
        "path": "backgrounds/bg-gilded-nexus.png",
        "width": 1376,
        "height": 768,
        "anchor": {"x": 0.0, "y": 0.0},
        "pack": "backgrounds_pack"
    },
    {
        "id": "bg-shadowfen-citadel",
        "name": "Background Shadowfen Citadel",
        "category": "background",
        "path": "backgrounds/bg-shadowfen-citadel.png",
        "width": 1376,
        "height": 768,
        "anchor": {"x": 0.0, "y": 0.0},
        "pack": "backgrounds_pack"
    }
]

existing_ids = {a["id"] for a in manifest["assets"]}
added_count = 0
for bg in bg_assets:
    if bg["id"] not in existing_ids:
        manifest["assets"].append(bg)
        existing_ids.add(bg["id"])
        added_count += 1

manifest["totalAssets"] = len(manifest["assets"])

with open(pack1_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
print(f"Updated {pack1_path} with {added_count} new background assets (Total: {manifest['totalAssets']})")

with open(pack2_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
print(f"Updated {pack2_path}")

with open(registry_path, "r", encoding="utf-8") as f:
    registry_code = f.read()

new_entries = []
for bg in bg_assets:
    entry_line = f'  "{bg["id"]}": "{bg["path"]}",'
    if f'"{bg["id"]}"' not in registry_code:
        new_entries.append(entry_line)

if new_entries:
    insert_marker = "export const ASSET_MAP = {\n"
    idx = registry_code.find(insert_marker)
    if idx != -1:
        insert_pos = idx + len(insert_marker)
        entries_str = "\n".join(new_entries) + "\n"
        registry_code = registry_code[:insert_pos] + entries_str + registry_code[insert_pos:]
        with open(registry_path, "w", encoding="utf-8") as f:
            f.write(registry_code)
        print(f"Updated {registry_path} with {len(new_entries)} new aliases")
else:
    print("AssetRegistry already up to date")
