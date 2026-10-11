import { prisma } from '@/lib/prisma';
import { getSessionUser, isPrimaryAdmin } from '@/lib/auth';

export async function GET() {
  const actor = await getSessionUser();
  if (!actor) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isPrimaryAdmin(actor)) return Response.json({ ok: false, error: 'فقط مدیر اصلی دسترسی دارد.' }, { status: 403 });

  const sessions = await prisma.session.findMany({
    where: { expiresAt: { gt: new Date() } },
    select: {
      id: true,
      createdAt: true,
      lastSeenAt: true,
      expiresAt: true,
      userAgent: true,
      ipAddress: true,
      user: { select: { id: true, displayName: true, username: true, phone: true, role: true } },
    },
    orderBy: { lastSeenAt: 'desc' },
  });

  return Response.json({ ok: true, sessions });
}
