import re
import os

items_path = 'E:/Aethelgard/abyssal-gate/dist/src/config/items.js'
dist_dir = 'E:/Aethelgard/abyssal-gate/dist'

with open(items_path, 'r', encoding='utf-8') as f:
    c = f.read()

paths = re.findall(r"image:\s*'([^']+)'", c)
missing = [p for p in paths if not os.path.exists(os.path.join(dist_dir, p.lstrip('./').replace('/', os.sep)))]
print('items.js paths:', len(paths), '| missing:', len(missing))
if missing:
    print('Missing items:', missing)
else:
    print('ALL ITEMS.JS PATHS EXIST 100% ON DISK!')
