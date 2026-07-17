// ساخت PDF یک ثبت‌نام و ارسال آنی آن به «بله».
// عمداً هیچ خطایی را به بالادست پرتاب نمی‌کند تا مسیر ثبت‌نام کاربر مختل نشود.
import { buildEnrollmentPdf } from './registrationPdf';
import { sendDocument, isBaleConfigured } from './bale';

export async function notifyEnrollment(enrollment) {
  try {
    if (!isBaleConfigured()) return;
    const pdf = await buildEnrollmentPdf(enrollment);
    const isFilmmaker = enrollment.courseKey === '05';
    const safeName = String(enrollment.fullName || 'enrollment').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40);
    const filename = `enrollment-${safeName}.pdf`;
    const caption = [
      isFilmmaker ? '★ ثبت‌نام «فیلمسازی»' : 'ثبت‌نام جدید',
      `نام: ${enrollment.fullName}`,
      `دوره: ${enrollment.courseTitle}`,
      `موبایل: ${enrollment.phone}`,
    ].join('\n');
    await sendDocument(pdf, filename, caption);
  } catch (err) {
    console.error('notifyEnrollment failed:', err?.message || err);
  }
}
