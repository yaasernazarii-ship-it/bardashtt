import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { getSessionUser, isManager } from './auth';

// دسترسی پنل کافه مستقل از حساب‌های سایت است: یک رمز اختصاصی در متغیرهای محیطی سرور
// و یک کوکی امضاشده. هیچ جدول یا حساب کاربری تازه‌ای لازم نیست.
export const CAFE_COOKIE = 'cafe_admin';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_PASSWORD = 8;

function sign(value) {
  return createHmac('sha256', process.env.CAFE_ADMIN_SECRET || '').update(value).digest('hex');
}

function sameValue(a, b) {
  const left = createHash('sha256').update(String(a)).digest();
  const right = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(left, right);
}

export function cafeAuthConfigured() {
  return (process.env.CAFE_ADMIN_SECRET || '').length >= 16 && (process.env.CAFE_ADMIN_PASSWORD || '').length >= MIN_PASSWORD;
}

export function checkCafePassword(input) {
  return cafeAuthConfigured() && typeof input === 'string' && sameValue(input, process.env.CAFE_ADMIN_PASSWORD);
}

export function issueCafeToken() {
  const expiresAt = Date.now() + TTL_MS;
  return { token: `${expiresAt}.${sign(String(expiresAt))}`, expiresAt: new Date(expiresAt) };
}

function validToken(token) {
  if (!token || !cafeAuthConfigured()) return false;
  const [expiresAt, signature] = String(token).split('.');
  if (!/^\d+$/.test(expiresAt || '') || !/^[a-f0-9]{64}$/.test(signature || '')) return false;
  if (Number(expiresAt) < Date.now()) return false;
  return sameValue(signature, sign(expiresAt));
}

// ورود با رمز اختصاصی کافه
export async function hasCafeCookie() {
  return validToken((await cookies()).get(CAFE_COOKIE)?.value);
}

// مدیران سایت هم برای پشتیبانی و جلوگیری از قفل‌شدن پنل دسترسی دارند.
export async function hasCafeAccess() {
  if (await hasCafeCookie()) return true;
  return isManager(await getSessionUser());
}
