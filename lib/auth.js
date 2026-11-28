import { cache } from 'react';
import { createHash, randomBytes } from 'crypto';
import { cookies, headers } from 'next/headers';
import { prisma } from './prisma';

export const SESSION_COOKIE = 'bsid';
export const SESSION_TTL_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isManager(user) {
  return !!user && (
    user.role === 'admin'
    || user.role === 'editor'
    || (user.role === 'staff' && user.active !== false && user.staffAccessEnabled === true)
  );
}

export function isPrimaryAdmin(user) {
  return !!user && user.role === 'admin' && user.isPrimaryAdmin === true;
}

export function hashSessionToken(token) {
  return createHash('sha256').update(String(token || ''), 'utf8').digest('hex');
}

// دسترسی به بانک بازیگران و ثبت درخواست ست‌تایم: فقط فیلمساز و ادمین/ادیتور؛ هنرجو و عضو عادی مجاز نیستند.
export function isFilmmakerOrManager(user) {
  return !!user && (user.role === 'filmmaker' || isManager(user));
}

// دامنه‌ی کوکی را طوری تعیین می‌کنیم که نشست بین bardashtt.com و www.bardashtt.com مشترک باشد؛
// در محیط توسعه (localhost/IP) کوکی host-only می‌ماند.
export function cookieDomainForHost(host) {
  if (!host) return undefined;
  const name = String(host).split(':')[0];
  if (name === 'bardashtt.com' || name.endsWith('.bardashtt.com')) return '.bardashtt.com';
  return undefined;
}

// ارقام فارسی (۰-۹) و عربی (٠-٩) را به ارقام لاتین تبدیل می‌کند.
// بدون این تبدیل، شماره‌ای که با کیبورد فارسی تایپ شود کاملاً حذف می‌شد و «شماره نامعتبر» می‌گرفت.
export function toLatinDigits(input) {
  return String(input || '').replace(/[۰-۹٠-٩]/g, (ch) => {
    const code = ch.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

export function normalizePhone(input) {
  const digits = toLatinDigits(input).replace(/[^\d]/g, '');
  if (/^09\d{9}$/.test(digits)) return digits;
  if (/^9\d{9}$/.test(digits)) return '0' + digits;
  if (/^989\d{9}$/.test(digits)) return '0' + digits.slice(2);
  return null;
}

export async function createSession(userId, { remember = true } = {}) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * DAY_MS);
  const requestHeaders = await headers();
  const userAgent = String(requestHeaders.get('user-agent') || '').slice(0, 500) || null;
  const ipAddress = String(requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || '')
    .split(',')[0].trim().slice(0, 64) || null;
  await prisma.session.create({ data: { tokenHash, userId, expiresAt, userAgent, ipAddress } });

  const store = await cookies();
  const domain = cookieDomainForHost(requestHeaders.get('host'));
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

// در طول یک درخواست فقط یک‌بار اجرا می‌شود؛ صفحه و سایدبارِ پنل هر دو کاربر را لازم دارند
// و بدون cache هر بار یک کوئری نشست تکرار می‌شد.
export const getSessionUser = cache(async function getSessionUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  // حساب غیرفعال‌شده توسط مدیر نباید دسترسی داشته باشد.
  if (session.user && session.user.active === false) return null;

  // نشست کشویی: با هر بازدید کاربر، انقضای نشست تمدید می‌شود تا کاربران فعال هرگز خارج نشوند.
  // برای جلوگیری از نوشتن مکرر، فقط اگر بیش از یک روز از آخرین تمدید گذشته باشد به‌روزرسانی می‌کنیم.
  const target = new Date(Date.now() + SESSION_TTL_DAYS * DAY_MS);
  if (target.getTime() - session.expiresAt.getTime() > DAY_MS) {
    try {
      await prisma.session.update({ where: { tokenHash }, data: { expiresAt: target, lastSeenAt: new Date() } });
    } catch { /* تمدید نشست حیاتی نیست */ }
  }
  return session.user;
});

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
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
