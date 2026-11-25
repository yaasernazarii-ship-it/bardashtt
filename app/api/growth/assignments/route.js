import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ok, fail, cleanPagination } from '@/lib/growthApi';

function serialize(a) {
  return {
    id: a.id, title: a.title, description: a.description,
    dueDate: a.dueDate ? a.dueDate.toISOString() : null, status: a.status,
    createdAt: a.createdAt.toISOString(),
    submissions: (a.submissions || []).map((s) => ({
      id: s.id, content: s.content, fileUrl: s.fileUrl, status: s.status,
      feedback: s.feedback, reviewedAt: s.reviewedAt ? s.reviewedAt.toISOString() : null,
      submittedAt: s.submittedAt.toISOString(),
    })),
  };
}

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);

  const { searchParams } = new URL(request.url);
  const { skip, take, page, pageSize } = cleanPagination(searchParams, { defaultPageSize: 20 });

  const where = { userId: user.id };
  const status = searchParams.get('status');
  if (status) where.status = status;

  const [assignments, total] = await Promise.all([
    prisma.assignment.findMany({
      where, orderBy: { createdAt: 'desc' }, skip, take,
      include: { submissions: { orderBy: { submittedAt: 'desc' } } },
    }),
    prisma.assignment.count({ where }),
  ]);

  return ok({ assignments: assignments.map(serialize), page, pageSize, total });
}
