import SimplePage from '@/components/SimplePage';

export const metadata = { title: 'گالری', description: 'گالری تصاویر کلاس‌ها، اردوها و فعالیت‌های خانواده برداشت.' };

const items = ['کلاس بیان', 'تمرین بدن', 'اردوی آموزشی', 'تمرین صحنه', 'کار مقابل دوربین', 'گروه نوجوان', 'تحلیل متن', 'جلسه تمرین', 'فضای آموزشی'];

export default function GalleryPage() {
  return (
    <SimplePage title="گالری" subtitle="لحظه‌هایی از کلاس‌ها، اردوها و فعالیت‌های ما" tag="تصاویر">
      <div className="responsive-grid-3">
        {items.map((title, i) => (
          <div key={title} className="content-card" style={{ minHeight: i % 4 === 0 ? 250 : 210, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: `linear-gradient(145deg, ${i % 2 ? '#1B1B1B,#252525,#E0FFFF 180%' : '#1B1B1B,#2A2A2A,#FFD700 180%'})` }}>
            <span className="tag tag--gold" style={{ alignSelf: 'flex-start', marginBottom: 12 }}>تصویر {i + 1}</span>
            <h3 style={{ color: '#fff' }}>{title}</h3>
            <p style={{ color: 'rgba(255,255,255,.62)' }}>نمایی از فعالیت‌های آموزشی خانواده برداشت</p>
          </div>
        ))}
      </div>
    </SimplePage>
  );
}
