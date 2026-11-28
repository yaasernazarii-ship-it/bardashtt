import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'bsid';
const TTL_MS = 60 * 24 * 60 * 60 * 1000;

function cookieDomainForHost(host) {
  if (!host) return undefined;
  const name = String(host).split(':')[0];
  if (name === 'bardashtt.com' || name.endsWith('.bardashtt.com')) return '.bardashtt.com';
  return undefined;
}

// با هر بازدید، کوکیِ نشست را با انقضای تازه و دامنه‌ی مشترک (apex + www) دوباره صادر می‌کنیم.
// این کار باعث می‌شود کاربران فعال هرگز به‌صورت ناخواسته خارج نشوند و کوکی‌های host-only قدیمی
// به‌تدریج به نسخه‌ی دامنه‌مشترک مهاجرت کنند؛ بدون نیاز به ورود دوباره.
export function proxy(req) {
  const res = NextResponse.next();
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const domain = cookieDomainForHost(req.headers.get('host'));
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      ...(domain ? { domain } : {}),
      expires: new Date(Date.now() + TTL_MS),
    });
  }
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|txt|xml|json|woff|woff2|ttf|map)$).*)',
  ],
};
