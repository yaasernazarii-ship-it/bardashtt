// گزارش درخواست‌های ثبت‌نامِ حساب کاربری در «بله».
import { sendMessage, isBaleConfigured } from './bale.js';

const ROLE_FA = { student: 'هنرجو', filmmaker: 'فیلمساز' };

const fmtDate = (d) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'long' }).format(new Date(d));
  } catch {
    return String(d ?? '—');
  }
};

// خطوط مشترکِ اطلاعات یک درخواست، برای هر دو گزارشِ «جدید» و «ردشده».
function details(request, { idCardUrl = null } = {}) {
  return [
    `نام: ${`${request.firstName || ''} ${request.lastName || ''}`.trim() || '—'}`,
    `نقش: ${ROLE_FA[request.role] || request.role || '—'}`,
    request.phone ? `شماره تماس: ${request.phone}` : null,
    request.nationalId ? `کد ملی: ${request.nationalId}` : null,
    request.branch ? `شعبه: ${request.branch}` : null,
    request.birthDate ? `تاریخ تولد: ${request.birthDate}` : null,
    request.goal ? `هدف: ${request.goal}` : null,
    `تاریخ درخواست: ${fmtDate(request.createdAt)}`,
    idCardUrl ? `عکس شناسنامه/کارت ملی: ${idCardUrl}` : null,
  ].filter(Boolean);
}

// گزارش آنیِ هر درخواست ثبت‌نام تازه.
// عمداً خطا را بالا نمی‌دهد تا مسیر ثبت‌نام کاربر مختل نشود.
export async function notifySignup(request, { idCardUrl = null } = {}) {
  try {
    if (!isBaleConfigured()) return;
    await sendMessage(['درخواست ثبت‌نام جدید', ...details(request, { idCardUrl })].join('\n'));
  } catch (err) {
    console.error('notifySignup failed:', err?.message || err);
  }
}

// آرشیو یک درخواست ثبت‌نامِ ردشده، پیش از حذف کاملش از سایت و سرور.
// خطا را پرتاب می‌کند تا رکورد بدون آرشیو حذف نشود.
export async function archiveRejectedSignup(request, { rejectedBy = null } = {}) {
  if (!isBaleConfigured()) throw new Error('ربات بله تنظیم نشده است.');

  const text = [
    '✕ درخواست ثبت‌نام ردشده — اطلاعات از سایت و سرور حذف شد',
    ...details(request),
    request.adminNote ? `دلیل رد: ${request.adminNote}` : null,
    rejectedBy ? `ردکننده: ${rejectedBy}` : null,
    request.idCardImage ? 'عکس شناسنامه/کارت ملی همراه این درخواست از سرور حذف شد.' : null,
  ].filter(Boolean).join('\n');

  const res = await sendMessage(text);
  if (!res?.ok) throw new Error(res?.description || 'ارسال گزارش به بله انجام نشد.');
  return res;
}
