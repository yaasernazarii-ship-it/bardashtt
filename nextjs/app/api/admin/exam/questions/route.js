import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager, toLatinDigits } from '@/lib/auth';
import { OPTION_COUNT, normalizeOptions } from '@/lib/exam';

function serialize(q) {
  return {
    id: q.id,
    text: q.text,
    options: Array.isArray(q.options) ? q.options : [],
    correct: q.correct,
    topic: q.topic,
    active: q.active,
    createdAt: q.createdAt.toISOString(),
  };
}

// هر خط یک سؤال:  متن سؤال | گزینه۱ | گزینه۲ | گزینه۳ | گزینه۴ | شمارهٔ گزینهٔ درست (۱ تا ۴) | سرفصل (اختیاری)
function parseBulk(text) {
  const rows = [];
  const errors = [];
  const lines = String(text || '').split('\n');

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (!line) return;
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < OPTION_COUNT + 2) {
      errors.push(`خط ${i + 1}: تعداد ستون‌ها کم است.`);
      return;
    }
    const [qText, ...rest] = parts;
    const options = normalizeOptions(rest.slice(0, OPTION_COUNT));
    const correct = parseInt(toLatinDigits(rest[OPTION_COUNT]).replace(/[^\d]/g, ''), 10);
    const topic = rest[OPTION_COUNT + 1] || null;

    if (!qText) { errors.push(`خط ${i + 1}: متن سؤال خالی است.`); return; }
    if (!options) { errors.push(`خط ${i + 1}: باید دقیقاً ${OPTION_COUNT} گزینه داشته باشد.`); return; }
    if (!(correct >= 1 && correct <= OPTION_COUNT)) {
      errors.push(`خط ${i + 1}: شمارهٔ گزینهٔ درست باید بین ۱ تا ${OPTION_COUNT} باشد.`);
      return;
    }
    rows.push({ text: qText.slice(0, 1000), options, correct: correct - 1, topic: topic ? topic.slice(0, 80) : null });
  });

  return { rows, errors };
}

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  const [items, activeCount] = await Promise.all([
    prisma.examQuestion.findMany({
      where: q ? { text: { contains: q, mode: 'insensitive' } } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.examQuestion.count({ where: { active: true } }),
  ]);

  return Response.json({ ok: true, items: items.map(serialize), activeCount });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  // افزودن گروهی از روی متنِ چسبانده‌شده (هر خط یک سؤال)
  if (typeof body.bulk === 'string') {
    const { rows, errors } = parseBulk(body.bulk);
    if (rows.length === 0) {
      return Response.json({ ok: false, error: 'هیچ سؤال معتبری پیدا نشد.', errors }, { status: 400 });
    }
    await prisma.examQuestion.createMany({
      data: rows.map((r) => ({ ...r, createdById: user.id })),
    });
    return Response.json({ ok: true, created: rows.length, errors });
  }

  const text = String(body.text || '').trim();
  const options = normalizeOptions(body.options);
  const correct = Number(body.correct);

  if (!text) return Response.json({ ok: false, error: 'متن سؤال لازم است.' }, { status: 400 });
  if (!options) return Response.json({ ok: false, error: `باید دقیقاً ${OPTION_COUNT} گزینه وارد شود.` }, { status: 400 });
  if (!Number.isInteger(correct) || correct < 0 || correct >= OPTION_COUNT) {
    return Response.json({ ok: false, error: 'گزینهٔ درست را مشخص کنید.' }, { status: 400 });
  }

  const created = await prisma.examQuestion.create({
    data: {
      text: text.slice(0, 1000),
      options,
      correct,
      topic: body.topic ? String(body.topic).trim().slice(0, 80) : null,
      active: body.active !== false,
      createdById: user.id,
    },
  });
  return Response.json({ ok: true, item: serialize(created) });
}
