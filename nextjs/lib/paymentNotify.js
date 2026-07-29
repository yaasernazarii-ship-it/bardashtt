// گزارشِ آنیِ پرداخت به پیام‌رسان «بله» (متن، سریع‌ترین حالت).
// عمداً خطا را به بالادست پرتاب نمی‌کند تا مسیر پرداخت مختل نشود.
import { sendMessage, isBaleConfigured } from './bale';

const money = (n) => Number(n || 0).toLocaleString('fa-IR');

export async function notifyPayment(payment, student) {
  try {
    if (!isBaleConfigured()) return;
    const lines = [
      '💰 پرداخت جدید ثبت شد',
      `هنرجو: ${student?.displayName || student?.phone || '—'}`,
      payment.courseTitle ? `دوره: ${payment.courseTitle}` : null,
      `بابت: ${payment.title}`,
      `مبلغ: ${money(payment.amount)} تومان`,
      `روش: ${payment.method === 'online' ? 'آنلاین' : 'ثبت دستیِ مدیر'}`,
    ].filter(Boolean);
    await sendMessage(lines.join('\n'));
  } catch (err) {
    console.error('notifyPayment failed:', err?.message || err);
  }
}
