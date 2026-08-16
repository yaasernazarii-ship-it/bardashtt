import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAction } from '@/lib/audit';

// بازگشاییِ جلسهٔ پایان‌یافته — عمداً فقط مدیر سیستم (role === 'admin')، نه ادیتور،
// تا استاد نتواند به‌صورت تصادفی کلاسِ تمام‌شده را دوباره باز کند.
export async function POST(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ ok: false, error: 'فقط مدیر سیستم می‌تواند جلسهٔ پایان‌یافته را بازگشایی کند.' }, { status: 403 });

  const { id } = await params;
  const session = await prisma.classSession.findUnique({
    where: { id },
    include: { group: { select: { name: true } } },
  });
  if (!session) return Response.json({ ok: false, error: 'جلسه یافت نشد.' }, { status: 404 });

  if (session.liveStatus !== 'finished') {
    return Response.json({ ok: false, error: 'فقط جلسهٔ پایان‌یافته قابل بازگشایی است.' }, { status: 409 });
  }

  const updated = await prisma.classSession.update({ where: { id }, data: { liveStatus: 'scheduled' } });

  await logAction(user, {
    action: 'liveSession.reopen',
    targetType: 'classSession',
    targetId: id,
    summary: `بازگشایی کلاس آنلاین «${session.title}» — ${session.group.name}`,
  });

  return Response.json({ ok: true, session: updated });
}
