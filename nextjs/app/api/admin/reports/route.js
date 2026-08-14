import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { notifyUsers } from '@/lib/notifications';
import { isLocked, recordFailure } from '@/lib/rateLimit';
import { CATEGORIES, LIMITS, cleanText, displayNameOf, otherManagerIds, serializeReport } from '@/lib/staffReports';

// تابلوی گزارش کار تیمی — فقط ادمین و ادیتور. هیچ مسیری در این پوشه نباید بدون این بررسی اجرا شود.
async function guard() {
  const user = await getSessionUser();
  if (!user) return { error: Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 }) };
  if (!isManager(user)) return { error: Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 }) };
  return { user };
}

export async function GET(request) {
  const { user, error } = await guard();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || '';
  const mine = searchParams.get('mine') === '1';
  const q = cleanText(searchParams.get('q'), 80);

  const where = {
    ...(status === 'open' || status === 'done' ? { status } : {}),
    ...(mine ? { authorId: user.id } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { body: { contains: q, mode: 'insensitive' } },
            { authorName: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const reports = await prisma.staffReport.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { comments: { orderBy: { createdAt: 'asc' } } },
  });

  return Response.json({
    ok: true,
    me: { id: user.id, name: displayNameOf(user), role: user.role },
    reports: reports.map((r) => serializeReport(r, user)),
  });
}

export async function POST(request) {
  const { user, error } = await guard();
  if (error) return error;

  // سدِ سادهٔ ضدِ ارسال انبوه (در سطح همین پردازش سرور).
  const rateKey = `staffReport:${user.id}`;
  if (isLocked(rateKey, { max: 30 })) {
    return Response.json({ ok: false, error: 'تعداد ثبت در چند دقیقهٔ اخیر زیاد بود. کمی بعد دوباره تلاش کنید.' }, { status: 429 });
  }

  let body = {};
  try { body = await request.json(); } catch { /* بدنهٔ نامعتبر */ }

  const title = cleanText(body.title, LIMITS.title);
  const text = cleanText(body.body, LIMITS.body);
  const category = Object.keys(CATEGORIES).includes(body.category) ? body.category : 'report';

  if (title.length < 3) return Response.json({ ok: false, error: 'عنوان گزارش را بنویسید (حداقل ۳ نویسه).' }, { status: 400 });
  if (!text) return Response.json({ ok: false, error: 'متن گزارش خالی است.' }, { status: 400 });

  recordFailure(rateKey, { max: 30 });
  const name = displayNameOf(user);

  const report = await prisma.staffReport.create({
    data: { authorId: user.id, authorName: name, authorRole: user.role, title, body: text, category },
    include: { comments: true },
  });

  await Promise.all([
    logAction(user, { action: 'staffReport.create', targetType: 'staffReport', targetId: report.id, summary: `ثبت گزارش کار: ${title}` }),
    notifyUsers(await otherManagerIds(user.id), {
      title: `گزارش کار تازه از ${name}`,
      body: title,
      href: '/dashboard/admin/reports',
      kind: 'system',
    }),
  ]);

  return Response.json({ ok: true, report: serializeReport(report, user) });
}

// علامت‌گذاری تابلو به‌عنوان دیده‌شده (مبنای شمارندهٔ خوانده‌نشده در خانهٔ مدیریت).
export async function PATCH() {
  const { user, error } = await guard();
  if (error) return error;
  await prisma.user.update({ where: { id: user.id }, data: { staffReportsSeenAt: new Date() } });
  return Response.json({ ok: true });
}
