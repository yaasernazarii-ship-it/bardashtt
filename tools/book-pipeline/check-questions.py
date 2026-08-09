import collections, sys

path = sys.argv[1] if len(sys.argv) > 1 else 'exam-questions.txt'
bad = []
topics = collections.Counter()
seen = {}
dups = []
n = 0
for i, line in enumerate(open(path, encoding='utf-8'), 1):
    line = line.strip()
    if not line:
        continue
    n += 1
    p = [x.strip() for x in line.split('|')]
    if len(p) != 7:
        bad.append((i, 'cols=%d' % len(p)))
        continue
    if not p[5].isdigit() or not (1 <= int(p[5]) <= 4):
        bad.append((i, 'correct=' + p[5]))
    if len(set(p[1:5])) != 4:
        bad.append((i, 'duplicate-options'))
    if any(not x for x in p[:5]):
        bad.append((i, 'empty-field'))
    topics[p[6]] += 1
    if p[0] in seen:
        dups.append((i, seen[p[0]]))
    seen[p[0]] = i

print('total questions:', n)
print('bad rows:', bad)
print('duplicate questions:', dups)
print('--- topics ---')
for t, c in topics.most_common():
    print(c, t)
