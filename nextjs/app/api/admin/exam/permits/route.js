import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { notifyUsers } from '@/lib/notifications';
import { CLASS_SCORE_MAX, parseClassScore } from '@/lib/exam';

const USER_FIELDS ={ id: true, displayName: true, username: true, phone: true, role: true, branch: true, courseTitle: true, graduated: true };

function shape(p) {
  return {
    id: p.id,
    user: p.user,
    grantedByName: p.grantedByName,
    grantedAt: p.grantedAt.toISOString(),
    expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
    usedAt: p.usedAt ? p.usedAt.toISOString() : null,
    revoked: p.revoked,
    note: p.note,
    classScore: p.classScore,
  };
}

// فهرست اجازه‌های صادرشده، به‌همراه هنرجویانی که می‌توان به آن‌ها اجازه داد.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  const [permits, students, passedRows] = await Promise.all([
    prisma.examPermit.findMany({
      orderBy: { grantedAt: 'desc' },
      take: 300,
      include: { user: { select: USER_FIELDS } },
    }),
    prisma.user.findMany({
      where: { role: { in: ['student', 'admin', 'editor'] }, active: true },
      orderBy: { createdAt: 'desc' },
      select: USER_FIELDS,
    }),
    prisma.examAttempt.findMany({ where: { passed: true }, select: { userId: true }, distinct: ['userId'] }),
  ]);

  const passedIds = passedRows.map((r) => r.userId);

  return Response.json({
    ok: true,
    items: permits.map(shape),
    students,
    passedUserIds: passedIds,
  });
}

// صدور اجازهٔ آزمون برای یک هنرجو.
export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const userId = String(body.userId || '');
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { ...USER_FIELDS, active: true } });
  if (!target) return Response.json({ ok: false, error: 'کاربر یافت نشد.' }, { status: 404 });
  if (!target.active) return Response.json({ ok: false, error: 'این حساب غیرفعال است.' }, { status: 400 });

  const now = new Date();

  // اجازهٔ استفاده‌نشدهٔ تکراری صادر نمی‌کنیم تا هنرجو دو بار آزمون نگیرد.
  const existing = await prisma.examPermit.findFirst({
    where: { userId, revoked: false, usedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
  });
  if (existing) return Response.json({ ok: false, error: 'این هنرجو از قبل اجازهٔ استفاده‌نشده دارد.' }, { status: 409 });

  const passed = await prisma.examAttempt.findFirst({ where: { userId, passed: true } });
  if (passed) return Response.json({ ok: false, error: 'این هنرجو قبلاً در آزمون قبول شده است.' }, { status: 409 });

  // نمرهٔ کلاسی باید همین‌جا — یعنی پیش از شروع آزمون — ثبت شود و بعداً به نمرهٔ آزمون اضافه می‌شود.
  const classScore = parseClassScore(body.classScore);
  if (classScore === null) {
    return Response.json({
      ok: false,
      error: `نمرهٔ تکلیف کلاسی الزامی است و باید عددی صحیح بین ۰ تا ${CLASS_SCORE_MAX} باشد.`,
    }, { status: 400 });
  }

  // مهلت استفاده از اجازه، بر حسب روز. خالی یعنی بدون مهلت.
  let expiresAt = null;
  if (body.days !== undefined && body.days !== null && body.days !== '') {
    const days = Number(body.days);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return Response.json({ ok: false, error: 'مهلت اجازه باید عددی بین ۱ تا ۳۶۵ روز باشد.' }, { status: 400 });
    }
    expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  const permit = await prisma.examPermit.create({
    data: {
      userId,
      grantedById: user.id,
      grantedByName: user.displayName || user.username || user.phone || null,
      expiresAt,
      classScore,
      note: body.note ? String(body.note).slice(0, 200) : null,
    },
    include: { user: { select: USER_FIELDS } },
  });

  const who = target.displayName || target.username || target.phone;
  await logAction(user, {
    action: 'exam.permit.grant',
    targetType: 'user',
    targetId: userId,
    summary: `اجازهٔ آزمون برای ${who} با نمرهٔ کلاسی ${classScore} از ${CLASS_SCORE_MAX}${expiresAt ? ` تا ${expiresAt.toISOString().slice(0, 10)}` : ''}`,
  });
  await notifyUsers([userId], {
    title: 'اجازهٔ شرکت در آزمون صادر شد',
    body: `نمرهٔ تکلیف کلاسی شما ${classScore} از ${CLASS_SCORE_MAX} ثبت شد. می‌توانید از بخش «آزمون و گواهی‌نامه» آزمون پایان دوره را شروع کنید.`,
    href: '/dashboard/exam',
    kind: 'system',
  });

  return Response.json({ ok: true, item: shape(permit) });
}

// اصلاح نمرهٔ کلاسی یا باطل‌کردن یک اجازهٔ استفاده‌نشده.
// پس از شروع آزمون هیچ‌کدام ممکن نیست؛ نمرهٔ کلاسی همان لحظه در تلاش کپی شده است.
export async function PATCH(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }

  const id = String(body.id || '');
  const permit = await prisma.examPermit.findUnique({ where: { id }, include: { user: { select: USER_FIELDS } } });
  if (!permit) return Response.json({ ok: false, error: 'اجازه یافت نشد.' }, { status: 404 });
  if (permit.usedAt) {
    return Response.json({ ok: false, error: 'آزمون این اجازه برگزار شده است؛ دیگر نه قابل باطل‌کردن است و نه نمرهٔ کلاسی‌اش تغییر می‌کند.' }, { status: 409 });
  }

  const who = permit.user?.displayName || permit.user?.username || permit.user?.phone;

  // اصلاح نمرهٔ کلاسی، تا وقتی هنرجو آزمون را شروع نکرده است.
  if (body.classScore !== undefined) {
    if (permit.revoked) {
      return Response.json({ ok: false, error: 'این اجازه باطل شده است؛ برای ثبت نمرهٔ تازه اجازهٔ جدید صادر کنید.' }, { status: 409 });
    }
    const classScore = parseClassScore(body.classScore);
    if (classScore === null) {
      return Response.json({
        ok: false,
        error: `نمرهٔ تکلیف کلاسی باید عددی صحیح بین ۰ تا ${CLASS_SCORE_MAX} باشد.`,
      }, { status: 400 });
    }
    const scored = await prisma.examPermit.update({
      where: { id },
      data: { classScore },
      include: { user: { select: USER_FIELDS } },
    });
    await logAction(user, {
      action: 'exam.permit.score',
      targetType: 'user',
      targetId: permit.userId,
      summary: `نمرهٔ کلاسی ${who} از ${permit.classScore ?? '—'} به ${classScore} تغییر کرد`,
    });
    return Response.json({ ok: true, item: shape(scored) });
  }

  const updated = await prisma.examPermit.update({
    where: { id },
    data: { revoked: true },
    include: { user: { select: USER_FIELDS } },
  });

  await logAction(user, {
    action: 'exam.permit.revoke',
    targetType: 'user',
    targetId: permit.userId,
    summary: `اجازهٔ آزمون ${who} باطل شد`,
  });

  return Response.json({ ok: true, item: shape(updated) });
}
