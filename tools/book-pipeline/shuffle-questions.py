import random, sys

src = sys.argv[1]
dst = sys.argv[2]
rnd = random.Random(20260809)

out = []
for line in open(src, encoding='utf-8'):
    line = line.strip()
    if not line:
        continue
    p = [x.strip() for x in line.split('|')]
    q, opts, correct, topic = p[0], p[1:5], int(p[5]) - 1, p[6]
    right = opts[correct]
    order = list(range(4))
    rnd.shuffle(order)
    new_opts = [opts[i] for i in order]
    out.append('%s | %s | %d | %s' % (q, ' | '.join(new_opts), new_opts.index(right) + 1, topic))

open(dst, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('written', len(out))
