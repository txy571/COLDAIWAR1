import re

with open('src/data/techTree.ts', 'r', encoding='utf-8') as f:
    content = f.read()

ids = re.findall(r"id:\s*'([^']+)'", content)

seen = set()
duplicates = set()
for id_val in ids:
    if id_val in seen:
        duplicates.add(id_val)
    seen.add(id_val)

print("Total IDs found:", len(ids))
print("Duplicate IDs:", list(duplicates))
