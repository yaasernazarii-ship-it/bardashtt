import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { ok, fail, cleanText, cleanEnum } from '@/lib/growthApi';

const REVIEW_STATUSES = ['approved', 'needs_revision'];

export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  if (!isManager(user)) return fail('دسترسی لازم را ندارید.', 403);
  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { submissions: { orderBy: { submittedAt: 'desc' }, take: 1 } },
  });
  if (!assignment) return fail('تمرین یافت نشد.', 404);
  const latest = assignment.submissions[0];
  if (!latest) return fail('هنوز ارسالی برای این تمرین ثبت نشده است.', 404);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const status = cleanEnum(b.status, REVIEW_STATUSES, null);
  if (!status) return fail('وضعیتِ بررسی نامعتبر است.', 400);
  const feedback = cleanText(b.feedback, 5000);

  const now = new Date();
  const [submission] = await prisma.$transaction([
    prisma.assignmentSubmission.update({
      where: { id: latest.id },
      data: { status, feedback, reviewedById: user.id, reviewedAt: now },
    }),
    prisma.assignment.update({ where: { id: assignment.id }, data: { status } }),
  ]);

  return ok({
    submission: {
      id: submission.id, status: submission.status, feedback: submission.feedback,
      reviewedAt: submission.reviewedAt.toISOString(),
    },
  });
}
