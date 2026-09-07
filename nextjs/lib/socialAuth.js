import { randomBytes } from 'crypto';
import { cookies, headers } from 'next/headers';
import { prisma } from './prisma';
import { cookieDomainForHost, getSessionUser, hashSessionToken, isManager } from './auth';

export const SOCIAL_COOKIE = 'bg_sid';
export const OFFICIAL_SOCIAL_USERNAME = 'bardasht';
const OFFICIAL_SOCIAL_PHONE = '__official_bardasht__';
const TTL_MS = 60 * 24 * 60 * 60 * 1000;

// مدیر و ادیتور هر دو با یک هویت رسمی منتشر می‌کنند؛ حساب برداشت نشست و شمارهٔ ورود عمومی ندارد.
export async function officialSocialAccount() {
  return prisma.socialAccount.upsert({
    where: { phone: OFFICIAL_SOCIAL_PHONE },
    update: {
      username: OFFICIAL_SOCIAL_USERNAME,
      displayName: 'خانواده برداشت',
      photoUrl: '/icon.png',
      bio: 'صفحهٔ رسمی خانواده برداشت',
      active: true,
      blocked: false,
    },
    create: {
      phone: OFFICIAL_SOCIAL_PHONE,
      username: OFFICIAL_SOCIAL_USERNAME,
      displayName: 'خانواده برداشت',
      photoUrl: '/icon.png',
      bio: 'صفحهٔ رسمی خانواده برداشت',
    },
  });
}

export async function getSocialIdentity() {
  const manager = await getSessionUser();
  if (isManager(manager)) {
    const account = await officialSocialAccount();
    return { manager, account, id: account.id, canModerate: true };
  }

  const token = (await cookies()).get(SOCIAL_COOKIE)?.value;
  if (!token) return { manager: null, account: null, id: null, canModerate: false };
  const session = await prisma.socialSession.findUnique({ where: { tokenHash: hashSessionToken(token) }, include: { account: true } });
  if (!session || session.expiresAt < new Date() || !session.account.active) {
    return { manager: null, account: null, id: null, canModerate: false };
  }
  return { manager: null, account: session.account, id: session.account.id, canModerate: false };
}

export async function createSocialSession(accountId) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TTL_MS);
  await prisma.socialSession.create({ data: { tokenHash: hashSessionToken(token), accountId, expiresAt } });
  const domain = cookieDomainForHost((await headers()).get('host'));
  (await cookies()).set(SOCIAL_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
    ...(domain ? { domain } : {}),
  });
}

export async function destroySocialSession() {
  const store = await cookies();
  const token = store.get(SOCIAL_COOKIE)?.value;
  if (token) await prisma.socialSession.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  const domain = cookieDomainForHost((await headers()).get('host'));
  store.set(SOCIAL_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: new Date(0), ...(domain ? { domain } : {}) });
}
