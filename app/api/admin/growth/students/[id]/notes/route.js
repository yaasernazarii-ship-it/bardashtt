import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { ok, fail, cleanText } from '@/lib/growthApi';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  if (!isManager(user)) return fail('دسترسی لازم را ندارید.', 403);
  const { id } = await params;

  const student = await prisma.user.findFirst({ where: { id, role: 'student' } });
  if (!student) return fail('هنرجو یافت نشد.', 404);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const content = cleanText(b.content, 5000);
  if (!content) return fail('متن یادداشت الزامی است.', 400);

  const note = await prisma.mentorNote.create({
    data: { userId: id, createdById: user.id, content },
  });

  return ok({ note: { id: note.id, content: note.content, createdAt: note.createdAt.toISOString() } }, 201);
}
