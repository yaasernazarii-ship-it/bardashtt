import { prisma } from '@/lib/prisma';
import { getSessionUser, isPrimaryAdmin } from '@/lib/auth';

export async function DELETE(_request, { params }) {
  const actor = await getSessionUser();
  if (!actor) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isPrimaryAdmin(actor)) return Response.json({ ok: false, error: 'فقط مدیر اصلی دسترسی دارد.' }, { status: 403 });

  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id },
    select: { id: true, user: { select: { id: true, displayName: true, username: true, phone: true } } },
  });
  if (!session) return Response.json({ ok: false, error: 'نشست پیدا نشد.' }, { status: 404 });

  const targetName = session.user.displayName || session.user.username || session.user.phone;
  await prisma.$transaction([
    prisma.session.delete({ where: { id: session.id } }),
    prisma.auditLog.create({ data: {
      actorId: actor.id,
      actorName: actor.displayName || actor.username || actor.phone,
      actorRole: actor.role,
      action: 'session.revoke',
      targetType: 'session',
      targetId: session.id,
      summary: `ابطال نشست فعال ${targetName}`,
    } }),
  ]);

  return Response.json({ ok: true });
}
