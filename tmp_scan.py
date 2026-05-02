import pathlib
import re
root = pathlib.Path('.')
pattern = re.compile(r'\bfetch\s*\(')
cred = re.compile(r'\bcredentials\s*:\s*["\']include["\']')
missing = []
for f in root.rglob('*.[tj]s*'):
    try:
        text = f.read_text(encoding='utf-8')
    except Exception:
        continue
    for m in pattern.finditer(text):
        start = m.start()
        snippet = text[start:start+800]
        if not cred.search(snippet):
            line = text[:start].count('\n') + 1
            missing.append((str(f), line, snippet.split('\n')[0].strip()))
for item in missing:
    print(f"{item[0]}:{item[1]}: {item[2]}")
print(f'TOTAL {len(missing)}')
