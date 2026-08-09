import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, phone: true, displayName: true, city: true, role: true, createdAt: true,
      username: true, passwordPlain: true, active: true, branch: true, graduated: true,
      photoUrl: true,
    },
  });

  return Response.json({
    ok: true,
    currentUserId: user.id,
    users: users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
  });
}
