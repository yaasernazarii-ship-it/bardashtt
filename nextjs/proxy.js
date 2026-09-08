import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { embedOrigin } from '@/lib/embed';

const SESSION_COOKIE = 'bsid';
const TTL_MS = 60 * 24 * 60 * 60 * 1000;

function cookieDomainForHost(host) {
  if (!host) return undefined;
  const name = String(host).split(':')[0];
  if (name === 'bardashtt.com' || name.endsWith('.bardashtt.com')) return '.bardashtt.com';
  return undefined;
}

async function framePolicyForPath(req) {
  const pathname = req.nextUrl.pathname;
  if (req.method !== 'GET' || req.headers.get('rsc') === '1' || pathname.startsWith('/api/')) return null;

  const includeCourses = pathname === '/online-learning' || pathname.startsWith('/online-learning/') || pathname.startsWith('/dashboard');
  const includeLiveClasses = pathname.startsWith('/dashboard');
  if (!includeCourses && !includeLiveClasses) return null;

  const origins = new Set(['https://www.aparat.com']);
  const [courses, sessions] = await Promise.all([
    includeCourses
      ? prisma.course.findMany({ select: { teaserUrl: true, lessons: { select: { videoUrl: true } } } })
      : [],
    includeLiveClasses
      ? prisma.classSession.findMany({ select: { liveUrl: true, recordingUrl: true } })
      : [],
  ]);

  for (const course of courses) {
    const teaserOrigin = embedOrigin(course.teaserUrl);
    if (teaserOrigin) origins.add(teaserOrigin);
    for (const lesson of course.lessons) {
      const lessonOrigin = embedOrigin(lesson.videoUrl);
      if (lessonOrigin) origins.add(lessonOrigin);
    }
  }
  for (const session of sessions) {
    const liveOrigin = embedOrigin(session.liveUrl);
    const recordingOrigin = embedOrigin(session.recordingUrl);
    if (liveOrigin) origins.add(liveOrigin);
    if (recordingOrigin) origins.add(recordingOrigin);
  }

  return `frame-src 'self' ${[...origins].sort().join(' ')}; object-src 'none'; base-uri 'self'`;
}

// با هر بازدید، کوکیِ نشست را با انقضای تازه و دامنه‌ی مشترک (apex + www) دوباره صادر می‌کنیم.
// این کار باعث می‌شود کاربران فعال هرگز به‌صورت ناخواسته خارج نشوند و کوکی‌های host-only قدیمی
// به‌تدریج به نسخه‌ی دامنه‌مشترک مهاجرت کنند؛ بدون نیاز به ورود دوباره.
export async function proxy(req) {
  const res = NextResponse.next();
  const framePolicy = await framePolicyForPath(req);
  if (framePolicy) res.headers.set('Content-Security-Policy', framePolicy);
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
