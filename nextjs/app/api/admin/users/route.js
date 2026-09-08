import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const archived = new URL(request.url).searchParams.get('archived') === '1';
  const users = await prisma.user.findMany({
    where: archived ? { deletedAt: { not: null } } : { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, phone: true, displayName: true, city: true, role: true, createdAt: true,
      username: true, passwordPlain: true, active: true, branch: true, graduated: true,
      photoUrl: true, gender: true, nationalId: true, courseTitle: true, deletedAt: true,
      resume: { select: { id: true, isPublic: true } },
    },
  });

  return Response.json({
    ok: true,
    currentUserId: user.id,
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      deletedAt: u.deletedAt?.toISOString() || null,
    })),
  });
}
