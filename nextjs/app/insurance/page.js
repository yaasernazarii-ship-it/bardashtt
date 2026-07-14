import SimplePage from '@/components/SimplePage';

export const metadata = { title: 'بیمه هنرجویان', description: 'پوشش بیمه‌ای و ایمنی هنرجویان در دوره‌ها و اردوهای خانواده برداشت.' };

const items = [
  ['کلاس‌ها', 'پوشش و ثبت اطلاعات هنرجویان برای حضور منظم در برنامه‌ها'],
  ['اردوها', 'توجه ویژه به ایمنی در برنامه‌های آموزشی کوتاه‌مدت و چندروزه'],
  ['پشتیبانی', 'اطلاع‌رسانی و همراهی تیم اجرایی در طول فعالیت‌های حضوری'],
];

export default function InsurancePage() {
  return (
    <SimplePage title="بیمه هنرجویان" subtitle="پوشش بیمه‌ای در دوره‌ها و اردوها" tag="ایمنی">
      <div className="stack-card" style={{ marginBottom: 22 }}>
        <h2 className="subheading" style={{ marginBottom: 12 }}>امنیت و آرامش هنرجو برای ما جدی است</h2>
        <p className="body-lg">خانواده برداشت برای هنرجویان در برنامه‌های آموزشی، کلاس‌ها و اردوها پوشش بیمه‌ای و فرآیندهای مراقبتی در نظر می‌گیرد تا مسیر آموزش با اطمینان بیشتری طی شود.</p>
      </div>
      <div className="responsive-grid-3">
        {items.map(([title, text], index) => (
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
