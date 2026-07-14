import SimplePage from '@/components/SimplePage';

export const metadata = { title: 'آزمون فارغ‌التحصیلی', description: 'آزمون و مسیر دریافت گواهینامه خانواده برداشت.' };

const steps = [
  ['ارزیابی حضور و تمرین', 'بررسی استمرار، مشارکت و اجرای تمرین‌های دوره'],
  ['آزمون عملی', 'اجرای صحنه، بیان، بدن و تحلیل نقش مقابل تیم آموزشی'],
  ['جمع‌بندی نهایی', 'ثبت نتیجه، دریافت بازخورد و صدور گواهینامه برای افراد پذیرفته‌شده'],
];

export default function CertificatePage() {
  return (
    <SimplePage title="آزمون فارغ‌التحصیلی" subtitle="ارزیابی نهایی و دریافت گواهینامه" tag="گواهینامه">
      <div className="split-layout">
        <div className="stack-card">
          <h2 className="subheading" style={{ marginBottom: 12 }}>مسیر دریافت گواهینامه</h2>
          <p className="body-lg">پس از گذراندن مراحل آموزشی، هنرجو وارد ارزیابی نهایی می‌شود. این ارزیابی فقط یک امتحان تئوری نیست؛ عملکرد واقعی هنرجو در تمرین، اجرا و حضور گروهی بررسی می‌شود.</p>
        </div>
        <div className="stack-card stack-card--dark">
          <span className="tag tag--gold">نتیجه نهایی</span>
          <p style={{ marginTop: 14, lineHeight: 1.9 }}>هنرجویان موفق، گواهینامه رسمی مسیر آموزشی خود را دریافت می‌کنند و برای مراحل بعدی معرفی و آماده‌سازی می‌شوند.</p>
        </div>
      </div>
      <div className="responsive-grid-3" style={{ marginTop: 22 }}>
        {steps.map(([title, text], index) => (
          <div key={title} className="content-card">
            <div className="content-card__icon">{index + 1}</div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </SimplePage>
  );
}
