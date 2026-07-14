import SimplePage from '@/components/SimplePage';

export const metadata = { title: 'یادگیری آنلاین', description: 'منابع آنلاین آموزشی خانواده برداشت برای تمرین بازیگری در خانه.' };

const lessons = [
  ['تمرین بیان', 'تمرین‌های روزانه برای وضوح صدا، ریتم و کنترل نفس'],
  ['تمرین بدن', 'آمادگی بدنی، حضور صحنه و هماهنگی حرکت'],
  ['تحلیل متن', 'خواندن درست دیالوگ، شناخت کنش و ساخت شخصیت'],
  ['تمرین مقابل دوربین', 'آشنایی با قاب، نگاه، سکوت و بازی مینیمال'],
];

export default function OnlineLearningPage() {
  return (
    <SimplePage title="یادگیری آنلاین" subtitle="منابع آموزشی برای تمرین در خانه" tag="آموزش آنلاین">
      <div className="stack-card" style={{ marginBottom: 22 }}>
        <h2 className="subheading" style={{ marginBottom: 12 }}>تمرین‌های مکمل برای رشد مستمر</h2>
        <p className="body-lg">در این بخش آموزش‌های آنلاین، تمرین‌های بیان، بدن و تحلیل متن برای هنرجویان منتشر می‌شود تا مسیر آموزش فقط به کلاس محدود نماند.</p>
      </div>
      <div className="responsive-grid-4">
        {lessons.map(([title, text], index) => (
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
