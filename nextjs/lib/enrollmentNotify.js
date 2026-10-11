// ساخت PDF یک ثبت‌نام و ارسال آنی آن به «بله».
// عمداً هیچ خطایی را به بالادست پرتاب نمی‌کند تا مسیر ثبت‌نام کاربر مختل نشود.
import { buildEnrollmentPdf } from './registrationPdf.js';
import { sendDocument, isBaleConfigured } from './bale.js';

function pdfName(prefix, fullName) {
  const safe = String(fullName || 'enrollment').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40);
  return `${prefix}-${safe}.pdf`;
}

export async function notifyEnrollment(enrollment) {
  try {
    if (!isBaleConfigured()) return;
    const pdf = await buildEnrollmentPdf(enrollment);
    const isFilmmaker = enrollment.courseKey === '05';
    const caption = [
      isFilmmaker ? '★ ثبت‌نام «فیلمسازی»' : 'ثبت‌نام جدید',
      `نام: ${enrollment.fullName}`,
      `دوره: ${enrollment.courseTitle}`,
      `موبایل: ${enrollment.phone}`,
    ].join('\n');
    await sendDocument(pdf, pdfName('enrollment', enrollment.fullName), caption);
  } catch (err) {
    console.error('notifyEnrollment failed:', err?.message || err);
  }
}

// آرشیو نهاییِ یک ثبت‌نامِ ردشده در «بله»: گزارش کوتاه + PDF کاملِ مراحل ثبت‌نام و پاسخ‌های تست.
// برخلاف notifyEnrollment این تابع خطا را پرتاب می‌کند؛ چون تا وقتی آرشیو تحویل نشده
// نباید رکورد از سایت و سرور حذف شود.
export async function archiveRejectedEnrollment(enrollment, { rejectedBy = null } = {}) {
  if (!isBaleConfigured()) throw new Error('ربات بله تنظیم نشده است.');

  const pdf = await buildEnrollmentPdf({ ...enrollment, status: 'rejected' }, {
    title: 'خانواده برداشت — آرشیو ثبت‌نام ردشده',
    notice: 'این درخواست رد شد و اطلاعاتش از سایت و سرور حذف شده است؛ این فایل تنها نسخهٔ باقی‌مانده است.',
  });

  const caption = [
    '✕ ثبت‌نام ردشده — اطلاعات از سایت و سرور حذف شد',
    `نام: ${enrollment.fullName}`,
    `موبایل: ${enrollment.phone}`,
    enrollment.nationalId ? `کد ملی: ${enrollment.nationalId}` : null,
    `دوره: ${enrollment.courseTitle}`,
    enrollment.actorType ? `تیپ بازیگری: ${enrollment.actorType}` : null,
    enrollment.adminNote ? `دلیل رد: ${enrollment.adminNote}` : null,
    rejectedBy ? `ردکننده: ${rejectedBy}` : null,
  ].filter(Boolean).join('\n');

  const res = await sendDocument(pdf, pdfName('rejected', enrollment.fullName), caption);
  if (!res?.ok) throw new Error(res?.description || 'ارسال آرشیو به بله انجام نشد.');
  return res;
}
