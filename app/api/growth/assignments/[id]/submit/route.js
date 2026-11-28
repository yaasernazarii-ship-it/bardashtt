import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, cleanText } from '@/lib/growthApi';

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  const { id } = await params;

  const assignment = await prisma.assignment.findFirst({ where: { id, userId: user.id } });
  if (!assignment) return fail('تمرین یافت نشد.', 404);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const content = cleanText(b.content, 20000);
  const fileUrl = cleanText(b.fileUrl, 1000);
  if (!content && !fileUrl) return fail('متن یا فایل ارسال الزامی است.', 400);

  const submission = await prisma.$transaction(async (tx) => {
    const s = await tx.assignmentSubmission.create({
      data: { assignmentId: assignment.id, userId: user.id, content, fileUrl, status: 'submitted' },
    });
    await tx.assignment.update({ where: { id: assignment.id }, data: { status: 'submitted' } });
    return s;
  });

  return ok({
    submission: {
      id: submission.id, content: submission.content, fileUrl: submission.fileUrl,
      status: submission.status, submittedAt: submission.submittedAt.toISOString(),
    },
  }, 201);
}
