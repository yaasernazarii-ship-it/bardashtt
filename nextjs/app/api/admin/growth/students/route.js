import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { ok, fail, cleanPositiveInt } from '@/lib/growthApi';
import { getActivityOverviewMap } from '@/lib/growth';

const STATUSES = ['active', 'needs_attention', 'inactive'];

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return fail('ابتدا وارد شوید.', 401);
  if (!isManager(user)) return fail('دسترسی لازم را ندارید.', 403);

  const { searchParams } = new URL(request.url);
  const name = (searchParams.get('name') || '').trim().slice(0, 200);
  const course = (searchParams.get('course') || '').trim().slice(0, 200);
  const classGroupId = (searchParams.get('classGroupId') || '').trim();
  const status = STATUSES.includes(searchParams.get('status')) ? searchParams.get('status') : null;
  const page = Math.max(1, cleanPositiveInt(searchParams.get('page'), 1));
  const pageSize = Math.min(100, Math.max(1, cleanPositiveInt(searchParams.get('pageSize'), 20)));

  const where = { role: 'student' };
  if (name) where.displayName = { contains: name, mode: 'insensitive' };
  if (course) where.courseTitle = { contains: course, mode: 'insensitive' };
  if (classGroupId) where.classGroupId = classGroupId;

  // برای فیلترِ status (که مشتق و محاسبه‌شده است، نه ستون DB) باید همهٔ هنرجوهای منطبق با فیلترهای دیگر
  // یکجا واکشی و Overview آن‌ها به‌صورت batched (بدون N+1) محاسبه شود، سپس صفحه‌بندی روی نتیجهٔ فیلترشده انجام می‌شود.
  const students = await prisma.user.findMany({
    where,
    select: {
      id: true, displayName: true, phone: true, courseTitle: true, photoUrl: true,
      classGroupId: true, classGroup: { select: { id: true, name: true } },
    },
    orderBy: { displayName: 'asc' },
  });

  const overview = await getActivityOverviewMap(students.map((s) => s.id));

  let list = students.map((s) => ({
    id: s.id, displayName: s.displayName, phone: s.phone, courseTitle: s.courseTitle,
    photoUrl: s.photoUrl, classGroup: s.classGroup,
    activityScore: overview[s.id]?.activityScore ?? 0,
    lastActivityAt: overview[s.id]?.lastActivityAt ? overview[s.id].lastActivityAt.toISOString() : null,
    status: overview[s.id]?.status ?? 'inactive',
  }));

  if (status) list = list.filter((s) => s.status === status);

  const total = list.length;
  const skip = (page - 1) * pageSize;
  const pageItems = list.slice(skip, skip + pageSize);

  return ok({ students: pageItems, page, pageSize, total });
}
