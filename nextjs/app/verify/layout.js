// توجه: canonical واقعیِ این مسیر از app/verify/page.js (pageMetadata('verify')) می‌آید
// و بر اساس دامنهٔ همان درخواست ساخته می‌شود؛ اینجا عمداً canonical ثابتی تعریف نمی‌شود.
export const metadata = {
  title: 'استعلام گواهینامه',
  description: 'تأیید صحت گواهی فارغ‌التحصیلی خانواده برداشت با وارد کردن کد گواهینامه.',
};

export default function VerifyLayout({ children }) {
  return children;
}
