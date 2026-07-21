import { randomBytes } from 'crypto';
import { cookies, headers } from 'next/headers';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'bsid';
export const SESSION_TTL_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isManager(user) {
  return !!user && (user.role === 'admin' || user.role === 'editor');
}

// دامنه‌ی کوکی را طوری تعیین می‌کنیم که نشست بین bardashtt.com و www.bardashtt.com مشترک باشد؛
// در محیط توسعه (localhost/IP) کوکی host-only می‌ماند.
export function cookieDomainForHost(host) {
  if (!host) return undefined;
  const name = String(host).split(':')[0];
  if (name === 'bardashtt.com' || name.endsWith('.bardashtt.com')) return '.bardashtt.com';
  return undefined;
}

export function normalizePhone(input) {
  const digits = String(input || '').replace(/[^\d]/g, '');
  if (/^09\d{9}$/.test(digits)) return digits;
  if (/^9\d{9}$/.test(digits)) return '0' + digits;
  if (/^989\d{9}$/.test(digits)) return '0' + digits.slice(2);
  return null;
}

export async function createSession(userId, { remember = true } = {}) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * DAY_MS);
  await prisma.session.create({ data: { token, userId, expiresAt } });

  const store = await cookies();
  const domain = cookieDomainForHost((await headers()).get('host'));
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(domain ? { domain } : {}),
    // «مرا به خاطر بسپار»: کوکی ماندگار؛ در غیر این صورت کوکی موقتِ نشست (با بستن مرورگر پاک می‌شود).
    ...(remember ? { expires: expiresAt } : {}),
  });
  return token;
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;

  // نشست کشویی: با هر بازدید کاربر، انقضای نشست تمدید می‌شود تا کاربران فعال هرگز خارج نشوند.
  // برای جلوگیری از نوشتن مکرر، فقط اگر بیش از یک روز از آخرین تمدید گذشته باشد به‌روزرسانی می‌کنیم.
  const target = new Date(Date.now() + SESSION_TTL_DAYS * DAY_MS);
  if (target.getTime() - session.expiresAt.getTime() > DAY_MS) {
    try {
      await prisma.session.update({ where: { token }, data: { expiresAt: target } });
    } catch { /* تمدید نشست حیاتی نیست */ }
  }
  return session.user;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    const domain = cookieDomainForHost((await headers()).get('host'));
    // پاک‌کردن هر دو نسخه‌ی کوکی (دامنه‌مشترک و host-only) برای خروج کامل.
    store.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      ...(domain ? { domain } : {}),
      expires: new Date(0),
    });
    store.delete(SESSION_COOKIE);
  }
}
