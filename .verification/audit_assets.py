import re
import os

reg_path = 'E:/Aethelgard/abyssal-gate/dist/src/config/AssetRegistry.js'
base = 'E:/Aethelgard/abyssal-gate/dist/assets'

with open(reg_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'^\s*"([^"]+)":\s*"([^"]+)",?'
matches = re.findall(pattern, content, flags=re.MULTILINE)

print(f'Total mapped keys in AssetRegistry: {len(matches)}')

missing = []
for key, rel_path in matches:
    full_path = os.path.join(base, rel_path)
    if not os.path.exists(full_path):
        missing.append((key, rel_path, full_path))

print(f'Missing files count: {len(missing)}')
if missing:
    for m in missing[:10]:
        print('MISSING:', m)
else:
    print('ALL ASSET MAPPINGS EXIST 100% ON DISK!')
