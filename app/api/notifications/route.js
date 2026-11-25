import { getSessionUser } from '@/lib/auth';
import { listNotifications } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  // برای کاربرِ واردنشده خطا نمی‌دهیم؛ زنگ اعلان خودش را پنهان می‌کند.
  if (!user) return Response.json({ ok: false, unread: 0, items: [] });

  const { items, unread } = await listNotifications(user, { take: 30 });
  return Response.json({
    ok: true,
    unread,
    items: items.map((n) => ({
      id: n.id, title: n.title, body: n.body, href: n.href, kind: n.kind,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}
