import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';

// فهرست گفتگوهای پشتیبانی برای ادمین.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  const rows = await prisma.supportConversation.findMany({
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
    select: {
      id: true, visitorName: true, visitorPhone: true, status: true,
      adminUnread: true, lastMessageAt: true, createdAt: true,
    },
  });

  return Response.json({
    ok: true,
    conversations: rows.map((r) => ({
      ...r,
      lastMessageAt: r.lastMessageAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
