import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import PageSlider from '@/components/PageSlider';
import Icon from '@/components/Icon';
import { loadContent, splitLines } from '@/lib/siteContent';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('about');
}

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const t = await loadContent();
  // اسلایدهای بالای صفحه از فیلد چند‌عکسی جدید خوانده می‌شوند؛ اگر خالی بود، به اسلایدهای قدیمی برمی‌گردیم.
  const aboutSlides = splitLines(t('about.slides'));
  const legacySlides = [t('about.slide1.image'), t('about.slide2.image'), t('about.slide3.image')].filter(Boolean);
  const heroImages = aboutSlides.length ? aboutSlides : legacySlides;
  return (
    <PageLayout>
      <style>{`
        .founder-card { background:var(--white);border:1.5px solid var(--border);border-radius:var(--radius-lg);padding:52px 48px;display:grid;grid-template-columns:160px 1fr;gap:48px;align-items:center;max-width:860px;margin:0 auto; }
        .founder-avatar { width:160px;height:160px;border-radius:50%;overflow:hidden;flex-shrink:0;background:linear-gradient(145deg,#1a1208,#2a1f0d);display:flex;align-items:center;justify-content:center;font-size:3.5rem;border:3px solid var(--gold); }
        .founder-avatar img { width:100%;height:100%;object-fit:cover;object-position:center top;display:block; }
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
        .about-cards { display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:960px;margin:0 auto; }
        .about-card { background:var(--white);border:1.5px solid var(--border);border-radius:var(--radius-lg);padding:34px 30px; }
        .about-card__ico { font-size:2rem;margin-bottom:14px; }
        .about-card h3 { font-size:1.15rem;font-weight:800;color:var(--dark);margin-bottom:12px; }
        .about-card p { font-size:.88rem;color:var(--muted);line-height:1.95; }
        .about-card b { color:var(--dark);font-weight:700; }
        .resume-grid { display:grid;grid-template-columns:1fr 1fr;gap:24px; }
        .resume-block { background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius-lg);padding:30px 28px; }
        .resume-block--wide { grid-column:1 / -1; }
        .resume-block h3 { display:flex;align-items:center;gap:10px;font-size:1.05rem;font-weight:800;color:var(--dark);margin-bottom:18px; }
        .resume-block h3 .rico { font-size:1.3rem; }
        .resume-list { list-style:none;display:flex;flex-direction:column;gap:12px;padding:0;margin:0; }
        .resume-list li { display:flex;gap:10px;font-size:.88rem;color:var(--muted);line-height:1.8; }
        .resume-list li .li-ico { color:var(--gold);flex-shrink:0;font-size:.7rem;margin-top:.45em; }
        .resume-list li b { color:var(--dark);font-weight:700; }
        .edu-certs { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px; }
        .edu-cert { display:block;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:#fff;transition:all .25s; }
        .edu-cert:hover { border-color:var(--gold);box-shadow:0 8px 22px rgba(196,146,42,.14);transform:translateY(-2px); }
        .edu-cert img { width:100%;aspect-ratio:4/3;object-fit:cover;object-position:top;display:block; }
        .edu-cert__cap { display:block;padding:8px 10px;font-size:.72rem;font-weight:700;color:var(--muted);text-align:center;border-top:1px solid var(--border); }
        @media(max-width:480px){ .edu-certs{grid-template-columns:1fr;} }
        .skills-groups { display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:920px;margin:0 auto; }
        .skills-group { background:var(--surface);border:1.5px solid var(--border);border-radius:var(--radius-lg);padding:26px 24px; }
        .skills-group__label { display:inline-block;font-size:.8rem;font-weight:800;color:var(--gold);margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid var(--gold); }
        .skills-chips { display:flex;flex-wrap:wrap;gap:10px; }
        .skill-chip { display:inline-flex;align-items:center;gap:7px;background:var(--white);border:1px solid var(--border);border-radius:999px;padding:8px 14px;font-size:.82rem;font-weight:600;color:var(--dark);transition:all .25s; }
        .skill-chip:hover { border-color:var(--gold);box-shadow:0 4px 14px rgba(196,146,42,.12); }
        .skill-chip::before { content:'';width:6px;height:6px;border-radius:50%;background:var(--gold);flex-shrink:0; }
        .values-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:20px; }
        .value-item { padding:36px 28px;border-radius:var(--radius-lg);background:var(--surface);border:1px solid var(--border); }
        .value-item .vnum { font-size:2.5rem;font-weight:900;color:var(--border);line-height:1;margin-bottom:16px; }
        .value-item h3 { font-size:1.05rem;font-weight:800;color:var(--dark);margin-bottom:10px; }
        .value-item p { font-size:.85rem;color:var(--muted);line-height:1.75; }
        @media(max-width:900px){
          .founder-card{grid-template-columns:1fr;text-align:center;padding:36px 24px;}
          .founder-avatar{margin:0 auto;}
          .founder-tags{justify-content:center;}
          .cred-grid{grid-template-columns:1fr 1fr;}
          .values-grid{grid-template-columns:1fr;}
          .resume-grid{grid-template-columns:1fr;}
          .skills-groups{grid-template-columns:1fr;}
          .about-cards{grid-template-columns:1fr;}
        }
        @media(max-width:640px){ .cred-grid{grid-template-columns:1fr;} }
      `}</style>

      <div id="about-slider">
        <PageSlider
          title={t('about.slider.title')}
          count={3}
          images={heroImages}
        />
      </div>

      {/* معرفی آموزشگاه */}
      <section id="about-intro" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40, maxWidth: 780, marginInline: 'auto' }}>
            <span className="tag tag--gold">{t('about.intro.eyebrow')}</span>
            <h1 className="heading" style={{ marginTop: 14 }}>{t('about.intro.heading')}</h1>
            <div className="line line--center" />
            <p style={{ color: 'var(--muted)', lineHeight: 2, marginTop: 18 }}>
              {t('about.intro.lead')}
            </p>
          </div>

          <div className="about-cards">
            <div className="about-card">
              <div className="about-card__ico"><Icon name="clapperboard" size={30} strokeWidth={1.6} /></div>
              <h3>{t('about.card1.title')}</h3>
              <p>{t('about.card1.body')}</p>
            </div>
            <div className="about-card">
              <div className="about-card__ico"><Icon name="shield" size={30} strokeWidth={1.6} /></div>
              <h3>{t('about.card2.title')}</h3>
              <p>{t('about.card2.body')}</p>
              <ul className="resume-list" style={{ marginTop: 14 }}>
                {splitLines(t('about.card2.items')).map((it) => (
                  <li key={it}><span className="li-ico">◆</span><span>{it}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--muted)', lineHeight: 2, marginTop: 32, maxWidth: 780, marginInline: 'auto' }}>
            {t('about.intro.closing')}
          </p>
        </div>
      </section>

      {/* مسیر آموزشی */}
      <section id="about-path" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 36, maxWidth: 780, marginInline: 'auto' }}>
            <span className="tag tag--gold">مسیر رشد هنرجو</span>
            <h2 className="heading" style={{ marginTop: 14 }}>از علاقه تا تجربهٔ واقعی بازیگری</h2>
            <div className="line line--center" />
            <p style={{ color: 'var(--muted)', lineHeight: 2, marginTop: 18 }}>
              آموزش در خانواده برداشت فقط به حضور در کلاس محدود نیست؛ هنرجو در یک مسیر مرحله‌به‌مرحله با تمرین، بازخورد، کار گروهی و تجربهٔ جلوی دوربین رشد می‌کند.
            </p>
          </div>
          <div className="values-grid">
            {[
              ['۰۱', 'آموزش پایه', 'شناخت بدن، بیان، تمرکز و اصول حضور در صحنه و مقابل دوربین.'],
              ['۰۲', 'تمرین و بازخورد', 'تمرین‌های منظم فردی و گروهی برای تبدیل آموخته‌ها به مهارت عملی.'],
              ['۰۳', 'تجربهٔ تولید', 'آشنایی با فضای واقعی فیلم‌سازی و همکاری در یک گروه خلاق.'],
              ['۰۴', 'مسیر پیشرفت', 'ادامهٔ آموزش از سطح مقدماتی تا تکمیلی و پیشرفته بر اساس آمادگی هنرجو.'],
              ['۰۵', 'ارزیابی و گواهینامه', 'بررسی شرایط آموزشی و آزمون پایانی برای هنرجیانی که مسیر را کامل می‌کنند.'],
              ['۰۶', 'ساخت رزومه', 'ثبت تجربه‌ها و معرفی توانایی‌های هنرجو برای ادامهٔ مسیر حرفه‌ای.'],
            ].map(([num, title, text]) => (
              <div key={num} className="value-item">
                <div className="vnum">{num}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 30 }}>
            <Link href="/courses" className="btn btn--gold">مشاهدهٔ دوره‌ها</Link>
          </div>
        </div>
      </section>

      {/* بنیان‌گذار */}
      <section id="about-founder" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="tag tag--dark">{t('about.founder.eyebrow')}</span>
            <h2 className="heading" style={{ marginTop: 14 }}>{t('about.founder.heading')}</h2>
            <div className="line line--center" />
            <p style={{ color: 'var(--gold)', fontWeight: 700, marginTop: 10 }}>{t('about.founder.subtitle')}</p>
          </div>
          <div className="founder-card" style={{ alignItems: 'flex-start' }}>
            <div className="founder-avatar"><img src={t('about.founder.image')} alt="یاسر نظری، بنیان‌گذار خانواده برداشت" loading="lazy" decoding="async" /></div>
            <div>
              <div className="founder-name">{t('about.founder.name')}</div>
              <div className="founder-title">{t('about.founder.title')}</div>
              <div className="founder-tags">
                {splitLines(t('about.founder.tags')).map((tg, i) => (
                  <span key={tg} className={`tag ${i < 2 ? 'tag--dark' : 'tag--gold'}`}>{tg}</span>
                ))}
              </div>
              <p className="founder-bio" style={{ marginBottom: 14 }}>
                {t('about.founder.bio1')}
              </p>
              <p className="founder-bio" style={{ marginBottom: 14 }}>
                {t('about.founder.bio2')}
              </p>
              <p className="founder-bio">
                {t('about.founder.bio3')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* سوابق و افتخارات حرفه‌ای */}
      <section id="about-resume" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="tag tag--gold">{t('about.resume.eyebrow')}</span>
            <h2 className="heading" style={{ marginTop: 14 }}>{t('about.resume.heading')}</h2>
            <div className="line line--center" />
          </div>

          <div className="resume-grid">
            <div className="resume-block">
              <h3><span className="rico"><Icon name="graduationCap" size={20} /></span> {t('about.edu.heading')}</h3>
              <ul className="resume-list">
                {splitLines(t('about.edu.items')).map((it) => (
                  <li key={it}><span className="li-ico">◆</span><span>{it}</span></li>
                ))}
              </ul>
              <div className="edu-certs">
                <a className="edu-cert" href={t('about.edu1.image')} target="_blank" rel="noopener noreferrer">
                  <img src={t('about.edu1.image')} alt="گواهی کالج بین‌المللی ابن‌سینا — گرجستان" loading="lazy" />
                  <span className="edu-cert__cap">{t('about.edu1.cap')}</span>
                </a>
                <a className="edu-cert" href={t('about.edu2.image')} target="_blank" rel="noopener noreferrer">
                  <img src={t('about.edu2.image')} alt="گواهی آکادمی آکسفورد" loading="lazy" />
                  <span className="edu-cert__cap">{t('about.edu2.cap')}</span>
                </a>
              </div>
            </div>

            <div className="resume-block">
              <h3><span className="rico"><Icon name="trophy" size={20} /></span> {t('about.honors.heading')}</h3>
              <ul className="resume-list">
                {splitLines(t('about.honors.items')).map((it) => (
                  <li key={it}><span className="li-ico">◆</span><span>{it}</span></li>
                ))}
              </ul>
            </div>

            <div className="resume-block resume-block--wide">
              <h3><span className="rico"><Icon name="scroll" size={20} /></span> {t('about.licenses.heading')}</h3>
              <ul className="resume-list">
                {splitLines(t('about.licenses.items')).map((it) => (
                  <li key={it}><span className="li-ico">◆</span><span>{it}</span></li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ marginTop: 36 }}>
            <h3 style={{ textAlign: 'center', fontSize: '1.05rem', fontWeight: 800, color: 'var(--dark)', marginBottom: 22 }}>{t('about.skills.heading')}</h3>
            <div className="skills-groups">
              <div className="skills-group">
                <span className="skills-group__label">{t('about.skills.g1.label')}</span>
                <div className="skills-chips">
                  {splitLines(t('about.skills.g1.items')).map((it) => (
                    <span key={it} className="skill-chip">{it}</span>
                  ))}
                </div>
              </div>
              <div className="skills-group">
                <span className="skills-group__label">{t('about.skills.g2.label')}</span>
                <div className="skills-chips">
                  {splitLines(t('about.skills.g2.items')).map((it) => (
                    <span key={it} className="skill-chip">{it}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* افتخارات */}
      <section id="about-creds" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="tag tag--gold">{t('about.creds.eyebrow')}</span>
            <h2 className="heading" style={{ marginTop: 14 }}>{t('about.creds.heading')}</h2>
          </div>
          <div className="cred-grid">
            <div className="cred-card"><div className="cico"><Icon name="trophy" size={28} strokeWidth={1.6} /></div><h3>{t('about.cred1.title')}</h3><p>{t('about.cred1.body')}</p></div>
            <div className="cred-card"><div className="cico"><Icon name="graduationCap" size={28} strokeWidth={1.6} /></div><h3>{t('about.cred2.title')}</h3><p>{t('about.cred2.body')}</p></div>
            <div className="cred-card"><div className="cico"><Icon name="check" size={28} strokeWidth={1.6} /></div><h3>{t('about.cred3.title')}</h3><p>{t('about.cred3.body')}</p></div>
          </div>
        </div>
      </section>

      {/* ارزش‌ها */}
      <section id="about-values" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="tag tag--dark">{t('about.values.eyebrow')}</span>
            <h2 className="heading" style={{ marginTop: 14 }}>{t('about.values.heading')}</h2>
          </div>
          <div className="values-grid">
            <div className="value-item"><div className="vnum">۰۱</div><h3>{t('about.value1.title')}</h3><p>{t('about.value1.body')}</p></div>
            <div className="value-item"><div className="vnum">۰۲</div><h3>{t('about.value2.title')}</h3><p>{t('about.value2.body')}</p></div>
            <div className="value-item"><div className="vnum">۰۳</div><h3>{t('about.value3.title')}</h3><p>{t('about.value3.body')}</p></div>
          </div>
        </div>
      </section>

      {/* تماس */}
      <section id="about-contact" style={{ background: 'var(--dark)', padding: '36px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <span className="tag tag--gold">{t('about.contact.eyebrow')}</span>
            <h2 className="heading" style={{ color: '#fff', marginTop: 10, fontSize: '1.6rem' }}>{t('about.contact.heading')}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, maxWidth: 720, margin: '0 auto' }}>
            {[
              { ico: 'phone', lbl: 'تلفن', val: t('contact.phone'), href: `tel:${t('contact.phone')}` },
              { ico: 'instagram', lbl: 'اینستاگرام', val: t('contact.instagram'), href: t('contact.instagramUrl') },
              { ico: 'chat', lbl: 'کانال بله', val: t('contact.bale'), href: t('contact.baleUrl') },
            ].map(c => (
              <div key={c.lbl} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 'var(--radius)', padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ marginBottom: 6, color: 'var(--gold)', display: 'flex', justifyContent: 'center' }}><Icon name={c.ico} size={22} /></div>
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
