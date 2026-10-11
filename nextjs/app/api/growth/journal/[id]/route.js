import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, cleanText, cleanEnum } from '@/lib/growthApi';
import { JOURNAL_VISIBILITIES } from '@/lib/growthConfig';

function serialize(e) {
  return {
    id: e.id, content: e.content, visibility: e.visibility,
    createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString(),
  };
}

export async function PATCH(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const existing = await prisma.journalEntry.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail('یادداشت یافت نشد.', 404);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const data = {};
  if ('content' in b) {
    const content = cleanText(b.content, 20000);
    if (!content) return fail('متن یادداشت نمی‌تواند خالی باشد.', 400);
    data.content = content;
  }
  if ('visibility' in b) data.visibility = cleanEnum(b.visibility, JOURNAL_VISIBILITIES, existing.visibility);

  const entry = await prisma.journalEntry.update({ where: { id }, data });
  return ok({ entry: serialize(entry) });
}

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const existing = await prisma.journalEntry.findFirst({ where: { id, userId: user.id } });
  if (!existing) return fail('یادداشت یافت نشد.', 404);

  await prisma.journalEntry.delete({ where: { id } });
  return ok({ deleted: true });
}
