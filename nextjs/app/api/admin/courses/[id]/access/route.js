import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager, normalizePhone } from '@/lib/auth';
import { grantCourseAccess } from '@/lib/onlineCourses';

async function guard() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

function serializeAccess(a) {
  return {
    id: a.id,
    userId: a.userId,
    source: a.source,
    createdAt: a.createdAt.toISOString(),
    user: a.user ? { id: a.user.id, displayName: a.user.displayName, phone: a.user.phone, username: a.user.username } : null,
  };
}

// فهرست کاربرانی که به این دوره دسترسی دارند.
export async function GET(request, { params }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await params;
  const rows = await prisma.courseAccess.findMany({
    where: { courseId: id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, displayName: true, phone: true, username: true } } },
  });
  return Response.json({ ok: true, accesses: rows.map(serializeAccess) });
}

// اعطای دستیِ دسترسی به یک کاربر با شمارهٔ موبایل یا نام کاربری.
export async function POST(request, { params }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await params;

  try {
    const b = await request.json();
    const identifier = String(b.identifier || '').trim();
    if (!identifier) return Response.json({ ok: false, error: 'شمارهٔ موبایل یا نام کاربری را وارد کنید.' }, { status: 400 });

    const course = await prisma.course.findUnique({ where: { id }, select: { id: true } });
    if (!course) return Response.json({ ok: false, error: 'دوره یافت نشد.' }, { status: 404 });

    const phone = normalizePhone(identifier);
    const target = await prisma.user.findFirst({
      where: phone ? { phone } : { username: identifier },
      select: { id: true, displayName: true, phone: true, username: true },
    });
    if (!target) return Response.json({ ok: false, error: 'کاربری با این مشخصات پیدا نشد.' }, { status: 404 });

    await grantCourseAccess(target.id, id, { source: 'manual', grantedById: g.user.id });
    const row = await prisma.courseAccess.findUnique({
      where: { userId_courseId: { userId: target.id, courseId: id } },
      include: { user: { select: { id: true, displayName: true, phone: true, username: true } } },
    });
    return Response.json({ ok: true, access: serializeAccess(row) });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}

// لغو دسترسیِ یک کاربر.
export async function DELETE(request, { params }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await params;
  try {
    const b = await request.json();
    const userId = String(b.userId || '').trim();
    if (!userId) return Response.json({ ok: false, error: 'کاربر مشخص نشده است.' }, { status: 400 });
    await prisma.courseAccess.deleteMany({ where: { courseId: id, userId } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
