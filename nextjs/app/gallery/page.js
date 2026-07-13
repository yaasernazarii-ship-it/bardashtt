import SimplePage from '@/components/SimplePage';

export const metadata = { title: 'گالری', description: 'گالری تصاویر کلاس‌ها، اردوها و فعالیت‌های خانواده برداشت.' };

export default function GalleryPage() {
  return (
    <SimplePage title="گالری" subtitle="لحظه‌هایی از کلاس‌ها، اردوها و فعالیت‌های ما" tag="تصاویر">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ aspectRatio: i % 4 === 0 ? '1/1.25' : '1/1', borderRadius: 'var(--radius)', background: `linear-gradient(145deg, ${i % 2 ? '#050c18,#0b1f38' : '#1a1208,#2a1f0d'})`, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.6)' }}>
            تصویر {i + 1}
          </div>
        ))}
      </div>
    </SimplePage>
  );
}
