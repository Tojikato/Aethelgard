import re
import os

boot_path = 'E:/Aethelgard/abyssal-gate/dist/src/scenes/Boot.js'
dist_dir = 'E:/Aethelgard/abyssal-gate/dist'

with open(boot_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r"this\.load\.(?:image|json)\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)"
matches = re.findall(pattern, content)

print(f'Total preloaded assets in Boot.js: {len(matches)}')

missing = []
for key, rel_path in matches:
    # rel_path is like './assets/...'
    clean_rel = rel_path.lstrip('./').replace('/', os.sep)
    full_path = os.path.join(dist_dir, clean_rel)
    if not os.path.exists(full_path):
        missing.append((key, rel_path, full_path))

print(f'Missing Boot.js files count: {len(missing)}')
if missing:
    for m in missing:
        print('MISSING IN BOOT.JS:', m)
else:
    print('ALL BOOT.JS PRELOADED ASSETS EXIST 100% ON DISK!')
