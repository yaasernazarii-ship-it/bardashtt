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

  let body;
  try {
    body = await request.json();
  } catch {
    return fail('درخواست نامعتبر است.', 400);
  }

  const content = cleanText(body.content, 5000);
  if (!content) return fail('متن نظر الزامی است.', 400);

  const comment = await prisma.studentProgressComment.create({
    data: { userId: id, createdById: user.id, content },
  });

  return ok({
    comment: {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
    },
  }, 201);
}
