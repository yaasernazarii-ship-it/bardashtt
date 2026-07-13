import SimplePage from '@/components/SimplePage';

export const metadata = { title: 'بازیگران', description: 'معرفی بازیگران و استعدادهای خانواده برداشت.' };

export default function ActorsPage() {
  return (
    <SimplePage title="بازیگران" subtitle="استعدادهایی که در خانواده برداشت رشد می‌کنند" tag="هنرجویان">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
        {['هنرجوی مقدماتی', 'هنرجوی تکمیلی', 'بازیگر آماده تست', 'گروه نوجوان', 'گروه بزرگسال', 'استعدادهای شمال'].map((name, i) => (
          <div key={name} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, textAlign: 'center' }}>
            <div style={{ width: 86, height: 86, borderRadius: '50%', background: 'linear-gradient(145deg,#1a1208,#2a1f0d)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎭</div>
            <h3 style={{ color: 'var(--dark)', marginBottom: 6 }}>{name}</h3>
            <p style={{ color: 'var(--muted)', fontSize: '.85rem' }}>پروفایل‌های کامل به‌زودی منتشر می‌شود.</p>
          </div>
        ))}
      </div>
    </SimplePage>
  );
}
