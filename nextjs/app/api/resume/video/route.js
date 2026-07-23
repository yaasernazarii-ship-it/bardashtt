import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// هنرجو فقط می‌تواند «ویدیوی معرفی» خودش را روی رزومه‌اش بگذارد؛
// هیچ فیلد دیگری از رزومه از این مسیر قابل تغییر نیست.
export async function PUT(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });

  try {
    const body = await request.json();
    const raw = typeof body.selfVideoUrl === 'string' ? body.selfVideoUrl.trim().slice(0, 500) : '';
    const selfVideoUrl = raw || null;

    const existing = await prisma.actorResume.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!existing) {
      // اگر هنوز رزومه‌ای ساخته نشده، یک رزومه‌ی پایه با نام هنرجو ایجاد می‌شود تا ویدیو ذخیره شود.
      await prisma.actorResume.create({
        data: { userId: user.id, fullName: user.displayName || 'هنرجو', selfVideoUrl },
      });
    } else {
      await prisma.actorResume.update({ where: { userId: user.id }, data: { selfVideoUrl } });
    }

    return Response.json({ ok: true, selfVideoUrl });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
