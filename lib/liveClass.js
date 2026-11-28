// منطق مشترک «کلاس آنلاین زنده». نکتهٔ مهم: موتور پخش (فعلاً آپارات) فقط همین‌جا شناخته می‌شود؛
// پنل هنرجو/استاد فقط به liveStatus و embedSrcِ برگشتی از سرور کار دارند، نه به جزئیات آپارات.
// اگر در آینده موتور پخش عوض شود، فقط کافی است getLiveEmbedSrc تغییر کند.

export const LIVE_STATUS = { SCHEDULED: 'scheduled', LIVE: 'live', FINISHED: 'finished' };

// امبد ثابتِ کانال زندهٔ آپارات خانواده برداشت.
const APARAT_LIVE_EMBED = 'https://www.aparat.com/embed/live/BARDASHTT';

export function getLiveEmbedSrc() {
  return APARAT_LIVE_EMBED;
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
