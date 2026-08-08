import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { OPTION_COUNT, normalizeOptions } from '@/lib/exam';

async function guard() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 }) };
  return { user };
}

export async function PATCH(request, { params }) {
  const { error } = await guard();
  if (error) return error;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const data = {};
  if (typeof body.text === 'string' && body.text.trim()) data.text = body.text.trim().slice(0, 1000);
  if (body.options !== undefined) {
    const options = normalizeOptions(body.options);
    if (!options) return Response.json({ ok: false, error: `باید دقیقاً ${OPTION_COUNT} گزینه وارد شود.` }, { status: 400 });
    data.options = options;
  }
  if (body.correct !== undefined) {
    const correct = Number(body.correct);
    if (!Number.isInteger(correct) || correct < 0 || correct >= OPTION_COUNT) {
      return Response.json({ ok: false, error: 'گزینهٔ درست نامعتبر است.' }, { status: 400 });
    }
    data.correct = correct;
  }
  if (body.topic !== undefined) data.topic = body.topic ? String(body.topic).trim().slice(0, 80) : null;
  if (typeof body.active === 'boolean') data.active = body.active;

  const updated = await prisma.examQuestion.update({ where: { id }, data });
  return Response.json({
    ok: true,
    item: {
      id: updated.id,
      text: updated.text,
      options: updated.options,
      correct: updated.correct,
      topic: updated.topic,
      active: updated.active,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}

export async function DELETE(_request, { params }) {
  const { error } = await guard();
  if (error) return error;

  const { id } = await params;
  // سوالی که در آزمون‌های برگزارشده استفاده شده حذف نمی‌شود تا کارنامه‌های قبلی معنا داشته باشند؛
  // به‌جایش غیرفعال می‌شود و دیگر در آزمون‌های جدید نمی‌آید.
  const used = await prisma.$queryRaw`
    SELECT 1 FROM "ExamAttempt" WHERE "questionIds" @> ${JSON.stringify([id])}::jsonb LIMIT 1
  `;
  if (Array.isArray(used) && used.length > 0) {
    await prisma.examQuestion.update({ where: { id }, data: { active: false } });
    return Response.json({ ok: true, deactivated: true });
  }

  await prisma.examQuestion.delete({ where: { id } });
  return Response.json({ ok: true, deleted: true });
}
