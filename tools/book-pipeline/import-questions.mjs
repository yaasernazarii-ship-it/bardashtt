import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const OPTION_COUNT = 4;

const file = process.argv[2];
const text = fs.readFileSync(file, 'utf8');

const rows = [];
const errors = [];
text.split('\n').forEach((rawLine, i) => {
  const line = rawLine.trim();
  if (!line) return;
  const parts = line.split('|').map((p) => p.trim());
  if (parts.length !== OPTION_COUNT + 3) {
    errors.push(`خط ${i + 1}: تعداد ستون‌ها نادرست است (${parts.length})`);
    return;
  }
  const [qText, ...rest] = parts;
  const options = rest.slice(0, OPTION_COUNT);
  const correct = parseInt(rest[OPTION_COUNT], 10);
  const topic = rest[OPTION_COUNT + 1] || null;
  if (!qText) { errors.push(`خط ${i + 1}: متن سوال خالی است.`); return; }
  if (options.some((o) => !o)) { errors.push(`خط ${i + 1}: گزینهٔ خالی دارد.`); return; }
  if (!(correct >= 1 && correct <= OPTION_COUNT)) { errors.push(`خط ${i + 1}: شمارهٔ گزینهٔ درست نامعتبر است.`); return; }
  rows.push({ text: qText.slice(0, 1000), options, correct: correct - 1, topic: topic ? topic.slice(0, 80) : null });
});

if (errors.length) {
  console.error('ERRORS:\n' + errors.join('\n'));
  process.exit(1);
}

const before = await prisma.examQuestion.count();
const existing = new Set((await prisma.examQuestion.findMany({ select: { text: true } })).map((q) => q.text));
const fresh = rows.filter((r) => !existing.has(r.text));

const res = await prisma.examQuestion.createMany({ data: fresh });
const after = await prisma.examQuestion.count();

console.log(JSON.stringify({ parsed: rows.length, skippedDuplicates: rows.length - fresh.length, created: res.count, before, after }, null, 2));
await prisma.$disconnect();
