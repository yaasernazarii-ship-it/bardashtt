import { normalizeEmbedUrl } from '@/lib/embed';

// منطق مشترک «کلاس آنلاین زنده». نشانی هر جلسه در پنل مدیریت ثبت می‌شود و
// پنل هنرجو/استاد فقط نشانیِ پاک‌سازی‌شدهٔ برگشتی از سرور را دریافت می‌کند.

export const LIVE_STATUS = { SCHEDULED: 'scheduled', LIVE: 'live', FINISHED: 'finished' };

// برای جلسه‌های قدیمی که پیش از قابل‌تنظیم‌شدن سرویس ساخته شده‌اند، پخش فعلی حفظ می‌شود.
const LEGACY_LIVE_EMBED = 'https://www.aparat.com/embed/live/BARDASHTT';

export function getLiveEmbedSrc(liveUrl) {
  return normalizeEmbedUrl(liveUrl || LEGACY_LIVE_EMBED);
}

// آیا این کاربر مجاز به دیدنِ پخش زندهٔ همین جلسه است؟
// شرط‌ها دقیقاً روی سرور اجرا می‌شوند؛ هیچ تصمیمی به فرانت‌اند سپرده نمی‌شود.
export function canAccessLiveSession(user, session) {
  if (!user || !session) return false;
  if (user.role !== 'student') return false;
  if (user.graduated) return false;
  if (!user.classGroupId || user.classGroupId !== session.groupId) return false;
  return true;
}
