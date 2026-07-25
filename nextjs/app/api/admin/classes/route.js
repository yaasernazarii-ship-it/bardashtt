import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

const BRANCHES = ['تهران', 'ساری'];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const groups = await prisma.classGroup.findMany({
    orderBy: [{ branch: 'asc' }, { createdAt: 'asc' }],
    include: {
      members: { select: { id: true, displayName: true, phone: true, username: true } },
      _count: { select: { sessions: true } },
    },
  });

  // فارغ‌التحصیل‌ها در انتخاب اسامیِ تقویم نمی‌آیند.
  const students = await prisma.user.findMany({
    where: { role: 'student', graduated: false },
    select: { id: true, displayName: true, phone: true, username: true, branch: true, classGroupId: true, progressOverride: true },
    orderBy: { createdAt: 'desc' },
  });

  return Response.json({ ok: true, groups, students });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  try {
    const b = await request.json();
    const name = String(b.name || '').trim().slice(0, 80);
    const branch = BRANCHES.includes(b.branch) ? b.branch : null;
    const courseTitle = String(b.courseTitle || '').trim().slice(0, 120) || null;
    if (!name) return Response.json({ ok: false, error: 'نام کلاس الزامی است.' }, { status: 400 });
    if (!branch) return Response.json({ ok: false, error: 'شعبه را انتخاب کنید (تهران یا ساری).' }, { status: 400 });

    // تعداد کل جلسات این دوره (پیش‌فرض ۸ جلسه)؛ مبنای محاسبه‌ی درصد پیشرفت هنرجویان این کلاس است.
    let totalSessions = 8;
    if (b.totalSessions !== undefined && b.totalSessions !== '') {
      const n = parseInt(b.totalSessions, 10);
      if (Number.isNaN(n) || n < 1 || n > 100) return Response.json({ ok: false, error: 'تعداد جلسات باید بین ۱ تا ۱۰۰ باشد.' }, { status: 400 });
      totalSessions = n;
    }

    const group = await prisma.classGroup.create({ data: { name, branch, courseTitle, totalSessions } });
    return Response.json({ ok: true, group });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
