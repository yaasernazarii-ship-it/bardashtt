import { getSessionUser } from '@/lib/auth';
import { markAllRead } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });
  await markAllRead(user.id);
  return Response.json({ ok: true });
}
