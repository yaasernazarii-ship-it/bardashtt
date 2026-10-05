import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, cleanText } from '@/lib/growthApi';
import { tehranDateKey } from '@/lib/growth';

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function resolveLogDate(input) {
  if (input && DATE_KEY_RE.test(String(input))) return String(input);
  return tehranDateKey(new Date());
}

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const habit = await prisma.habit.findFirst({ where: { id, userId: user.id } });
  if (!habit) return fail('عادت یافت نشد.', 404);

  let b = {};
  try { b = await request.json(); } catch { b = {}; }

  const logDate = resolveLogDate(b.logDate);

  try {
    const log = await prisma.habitLog.create({
      data: { habitId: habit.id, userId: user.id, logDate, note: cleanText(b.note) },
    });
    return ok({ log: { id: log.id, habitId: log.habitId, logDate: log.logDate, note: log.note } }, 201);
  } catch (e) {
    if (e && e.code === 'P2002') return fail('already_logged', 409);
    throw e;
  }
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const habit = await prisma.habit.findFirst({ where: { id, userId: user.id } });
  if (!habit) return fail('عادت یافت نشد.', 404);

  const { searchParams } = new URL(request.url);
  const logDate = resolveLogDate(searchParams.get('logDate'));

  const existing = await prisma.habitLog.findFirst({ where: { habitId: habit.id, logDate } });
  if (!existing) return fail('ثبتی برای این روز یافت نشد.', 404);

  await prisma.habitLog.delete({ where: { id: existing.id } });
  return ok({ deleted: true });
}
