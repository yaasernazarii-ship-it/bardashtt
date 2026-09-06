// آرشیو یک درخواست ثبت‌نامِ ردشده در «بله»، پیش از حذف کاملش از سایت و سرور.
// خطا را پرتاب می‌کند تا رکورد بدون آرشیو حذف نشود.
import { sendMessage, isBaleConfigured } from './bale.js';

const ROLE_FA = { student: 'هنرجو', filmmaker: 'فیلمساز' };

const fmtDate = (d) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'long' }).format(new Date(d));
  } catch {
    return String(d ?? '—');
  }
};

export async function archiveRejectedSignup(request, { rejectedBy = null } = {}) {
  if (!isBaleConfigured()) throw new Error('ربات بله تنظیم نشده است.');

  const text = [
    '✕ درخواست ثبت‌نام ردشده — اطلاعات از سایت و سرور حذف شد',
    `نام: ${request.firstName || ''} ${request.lastName || ''}`.trim(),
    `نقش: ${ROLE_FA[request.role] || request.role || '—'}`,
    request.phone ? `شماره تماس: ${request.phone}` : null,
    request.nationalId ? `کد ملی: ${request.nationalId}` : null,
    request.branch ? `شعبه: ${request.branch}` : null,
    request.birthDate ? `تاریخ تولد: ${request.birthDate}` : null,
    request.goal ? `هدف: ${request.goal}` : null,
    `تاریخ درخواست: ${fmtDate(request.createdAt)}`,
    request.adminNote ? `دلیل رد: ${request.adminNote}` : null,
    rejectedBy ? `ردکننده: ${rejectedBy}` : null,
    request.idCardImage ? 'عکس شناسنامه/کارت ملی همراه این درخواست از سرور حذف شد.' : null,
  ].filter(Boolean).join('\n');

  const res = await sendMessage(text);
  if (!res?.ok) throw new Error(res?.description || 'ارسال گزارش به بله انجام نشد.');
  return res;
}
