import { prisma } from '@/lib/prisma';
import { siteUrl } from '@/lib/siteUrl';

const LLMS_CONTENT = `# خانواده برداشت

خانواده برداشت یک آموزشگاه رایگان بازیگری سینما در ایران است که از سال ۱۳۹۷ فعالیت می‌کند. این مجموعه دوره‌های حضوری و غیرحضوری بازیگری را برای کودکان، نوجوانان و بزرگسالان ارائه می‌دهد.

## صفحات مهم

- صفحه اصلی: https://www.bardashtt.com/
- دوره‌های حضوری بازیگری: https://www.bardashtt.com/courses
- یادگیری آنلاین: https://www.bardashtt.com/online-learning
- ثبت‌نام رایگان: https://www.bardashtt.com/register
- بانک بازیگران: https://www.bardashtt.com/actors
- مجله برداشت: https://www.bardashtt.com/blog
- سؤالات متداول: https://www.bardashtt.com/faq
- استعلام گواهینامه: https://www.bardashtt.com/verify
- دربارهٔ ما: https://www.bardashtt.com/about

## موضوعات اصلی

- آموزش بازیگری سینما
- دوره‌های مقدماتی، تکمیلی و پیشرفته بازیگری
- آموزش آنلاین بازیگری
- فیلم‌سازی و تجربهٔ عملی تولید فیلم
- بانک رزومه بازیگران
- ثبت‌نام و مسیر رشد هنرجویان

## زبان و دسترسی

زبان اصلی سایت فارسی است. صفحات عمومی برای خزش موتورهای جست‌وجو در دسترس‌اند؛ صفحات حساب کاربری، پنل مدیریت و APIها عمومی نیستند.
`;


export async function GET(request, { params }) {
  const { groupLink } = await params;
  if (groupLink === 'llms' || groupLink === 'llms.txt') {
    return new Response(LLMS_CONTENT, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  const baseUrl = await siteUrl();
  if (!/^c[a-z0-9]{24}$/.test(groupLink)) {
    return Response.redirect(new URL('/dashboard', baseUrl), 307);
  }

  const [chatGroup, classGroup] = await Promise.all([
    prisma.chatGroup.findUnique({ where: { id: groupLink }, select: { id: true } }),
    prisma.classGroup.findUnique({ where: { id: groupLink }, select: { id: true } }),
  ]);

  if (chatGroup) {
    return Response.redirect(new URL(`/dashboard/groups?g=${encodeURIComponent(groupLink)}`, baseUrl), 307);
  }
  if (classGroup) {
    return Response.redirect(new URL(`/dashboard/schedule?g=${encodeURIComponent(groupLink)}`, baseUrl), 307);
  }
  return Response.redirect(new URL('/dashboard', baseUrl), 307);
}
