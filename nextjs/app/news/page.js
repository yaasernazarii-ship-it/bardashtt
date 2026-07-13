import SimplePage from '@/components/SimplePage';

export const metadata = { title: 'اخبار', description: 'آخرین اخبار و اطلاعیه‌های خانواده برداشت.' };

export default function NewsPage() {
  return (
    <SimplePage title="اخبار" subtitle="آخرین اطلاعیه‌ها و خبرهای خانواده برداشت" tag="اطلاعیه‌ها">
      <div style={{ display: 'grid', gap: 14 }}>
        {['ثبت‌نام دوره‌های جدید باز است', 'برگزاری اردوی آموزشی جدید', 'به‌روزرسانی برنامه کلاس‌ها'].map((t, i) => (
          <div key={t} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 22 }}>
            <span className="tag tag--dark" style={{ marginBottom: 12 }}>خبر {i + 1}</span>
            <h2 style={{ fontSize: '1.1rem', color: 'var(--dark)' }}>{t}</h2>
          </div>
        ))}
      </div>
    </SimplePage>
  );
}
