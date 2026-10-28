import json
import os

m_path = 'E:/Aethelgard/abyssal-gate/dist/assets/manifest.json'
base = 'E:/Aethelgard/abyssal-gate/dist/assets'

with open(m_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

print(f'Total assets in manifest.json: {len(manifest["assets"])}')

missing = []
for a in manifest['assets']:
    full_path = os.path.join(base, a['path'])
    if not os.path.exists(full_path):
        missing.append((a['id'], a['path'], full_path))

print(f'Missing files count: {len(missing)}')
if missing:
    for m in missing[:10]:
        print('MISSING:', m)
else:
    print('ALL MANIFEST ASSETS EXIST 100% ON DISK!')
