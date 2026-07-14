import SimplePage from '@/components/SimplePage';

export const metadata = { title: 'بازیگران', description: 'معرفی مسیر رشد بازیگران و استعدادهای خانواده برداشت.' };

const actors = [
  ['هنرجوی مقدماتی', 'شروع مسیر با تمرین بیان، بدن و شناخت نقش'],
  ['هنرجوی تکمیلی', 'تمرکز روی تکنیک، تحلیل متن و اجرای صحنه'],
  ['آماده تست', 'آماده‌سازی برای تست بازیگری و حضور مقابل دوربین'],
  ['گروه نوجوان', 'آموزش امن، هدفمند و متناسب با سن نوجوانان'],
  ['گروه بزرگسال', 'مسیر جدی برای علاقه‌مندان ورود حرفه‌ای'],
  ['استعدادهای شمال', 'شناسایی و رشد هنرجویان شعبه مازندران'],
];

export default function ActorsPage() {
  return (
    <SimplePage title="بازیگران" subtitle="مسیر رشد استعدادهایی که در خانواده برداشت آموزش می‌بینند" tag="هنرجویان">
      <div className="responsive-grid-3">
        {actors.map(([name, text], i) => (
          <div key={name} className="content-card" style={{ textAlign: 'center' }}>
            <div className="content-card__icon" style={{ margin: '0 auto 16px' }}>{i + 1}</div>
            <h3>{name}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>
    </SimplePage>
  );
}
