import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { canAccessPath, isScopedStaff } from '@/lib/staffPermissions';

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
// دسترسی همکار محدود در مرز درخواست کنترل می‌شود؛ بنابراین پنهان‌کردن منو تنها سد امنیتی نیست.
export async function proxy(req, event) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = createHash('sha256').update(token, 'utf8').digest('hex');
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      select: {
        expiresAt: true,
        user: {
          select: {
            id: true, role: true, active: true, displayName: true, username: true, phone: true,
            staffAccessEnabled: true, staffPermissions: true,
          },
        },
      },
    });
    const user = session?.expiresAt > new Date() ? session.user : null;
    if (isScopedStaff(user) && !canAccessPath(user, req.nextUrl.pathname)) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return Response.json({ ok: false, error: 'برای این بخش دسترسی ندارید.' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard?access=denied', req.url));
    }

    if (isScopedStaff(user) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      event.waitUntil(prisma.auditLog.create({
        data: {
          actorId: user.id,
          actorName: user.displayName || user.username || user.phone || null,
          actorRole: 'staff',
          action: 'staff.request',
          targetType: 'route',
          targetId: req.nextUrl.pathname.slice(0, 200),
          summary: `${req.method} ${req.nextUrl.pathname}`.slice(0, 500),
        },
      }).catch(() => {}));
    }
  }

  const res = NextResponse.next();
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
