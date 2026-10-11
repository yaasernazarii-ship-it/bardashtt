import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

export async function DELETE(request, { params }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.galleryItem.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: 'تصویر یافت نشد.' }, { status: 404 });
  }
}
