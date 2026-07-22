import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const rows = await prisma.signupRequest.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

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
      username: r.username,
      adminNote: r.adminNote,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
