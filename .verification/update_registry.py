import re
import os

reg_path = 'E:/Aethelgard/abyssal-gate/dist/src/config/AssetRegistry.js'
with open(reg_path, 'r', encoding='utf-8') as f:
    content = f.read()

def repl(match):
    key = match.group(1)
    val = match.group(2)
    if not val.startswith('sprites/') and not val.startswith('aethelgard/'):
        return f'  "{key}": "aethelgard/{val}",'
    return match.group(0)

pattern = r'^\s*"([^"]+)":\s*"([^"]+)",?'
new_content = re.sub(pattern, repl, content, flags=re.MULTILINE)

resolve_func = """export function resolveAssetPath(keyOrPath) {
  if (!keyOrPath) return '';
  if (keyOrPath.startsWith('./') || keyOrPath.startsWith('/') || keyOrPath.startsWith('http')) {
    return keyOrPath;
  }
  if (ASSET_MAP[keyOrPath]) {
    return `${ASSET_BASE_PATH}${ASSET_MAP[keyOrPath]}`;
  }
  if (keyOrPath.startsWith('sprites/') || keyOrPath.startsWith('aethelgard/')) {
    return `${ASSET_BASE_PATH}${keyOrPath}`;
  }
  return `${ASSET_BASE_PATH}aethelgard/${keyOrPath}`;
}"""

new_content = re.sub(r'export function resolveAssetPath\(keyOrPath\) \{[\s\S]*?^\}', resolve_func, new_content, flags=re.MULTILINE)

with open(reg_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('AssetRegistry.js updated successfully!')
