import { getSessionUser } from '@/lib/auth';
import { isFullManager } from '@/lib/staffPermissions';
import { loadContent } from '@/lib/siteContent';
import DashboardNav from './DashboardNav';

// عنوانِ زیرِ نام کاربر در سایدبار — همان چیزی که کاربر خودش را با آن می‌شناسد.
function subtitleFor(user) {
  if (!user) return '';
  if (user.role === 'admin') return 'مدیر سامانه';
  if (user.role === 'editor') return 'ادیتور';
  if (user.role === 'staff') return user.staffTitle || 'همکار بخش';
  if (user.role === 'filmmaker') return user.company || 'فیلم‌ساز';
  if (user.role === 'student') {
    if (user.graduated) return user.courseTitle ? `فارغ‌التحصیل ${user.courseTitle}` : 'فارغ‌التحصیل';
    return user.courseTitle ? `هنرجوی ${user.courseTitle}` : 'هنرجو';
  }
  return 'کاربر';
}

// این کامپوننت عمداً سروری است تا بتواند نام/عکس کاربر و شمارهٔ پشتیبانی را
// خودش بخواند؛ به این ترتیب هیچ‌کدام از صفحه‌های پنل لازم نیست پراپ اضافه بدهند
// و سایدبار در همهٔ صفحه‌ها یک‌شکل می‌ماند. بخش تعاملی در DashboardNav است.
export default async function DashboardSidebar(props) {
  const [user, t] = await Promise.all([getSessionUser(), loadContent()]);

  const profile = user
    ? {
        name: user.displayName || user.username || 'کاربر',
        subtitle: subtitleFor(user),
        photoUrl: user.photoUrl || null,
      }
    : null;

  return (
    <DashboardNav
      {...props}
      isPrimaryAdmin={user?.isPrimaryAdmin === true}
      profile={profile}
      supportPhone={t('nav.support.phoneHref')}
      supportPhoneText={t('nav.support.phoneText')}
    />
  );
}
