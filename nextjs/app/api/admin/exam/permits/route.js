import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { notifyUsers } from '@/lib/notifications';
import { CLASS_SCORE_MAX, formatScore, parseClassScore } from '@/lib/exam';

const SCORE_RULE = `باید عددی بین ۰ تا ${CLASS_SCORE_MAX} با حداکثر یک رقم اعشار باشد (مثل ۱۸٫۵).`;

// سقف بازه یک سال است تا اشتباهِ تایپی، اجازه‌ای عملاً همیشگی نسازد.
const MAX_WINDOW_HOURS = 8760;

const USER_FIELDS ={ id: true, displayName: true, username: true, phone: true, role: true, branch: true, courseTitle: true, graduated: true };

const whenFmt = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Tehran',
});
const when = (d) => whenFmt.format(d);

function shape(p) {
  return {
    id: p.id,
    user: p.user,
    grantedByName: p.grantedByName,
    grantedAt: p.grantedAt.toISOString(),
    startsAt: p.startsAt ? p.startsAt.toISOString() : null,
    expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
    usedAt: p.usedAt ? p.usedAt.toISOString() : null,
    revoked: p.revoked,
    note: p.note,
    classScore: p.classScore,
  };
}

// بازهٔ باز بودن صفحهٔ آزمون: از زمان شروعِ دلخواه، به مدت چند ساعت.
// هر دو اختیاری‌اند: بدون زمان شروع یعنی «از همین حالا» و بدون مدت یعنی «بدون محدودیت».
// این بازه هیچ ربطی به مهلت خود آزمون ندارد؛ آزمونِ شروع‌شده تا پایان ادامه می‌یابد.
function parseWindow(body, now) {
  let startsAt = null;
  if (body.startsAt !== undefined && body.startsAt !== null && body.startsAt !== '') {
    const d = new Date(body.startsAt);
    if (Number.isNaN(d.getTime())) return { error: 'زمان شروع بازه نامعتبر است.' };
    startsAt = d;
  }

  let expiresAt = null;
  if (body.hours !== undefined && body.hours !== null && body.hours !== '') {
    const hours = Number(body.hours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > MAX_WINDOW_HOURS) {
      return { error: `مدت باز بودن آزمون باید عددی بیشتر از صفر و حداکثر ${MAX_WINDOW_HOURS} ساعت باشد.` };
    }
    // به دقیقهٔ کامل گرد می‌شود تا بازه‌های اعشاری (مثل ۱٫۵ ساعت) هم دقیق بمانند.
    const minutes = Math.round(hours * 60);
    if (minutes < 1) return { error: 'مدت باز بودن آزمون باید دست‌کم یک دقیقه باشد.' };
    expiresAt = new Date((startsAt || now).getTime() + minutes * 60000);
  }

  if (expiresAt && expiresAt <= now) {
    return { error: 'بازه‌ای که انتخاب کرده‌اید تمام شده است؛ زمان شروع یا مدت را اصلاح کنید.' };
  }

  return { startsAt, expiresAt };
}

// شرح بازه برای پیام اعلان و گزارش عملیات.
function describeWindow(startsAt, expiresAt) {
  if (startsAt && expiresAt) return `از ${when(startsAt)} تا ${when(expiresAt)}`;
  if (startsAt) return `از ${when(startsAt)} به بعد، بدون محدودیت پایان`;
  if (expiresAt) return `از هم‌اکنون تا ${when(expiresAt)}`;
  return 'بدون محدودیت زمانی';
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

  const userIds = Array.isArray(body.userIds) ? [...new Set(body.userIds.map((id) => String(id)).filter(Boolean))] : [];
  if (userIds.length > 0) {
    if (userIds.length > 300) return Response.json({ ok: false, error: 'در هر نوبت حداکثر ۳۰۰ نفر را انتخاب کنید.' }, { status: 400 });

    const now = new Date();
    const window = parseWindow(body, now);
    if (window.error) return Response.json({ ok: false, error: window.error }, { status: 400 });
    const scores = body.scores && typeof body.scores === 'object' ? body.scores : {};
    const targets = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { ...USER_FIELDS, active: true } });
    if (targets.length !== userIds.length) return Response.json({ ok: false, error: 'یک یا چند حساب انتخاب‌شده پیدا نشد.' }, { status: 404 });
    if (targets.some((target) => !target.active)) return Response.json({ ok: false, error: 'همهٔ حساب‌های انتخاب‌شده فعال نیستند.' }, { status: 400 });

    const scoredTargets = targets.map((target) => ({ target, classScore: parseClassScore(scores[target.id]) }));
    if (scoredTargets.some(({ classScore }) => classScore === null)) {
      return Response.json({ ok: false, error: `برای همهٔ افراد انتخاب‌شده نمرهٔ معتبر لازم است؛ ${SCORE_RULE}` }, { status: 400 });
    }

    const [passedRows, existingRows] = await Promise.all([
      prisma.examAttempt.findMany({ where: { userId: { in: userIds }, passed: true }, select: { userId: true } }),
      prisma.examPermit.findMany({
        where: { userId: { in: userIds }, revoked: false, usedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        select: { userId: true },
      }),
    ]);
    const passed = new Set(passedRows.map((row) => row.userId));
    const existing = new Set(existingRows.map((row) => row.userId));
    const eligible = scoredTargets.filter(({ target }) => !passed.has(target.id) && !existing.has(target.id));
    if (eligible.length === 0) return Response.json({ ok: false, error: 'برای افراد انتخاب‌شده اجازهٔ تازه‌ای قابل صدور نیست؛ یا قبلاً اجازه دارند یا قبول شده‌اند.' }, { status: 409 });

    const created = await prisma.$transaction(async (tx) => Promise.all(eligible.map(({ target, classScore }) => tx.examPermit.create({
      data: {
        userId: target.id,
        grantedById: user.id,
        grantedByName: user.displayName || user.username || user.phone || null,
        startsAt: window.startsAt,
        expiresAt: window.expiresAt,
        classScore,
        note: body.note ? String(body.note).slice(0, 200) : null,
      },
      include: { user: { select: USER_FIELDS } },
    }))));

    const windowText = describeWindow(window.startsAt, window.expiresAt);
    await logAction(user, {
      action: 'exam.permit.grant.bulk',
      targetType: 'users',
      targetId: eligible.map(({ target }) => target.id).join(','),
      summary: `اجازهٔ آزمون برای ${eligible.length} نفر با بازهٔ ${windowText} صادر شد`,
    });
    await Promise.all(created.map((permit) => notifyUsers([permit.userId], {
      title: 'اجازهٔ شرکت در آزمون صادر شد',
      body: `نمرهٔ تکلیف کلاسی شما ${formatScore(permit.classScore)} از ${CLASS_SCORE_MAX} ثبت شد. ${
        window.startsAt && window.startsAt > now ? `صفحهٔ آزمون ${windowText} برای شما باز است.` : 'می‌توانید آزمون پایان دوره را شروع کنید.'
      } از بخش «آزمون و گواهی‌نامه» وارد شوید.`,
      href: '/dashboard/exam',
      kind: 'system',
    })));

    return Response.json({ ok: true, items: created.map(shape), skipped: userIds.length - eligible.length });
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
      error: `نمرهٔ تکلیف کلاسی الزامی است و ${SCORE_RULE}`,
    }, { status: 400 });
  }

  // بازهٔ باز بودن صفحهٔ آزمون؛ خارج از آن، هنرجو نمی‌تواند آزمون را شروع کند.
  const window = parseWindow(body, now);
  if (window.error) return Response.json({ ok: false, error: window.error }, { status: 400 });
  const { startsAt, expiresAt } = window;

  const permit = await prisma.examPermit.create({
    data: {
      userId,
      grantedById: user.id,
      grantedByName: user.displayName || user.username || user.phone || null,
      startsAt,
      expiresAt,
      classScore,
      note: body.note ? String(body.note).slice(0, 200) : null,
    },
    include: { user: { select: USER_FIELDS } },
  });

  const who = target.displayName || target.username || target.phone;
  const windowText = describeWindow(startsAt, expiresAt);
  await logAction(user, {
    action: 'exam.permit.grant',
    targetType: 'user',
    targetId: userId,
    summary: `اجازهٔ آزمون برای ${who} با نمرهٔ کلاسی ${formatScore(classScore)} از ${CLASS_SCORE_MAX} — ${windowText}`,
  });
  await notifyUsers([userId], {
    title: 'اجازهٔ شرکت در آزمون صادر شد',
    body: `نمرهٔ تکلیف کلاسی شما ${formatScore(classScore)} از ${CLASS_SCORE_MAX} ثبت شد. ${
      startsAt && startsAt > now
        ? `صفحهٔ آزمون ${windowText} برای شما باز است.`
        : `${expiresAt ? `تا ${when(expiresAt)} فرصت دارید آزمون را شروع کنید.` : 'می‌توانید آزمون پایان دوره را شروع کنید.'}`
    } از بخش «آزمون و گواهی‌نامه» وارد شوید.`,
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
        error: `نمرهٔ تکلیف کلاسی ${SCORE_RULE}`,
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
      summary: `نمرهٔ کلاسی ${who} از ${permit.classScore === null ? '—' : formatScore(permit.classScore)} به ${formatScore(classScore)} تغییر کرد`,
    });
    return Response.json({ ok: true, item: shape(scored) });
  }

  // جابه‌جایی بازهٔ باز بودن آزمون، تا وقتی هنرجو آن را شروع نکرده است.
  if (body.startsAt !== undefined || body.hours !== undefined) {
    if (permit.revoked) {
      return Response.json({ ok: false, error: 'این اجازه باطل شده است؛ برای بازهٔ تازه اجازهٔ جدید صادر کنید.' }, { status: 409 });
    }
    const now = new Date();
    const window = parseWindow(body, now);
    if (window.error) return Response.json({ ok: false, error: window.error }, { status: 400 });

    const moved = await prisma.examPermit.update({
      where: { id },
      data: { startsAt: window.startsAt, expiresAt: window.expiresAt },
      include: { user: { select: USER_FIELDS } },
    });
    const windowText = describeWindow(window.startsAt, window.expiresAt);
    await logAction(user, {
      action: 'exam.permit.window',
      targetType: 'user',
      targetId: permit.userId,
      summary: `بازهٔ آزمون ${who} تغییر کرد — ${windowText}`,
    });
    await notifyUsers([permit.userId], {
      title: 'زمان آزمون شما تغییر کرد',
      body: `صفحهٔ آزمون پایان دوره ${windowText} برای شما باز است.`,
      href: '/dashboard/exam',
      kind: 'system',
    });
    return Response.json({ ok: true, item: shape(moved) });
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
