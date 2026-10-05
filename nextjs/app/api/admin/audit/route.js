import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

export async function GET(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const take = Math.min(Math.max(parseInt(searchParams.get('take') || '100', 10) || 100, 1), 300);
  const action = searchParams.get('action') || '';

  const rows = await prisma.auditLog.findMany({
    where: action ? { action } : undefined,
    orderBy: { createdAt: 'desc' },
    take,
  });

  return Response.json({
    ok: true,
    logs: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  });
}
