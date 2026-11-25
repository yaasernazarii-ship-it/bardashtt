import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { ok, fail, cleanTitle, cleanText, cleanDate, cleanPagination } from '@/lib/growthApi';
import { ASSIGNMENT_STATUSES } from '@/lib/growthConfig';

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  if (!isManager(user)) return fail('دسترسی لازم را ندارید.', 403);

  const { searchParams } = new URL(request.url);
  const { skip, take, page, pageSize } = cleanPagination(searchParams, { defaultPageSize: 20 });

  const where = {};
  const userId = searchParams.get('userId');
  if (userId) where.userId = userId;
  const status = searchParams.get('status');
  if (ASSIGNMENT_STATUSES.includes(status)) where.status = status;

  const [assignments, total] = await Promise.all([
    prisma.assignment.findMany({
      where, orderBy: { createdAt: 'desc' }, skip, take,
      include: { submissions: { orderBy: { submittedAt: 'desc' }, take: 1 } },
    }),
    prisma.assignment.count({ where }),
  ]);

  const studentIds = [...new Set(assignments.map((a) => a.userId))];
  const students = studentIds.length
    ? await prisma.user.findMany({ where: { id: { in: studentIds } }, select: { id: true, displayName: true, phone: true } })
    : [];
  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  const list = assignments.map((a) => ({
    id: a.id, title: a.title, description: a.description,
    dueDate: a.dueDate ? a.dueDate.toISOString() : null, status: a.status,
    createdAt: a.createdAt.toISOString(),
    student: studentMap[a.userId] || null,
    latestSubmission: a.submissions[0]
      ? {
          id: a.submissions[0].id, status: a.submissions[0].status,
          submittedAt: a.submissions[0].submittedAt.toISOString(),
        }
      : null,
  }));

  return ok({ assignments: list, page, pageSize, total });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  if (!isManager(user)) return fail('دسترسی لازم را ندارید.', 403);

  let b;
  try { b = await request.json(); } catch { return fail('درخواست نامعتبر است.', 400); }

  const student = b.userId ? await prisma.user.findFirst({ where: { id: b.userId, role: 'student' } }) : null;
  if (!student) return fail('هنرجو یافت نشد.', 404);

  const title = cleanTitle(b.title);
  if (!title) return fail('عنوان تمرین الزامی است.', 400);

  const assignment = await prisma.assignment.create({
    data: {
      userId: student.id,
      createdById: user.id,
      title,
      description: cleanText(b.description),
      dueDate: cleanDate(b.dueDate),
    },
  });

  return ok({
    assignment: {
      id: assignment.id, title: assignment.title, description: assignment.description,
      dueDate: assignment.dueDate ? assignment.dueDate.toISOString() : null,
      status: assignment.status, createdAt: assignment.createdAt.toISOString(),
    },
  }, 201);
}
