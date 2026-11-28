// توجه: canonical واقعیِ این مسیر از app/audition/page.js (pageMetadata('audition')) می‌آید
// و بر اساس دامنهٔ همان درخواست ساخته می‌شود؛ اینجا عمداً canonical ثابتی تعریف نمی‌شود.
export const metadata = {
  title: 'تست آنلاین بازیگری',
  description: 'در تست آنلاین بازیگری خانواده برداشت شرکت کنید و مسیر مناسب دوره خود را پیدا کنید؛ کاملاً رایگان.',
};

export default function AuditionLayout({ children }) {
  return children;
}
