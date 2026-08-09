import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { isImageUrl } from '@/lib/uploadUrl';

export async function GET() {
  const user = await getSessionUser();
  const items = await prisma.galleryItem.findMany({ orderBy: { createdAt: 'desc' } });
  return Response.json({
    ok: true,
    canManage: isManager(user),
    items: items.map((i) => ({ id: i.id, imageUrl: i.imageUrl, caption: i.caption })),
  });
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  try {
    const body = await request.json();
    const imageUrl = String(body.imageUrl || '').trim().slice(0, 500);
    if (!isImageUrl(imageUrl)) {
      return Response.json({ ok: false, error: 'نشانی تصویر معتبر نیست.' }, { status: 400 });
    }
    const caption = body.caption ? String(body.caption).trim().slice(0, 160) : null;
    const item = await prisma.galleryItem.create({ data: { imageUrl, caption, createdById: user.id } });
    return Response.json({ ok: true, item: { id: item.id, imageUrl: item.imageUrl, caption: item.caption } });
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
}
