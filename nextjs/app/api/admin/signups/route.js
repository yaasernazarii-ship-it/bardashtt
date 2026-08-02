import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const rows = await prisma.signupRequest.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  // نام کاربری و رمزِ صادرشده را از حسابِ ساخته‌شده می‌آوریم تا در همان بخش ماندگار بماند.
  const accountIds = [...new Set(rows.map((r) => r.userId).filter(Boolean))];
  const accounts = accountIds.length
    ? await prisma.user.findMany({ where: { id: { in: accountIds } }, select: { id: true, username: true, passwordPlain: true } })
    : [];
  const byId = Object.fromEntries(accounts.map((a) => [a.id, a]));

  return Response.json({
    ok: true,
    requests: rows.map((r) => ({
      id: r.id,
      role: r.role,
      firstName: r.firstName,
      lastName: r.lastName,
      phone: r.phone,
      nationalId: r.nationalId,
      branch: r.branch,
      birthDate: r.birthDate,
      idCardImage: r.idCardImage,
      goal: r.goal,
      status: r.status,
      username: r.username || (r.userId ? byId[r.userId]?.username : null) || null,
      password: r.userId ? (byId[r.userId]?.passwordPlain || null) : null,
      adminNote: r.adminNote,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
