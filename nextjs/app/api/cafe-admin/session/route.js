import { cookies, headers } from 'next/headers';
import { isLocked, recordFailure, clearAttempts } from '@/lib/rateLimit';
import { CAFE_COOKIE, cafeAuthConfigured, checkCafePassword, issueCafeToken } from '@/lib/cafeAuth';

export const runtime = 'nodejs';

async function clientKey() {
  const store = await headers();
  const ip = (store.get('x-forwarded-for') || '').split(',')[0].trim() || store.get('x-real-ip') || 'unknown';
  return `cafe-admin:${ip}`;
}

export async function POST(request) {
  if (!cafeAuthConfigured()) return Response.json({ ok: false, error: 'رمز پنل کافه روی سرور تنظیم نشده است.' }, { status: 503 });

  const key = await clientKey();
  if (isLocked(key)) return Response.json({ ok: false, error: 'تلاش‌های ناموفق زیاد بود. چند دقیقه بعد دوباره امتحان کنید.' }, { status: 429 });

  const body = await request.json().catch(() => ({}));
  if (!checkCafePassword(body.password)) {
    recordFailure(key);
    return Response.json({ ok: false, error: 'رمز عبور درست نیست.' }, { status: 401 });
  }

  clearAttempts(key);
  const { token, expiresAt } = issueCafeToken();
  (await cookies()).set(CAFE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
  return Response.json({ ok: true });
}

export async function DELETE() {
  (await cookies()).set(CAFE_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: new Date(0) });
  return Response.json({ ok: true });
}
