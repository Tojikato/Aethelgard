import os
import json

base_dir = r"E:\Aethelgard\abyssal-gate\dist\assets"
pack1_path = os.path.join(base_dir, "manifest.json")
pack2_path = os.path.join(base_dir, "aethelgard", "manifest.json")

with open(pack1_path, "r", encoding="utf-8") as f:
    m1 = json.load(f)

with open(pack2_path, "r", encoding="utf-8") as f:
    m2 = json.load(f)

print(f"Loaded m1 ({len(m1.get('assets', []))} assets) and m2 ({len(m2.get('assets', []))} assets)")

targets = ['map-table', 'well', 'cart', 'dead-tree', 'signpost', 'cathedral', 'tavern', 'cottage', 'tall-house', 'timber-house', 'shop-stall', 'watchtower', 'noticeboard', 'scroll-a']
for a in m2['assets']:
    for t in targets:
        if t in a['id'] or t in a['path']:
            print(f"{t:15} -> id: {a['id']:35} path: {a['path']}")
