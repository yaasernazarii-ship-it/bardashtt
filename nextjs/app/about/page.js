import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import PageSlider from '@/components/PageSlider';

export const metadata = {
  title: 'درباره ما — آموزشگاه رایگان بازیگری',
  description: 'آشنایی با خانواده برداشت، اولین آموزشگاه رایگان بازیگری سینما در ایران. داستان ما، تیم آموزشی، شعبه تهران و مازندران.',
  alternates: { canonical: 'https://khanevadehbardasht.ir/about' },
};

export default function AboutPage() {
  return (
    <PageLayout>
      <style>{`
        .story-grid { display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center; }
        .story-img { aspect-ratio:4/5;border-radius:var(--radius-lg);overflow:hidden;position:relative;background:linear-gradient(145deg,#1a1208 0%,#2a1f0d 45%,#0d0a05 100%);background-size:cover;background-position:center; }
        .story-img::after { content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.55) 0%,transparent 55%); }
        .story-img-badge { position:absolute;bottom:20px;right:20px;z-index:2;background:var(--gold);border-radius:10px;padding:12px 18px; }
        .story-img-badge strong { display:block;font-size:.9rem;font-weight:800;color:#000; }
        .story-img-badge span { font-size:.72rem;font-weight:600;color:rgba(0,0,0,.65); }
        .story-year-badge { position:absolute;top:20px;left:20px;z-index:2;background:rgba(255,255,255,.12);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:10px 16px; }
        .story-year-badge span { display:block;font-size:.68rem;font-weight:600;color:rgba(255,255,255,.6);margin-bottom:2px; }
        .story-year-badge strong { font-size:1.1rem;font-weight:900;color:#fff; }
        .founder-card { background:var(--white);border:1.5px solid var(--border);border-radius:var(--radius-lg);padding:52px 48px;display:grid;grid-template-columns:160px 1fr;gap:48px;align-items:center;max-width:860px;margin:0 auto; }
        .founder-avatar { width:160px;height:160px;border-radius:50%;overflow:hidden;flex-shrink:0;background:linear-gradient(145deg,#1a1208,#2a1f0d);display:flex;align-items:center;justify-content:center;font-size:3.5rem;border:3px solid var(--gold); }
        .founder-name { font-size:1.8rem;font-weight:900;color:var(--dark);margin-bottom:6px; }
        .founder-title { font-size:.9rem;color:var(--gold);font-weight:700;margin-bottom:20px; }
        .founder-tags { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px; }
        .founder-bio { font-size:.9rem;color:var(--muted);line-height:1.9; }
        .cred-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:20px; }
        .cred-card { background:var(--white);border:1.5px solid var(--border);border-radius:var(--radius-lg);padding:32px 28px;text-align:center;transition:all .3s; }
        .cred-card:hover { border-color:var(--gold);transform:translateY(-3px);box-shadow:0 10px 32px rgba(196,146,42,.1); }
        .cred-card .cico { font-size:2.2rem;margin-bottom:16px; }
        .cred-card h3 { font-size:1rem;font-weight:800;color:var(--dark);margin-bottom:10px; }
        .cred-card p { font-size:.83rem;color:var(--muted);line-height:1.7; }
        .values-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:20px; }
        .value-item { padding:36px 28px;border-radius:var(--radius-lg);background:var(--surface);border:1px solid var(--border); }
        .value-item .vnum { font-size:2.5rem;font-weight:900;color:var(--border);line-height:1;margin-bottom:16px; }
        .value-item h3 { font-size:1.05rem;font-weight:800;color:var(--dark);margin-bottom:10px; }
        .value-item p { font-size:.85rem;color:var(--muted);line-height:1.75; }
        @media(max-width:900px){
          .story-grid{grid-template-columns:1fr;gap:40px;}
          .story-img{aspect-ratio:16/9;}
          .founder-card{grid-template-columns:1fr;text-align:center;padding:36px 24px;}
          .founder-avatar{margin:0 auto;}
          .founder-tags{justify-content:center;}
          .cred-grid{grid-template-columns:1fr 1fr;}
          .values-grid{grid-template-columns:1fr;}
        }
        @media(max-width:640px){ .cred-grid{grid-template-columns:1fr;} }
      `}</style>

      <PageSlider title="خانواده برداشت · درباره ما" count={3} />

      {/* داستان */}
      <section style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="story-grid">
            <div className="story-img">
              <div className="story-year-badge">
                <span>تأسیس</span>
                <strong>۱۳۹۷</strong>
              </div>
              <div className="story-img-badge">
                <strong>جایزه بین‌المللی زاگرب</strong>
                <span>بهترین کارگردانی · کرواسی</span>
              </div>
            </div>
            <div>
              <span className="tag tag--gold">داستان ما</span>
              <h2 className="heading" style={{ marginTop: 16 }}>از ۱۳۹۷ تا امروز</h2>
              <div className="line" />
              <p className="body-lg" style={{ marginBottom: 20 }}>
                خانواده برداشت با یک باور ساده اما انقلابی شکل گرفت:<br />
                <strong>استعداد نباید گرو پول باشد.</strong>
              </p>
              <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: 16 }}>
                از همان روز اول تصمیم گرفتیم درهایمان را برای همه باز بگذاریم. امروز به عنوان تنها آموزشگاه رایگان بازیگری سینما در کشور شناخته می‌شویم؛ با مجوز رسمی، دوره‌های تخصصی و کمپ‌های آموزشی که برای هنرجویان در تمامی سنین طراحی شده‌اند.
              </p>
              <p style={{ color: 'var(--muted)', lineHeight: 1.9, marginBottom: 16 }}>
                هنرجویان علاوه بر حضور در کلاس‌ها، در آفیش‌ها و اردوهای آموزشی ۲۴ ساعته تا ۱۰ روزه شرکت می‌کنند و از نزدیک با فضای واقعی تولید آثار سینمایی آشنا می‌شوند.
              </p>
              <p style={{ color: 'var(--muted)', lineHeight: 1.9 }}>
                ما باور داریم هر استعدادی شایسته دیده شدن است و هر رویا می‌تواند با آموزش درست به واقعیت تبدیل شود.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* آمار */}
      <section style={{ background: 'var(--dark)', padding: '56px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
            {[['۱۳۹۷','سال تأسیس'],['۲','شعبه فعال'],['۱۰۰٪','رایگان'],['۵','مسیر آموزشی']].map(([n,l]) => (
              <div key={l} style={{ padding: '32px 16px', borderLeft: '1px solid rgba(255,255,255,.07)' }}>
                <div style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900, color: 'var(--gold)', lineHeight: 1, marginBottom: 8 }}>{n}</div>
                <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.4)', letterSpacing: '.04em' }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* موسس */}
      <section style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="tag tag--dark">موسس</span>
            <h2 className="heading" style={{ marginTop: 14 }}>یاسر نظری</h2>
            <div className="line line--center" />
          </div>
          <div className="founder-card">
            <div className="founder-avatar">🎬</div>
            <div>
              <div className="founder-name">یاسر نظری</div>
              <div className="founder-title">موسس، استاد اصلی و کارگردان</div>
              <div className="founder-tags">
                <span className="tag tag--dark">تهیه‌کننده سینما</span>
                <span className="tag tag--dark">کارگردان</span>
                <span className="tag tag--gold">دانش‌آموخته آکسفورد</span>
                <span className="tag tag--gold">برنده جایزه زاگرب</span>
              </div>
              <p className="founder-bio">
                تهیه‌کننده و کارگردان سینما، دانش‌آموخته دانشگاه آکسفورد انگلستان و برنده جایزه بهترین کارگردانی از جشنواره بین‌المللی زاگرب کرواسی. بنیان‌گذار خانواده برداشت با هدف دموکراتیزه کردن آموزش بازیگری در ایران و دسترسی آزاد همه به هنر سینما.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* افتخارات */}
      <section style={{ background: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="tag tag--gold">چرا ما؟</span>
            <h2 className="heading" style={{ marginTop: 14 }}>دلایل انتخاب خانواده برداشت</h2>
          </div>
          <div className="cred-grid">
            <div className="cred-card"><div className="cico">🏆</div><h3>جایزه بین‌المللی زاگرب</h3><p>برنده جایزه بهترین کارگردانی از جشنواره معتبر بین‌المللی زاگرب کرواسی</p></div>
            <div className="cred-card"><div className="cico">🎓</div><h3>مجوز رسمی آموزشی</h3><p>دارای مجوز رسمی از ادارات آموزشی ذی‌صلاح — آموزشی معتبر و قانونی</p></div>
            <div className="cred-card"><div className="cico">✅</div><h3>۱۰۰٪ رایگان</h3><p>اولین و تنها آموزشگاه بازیگری کاملاً رایگان در ایران — بدون هیچ هزینه‌ای</p></div>
          </div>
        </div>
      </section>

      {/* ارزش‌ها */}
      <section style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="tag tag--dark">ارزش‌های ما</span>
            <h2 className="heading" style={{ marginTop: 14 }}>چه چیزی ما را متفاوت می‌کند</h2>
          </div>
          <div className="values-grid">
            <div className="value-item"><div className="vnum">۰۱</div><h3>دسترسی آزاد</h3><p>هنر و آموزش بازیگری برای همه. هیچ مانع مالی در مسیر استعداد وجود ندارد.</p></div>
            <div className="value-item"><div className="vnum">۰۲</div><h3>آموزش حرفه‌ای</h3><p>تکنیک‌های اثبات‌شده بازیگری با اساتید باتجربه و دانش‌آموخته خارج از کشور.</p></div>
            <div className="value-item"><div className="vnum">۰۳</div><h3>تجربه واقعی</h3><p>اردوها، آفیش‌ها و حضور در پروژه‌های واقعی سینمایی در کنار آموزش نظری.</p></div>
          </div>
        </div>
      </section>

      {/* تماس */}
      <section style={{ background: 'var(--dark)', padding: '36px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span className="tag tag--gold">تماس با ما</span>
            <h2 className="heading" style={{ color: '#fff', marginTop: 10, fontSize: '1.6rem' }}>در تماسیم</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, maxWidth: 720, margin: '0 auto' }}>
            {[
              { ico: '📞', lbl: 'تلفن', val: '02191090934', href: 'tel:02191090934' },
              { ico: '📸', lbl: 'اینستاگرام', val: '@bardashtt', href: 'https://instagram.com/bardashtt' },
              { ico: '💬', lbl: 'کانال بله', val: '@bardasht_family', href: 'https://ble.ir/bardasht_family' },
            ].map(c => (
              <div key={c.lbl} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 'var(--radius)', padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{c.ico}</div>
                <h4 style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 6 }}>{c.lbl}</h4>
                <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{ color: '#fff', fontWeight: 700, fontSize: '.9rem' }}>{c.val}</a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
