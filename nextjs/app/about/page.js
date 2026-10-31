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
  const aboutSlides = splitLines(t('about.header.slides'));
  const legacySlides = [t('about.slide1.image'), t('about.slide2.image'), t('about.slide3.image')].filter(Boolean);
  const heroImages = aboutSlides.length ? aboutSlides : legacySlides;
  return (
    <PageLayout>
      <style>{`
        #about-slider { position:relative; }
        #about-slider .pslider { height:clamp(280px,26vw,420px);aspect-ratio:auto;max-height:none;border-radius:0 0 50% 50% / 0 0 14% 14%; }
        #about-slider .pslider__slide::after { content:'';position:absolute;inset:0;background:linear-gradient(270deg,rgba(0,0,0,.15) 0%,rgba(0,0,0,.45) 45%,rgba(0,0,0,.82) 100%); }
        #about-slider .pslider__img { filter:grayscale(.35) contrast(1.05); }
        #about-slider .pslider__title { top:50%;bottom:auto;transform:translateY(-60%);text-align:left;padding-inline:max(24px,calc((100% - 1140px) / 2 + 24px)); }
        #about-slider .pslider__title span { position:relative;font-size:clamp(1.5rem,4.2vw,3.2rem);font-weight:900;letter-spacing:-.02em;line-height:1.35;padding-bottom:18px;max-width:min(560px,60vw);text-align:right;text-shadow:0 4px 24px rgba(0,0,0,.6); }
        #about-slider .pslider__title span::after { content:'';position:absolute;left:0;bottom:0;width:72px;height:4px;border-radius:4px;background:var(--gold); }
        #about-slider .pslider__nav { top:44%; }
        #about-slider .pslider__dots { bottom:40px; }
        .about-hero__down { position:absolute;left:50%;bottom:-23px;transform:translateX(-50%);z-index:12;width:46px;height:46px;border-radius:50%;background:var(--dark);color:#fff;display:flex;align-items:center;justify-content:center;border:3px solid var(--bg);box-shadow:0 8px 22px rgba(0,0,0,.22);transition:transform .25s,background .25s; }
        .about-hero__down svg { transform:rotate(180deg); }
        .about-hero__down:hover { background:#000;transform:translateX(-50%) translateY(3px); }

        .ab-eyebrow { display:inline-flex;align-items:center;gap:12px;color:#E0A800;font-size:.78rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase; }
        .ab-eyebrow::after { content:'';width:120px;max-width:22vw;height:1.5px;background:var(--gold); }
        .ab-head { text-align:center;margin:0 auto 44px;max-width:780px; }
        .ab-head .ab-eyebrow::before { content:'';width:48px;height:1.5px;background:var(--gold); }
        .ab-head .ab-eyebrow::after { width:48px; }
        .ab-title { font-size:clamp(1.6rem,3.4vw,2.5rem);font-weight:900;color:var(--dark);letter-spacing:-.02em;line-height:1.45;margin-top:10px; }
        .ab-text { color:#444;line-height:2.1;font-size:.95rem; }

        .ab-split { display:grid;grid-template-columns:1fr 1.05fr;gap:64px;align-items:center; }
        .ab-split--rev .ab-split__media { order:-1; }
        .ab-media { position:relative;margin:18px; }
        .ab-media::before { content:'';position:absolute;inset:-18px auto -18px -18px;width:62%;border:2px solid var(--gold);border-radius:22px;z-index:0; }
        .ab-split--rev .ab-media::before { inset:-18px -18px -18px auto; }
        .ab-media img { position:relative;z-index:1;display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:18px;box-shadow:0 18px 44px rgba(0,0,0,.16);background:#222; }
        .ab-media--portrait img { aspect-ratio:4/5;object-position:center top; }
        .ab-pill { display:inline-flex;align-items:center;gap:10px;border:1.5px solid var(--gold);border-radius:999px;padding:10px 26px;color:var(--dark);font-weight:800;font-size:.88rem;background:#fff;transition:all .25s; }
        .ab-pill::after { content:'‹';color:#E0A800;font-size:1.2rem;line-height:1; }
        .ab-pill:hover { background:var(--gold);color:var(--dark);box-shadow:0 8px 22px rgba(255,215,0,.28); }
        .ab-pill:hover::after { color:var(--dark); }

        .ab-row { display:grid;grid-template-columns:repeat(var(--cols,3),1fr);margin-top:56px; }
        .ab-row > * { padding:8px 32px;text-align:center;position:relative; }
        .ab-row > * + *::before { content:'';position:absolute;right:0;top:12%;bottom:12%;width:1.5px;background:linear-gradient(180deg,transparent,var(--gold),transparent);opacity:.7; }
        .ab-ico { display:flex;justify-content:center;color:var(--dark);margin-bottom:14px; }
        .ab-row--grid2 > :nth-child(3n+1)::before { display:none; }
        .ab-row h3 { font-size:1.02rem;font-weight:800;color:var(--dark);margin-bottom:10px;line-height:1.7; }
        .ab-row p { font-size:.86rem;color:var(--muted);line-height:1.95; }
        .ab-row .resume-list { text-align:right;max-width:380px;margin:14px auto 0; }
        .ab-row .vnum { font-size:2rem;font-weight:900;color:var(--gold);line-height:1;margin-bottom:14px; }

        .ab-quote { background:#EFEFEF;position:relative;overflow:hidden;padding:48px 0;margin-top:72px; }
        .ab-quote::before { content:'';position:absolute;left:-60px;top:50%;width:200px;height:200px;transform:translateY(-50%);border-radius:50%;border:18px solid rgba(0,0,0,.05);box-shadow:inset 0 0 0 28px rgba(0,0,0,.025); }
        .ab-quote__inner { display:flex;gap:18px;align-items:flex-start;justify-content:center;max-width:820px;margin:0 auto;padding:0 24px; }
        .ab-quote__mark { font-size:4.4rem;line-height:.8;font-weight:900;color:#F2B705;font-family:Georgia,serif;flex-shrink:0; }
        .ab-quote p { font-size:clamp(1rem,1.8vw,1.2rem);font-weight:800;color:var(--dark);line-height:2;text-align:center; }
        .ab-quote__line { display:block;width:160px;height:1.5px;margin:16px auto 0;background:linear-gradient(90deg,transparent,var(--gold),transparent); }
        #about-intro { padding-bottom:0!important; }

        .founder-name { font-size:1.6rem;font-weight:900;color:var(--dark);margin:18px 0 4px; }
        .founder-title { font-size:.9rem;color:#E0A800;font-weight:700;margin-bottom:18px; }
        .founder-tags { display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px; }
        .founder-bio { font-size:.92rem;color:#444;line-height:2.05; }

        .resume-grid { display:grid;grid-template-columns:1fr 1fr;gap:24px; }
        .resume-block { background:#fff;border:1px solid var(--border);border-radius:18px;padding:30px 28px;position:relative;box-shadow:0 10px 30px rgba(0,0,0,.04); }
        .resume-block::before { content:'';position:absolute;top:-1px;right:28px;width:56px;height:3px;border-radius:0 0 4px 4px;background:var(--gold); }
        .resume-block--wide { grid-column:1 / -1; }
        .resume-block h3 { display:flex;align-items:center;gap:10px;font-size:1.05rem;font-weight:800;color:var(--dark);margin-bottom:18px; }
        .resume-block h3 .rico { display:flex;color:#E0A800; }
        .resume-list { list-style:none;display:flex;flex-direction:column;gap:12px;padding:0;margin:0; }
        .resume-list li { display:flex;gap:10px;font-size:.88rem;color:var(--muted);line-height:1.8; }
        .resume-list li .li-ico { color:var(--gold);flex-shrink:0;font-size:.7rem;margin-top:.45em; }
        .resume-list li b { color:var(--dark);font-weight:700; }
        .edu-certs { display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px; }
        .edu-cert { display:block;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:#fff;transition:all .25s; }
        .edu-cert:hover { border-color:var(--gold);box-shadow:0 8px 22px rgba(196,146,42,.14);transform:translateY(-2px); }
        .edu-cert img { width:100%;aspect-ratio:4/3;object-fit:cover;object-position:top;display:block; }
        .edu-cert__cap { display:block;padding:8px 10px;font-size:.72rem;font-weight:700;color:var(--muted);text-align:center;border-top:1px solid var(--border); }
        .skills-groups { display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:920px;margin:0 auto; }
        .skills-group { background:#F7F7F7;border-radius:18px;padding:26px 24px; }
        .skills-group__label { display:inline-block;font-size:.8rem;font-weight:800;color:#E0A800;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid var(--gold); }
        .skills-chips { display:flex;flex-wrap:wrap;gap:10px; }
        .skill-chip { display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid var(--border);border-radius:999px;padding:8px 14px;font-size:.82rem;font-weight:600;color:var(--dark);transition:all .25s; }
        .skill-chip:hover { border-color:var(--gold); }
        .skill-chip::before { content:'';width:6px;height:6px;border-radius:50%;background:var(--gold);flex-shrink:0; }
        #about-creds { background:#F7F7F7!important; }

        @media(max-width:900px){
          .ab-split{grid-template-columns:1fr;gap:36px;}
          .ab-split .ab-split__media{order:2;}
          .ab-row{--cols:1!important;margin-top:36px;}
          .ab-row > *{padding:22px 8px;}
          .ab-row > * + *::before{left:20%;right:20%;top:0;bottom:auto;width:auto;height:1.5px;background:linear-gradient(90deg,transparent,var(--gold),transparent);}
          .ab-row--grid2{--cols:2!important;}
          .ab-row--grid2 > * + *::before{display:none;}
          .ab-row--grid2 > *{border-top:1px solid var(--border);}
          .resume-grid{grid-template-columns:1fr;}
          .skills-groups{grid-template-columns:1fr;}
          .ab-media--portrait{max-width:420px;margin-inline:auto;}
        }
        @media(max-width:640px){
          .ab-row--grid2{--cols:1!important;}
          #about-slider .pslider__title span{max-width:80vw;}
          .about-hero__down{width:38px;height:38px;}
          .ab-quote__mark{font-size:3rem;}
        }
      `}</style>

      <div id="about-slider">
        <PageSlider
          title={t('about.slider.title')}
          count={3}
          images={heroImages}
        />
        <a href="#about-intro" className="about-hero__down" aria-label="ادامه"><Icon name="arrowUp" size={20} /></a>
      </div>

      {/* معرفی آموزشگاه */}
      <section id="about-intro" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="ab-split">
            <div>
              <span className="ab-eyebrow">{t('about.intro.eyebrow')}</span>
              <h1 className="ab-title">{t('about.intro.heading')}</h1>
              <p className="ab-text" style={{ marginTop: 18 }}>
                {t('about.intro.lead')}
              </p>
            </div>
            <div className="ab-split__media">
              <div className="ab-media"><img src={t('about.story.image')} alt="خانواده برداشت" loading="lazy" decoding="async" /></div>
            </div>
          </div>

          <div className="ab-row" style={{ '--cols': 2 }}>
            <div>
              <div className="ab-ico"><Icon name="clapperboard" size={34} strokeWidth={1.4} /></div>
              <h3>{t('about.card1.title')}</h3>
              <p>{t('about.card1.body')}</p>
            </div>
            <div>
              <div className="ab-ico"><Icon name="shield" size={34} strokeWidth={1.4} /></div>
              <h3>{t('about.card2.title')}</h3>
              <p>{t('about.card2.body')}</p>
              <ul className="resume-list">
                {splitLines(t('about.card2.items')).map((it) => (
                  <li key={it}><span className="li-ico">◆</span><span>{it}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="ab-quote">
          <div className="ab-quote__inner">
            <span className="ab-quote__mark" aria-hidden="true">”</span>
            <div>
              <p>{t('about.intro.closing')}</p>
              <span className="ab-quote__line" />
            </div>
          </div>
        </div>
      </section>

      {/* مسیر آموزشی */}
      <section id="about-path" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="ab-head">
            <span className="ab-eyebrow">مسیر رشد هنرجو</span>
            <h2 className="ab-title">از علاقه تا تجربهٔ واقعی بازیگری</h2>
            <p className="ab-text" style={{ marginTop: 14, color: 'var(--muted)' }}>
              آموزش در خانواده برداشت فقط به حضور در کلاس محدود نیست؛ هنرجو در یک مسیر مرحله‌به‌مرحله با تمرین، بازخورد، کار گروهی و تجربهٔ جلوی دوربین رشد می‌کند.
            </p>
          </div>
          <div className="ab-row ab-row--grid2" style={{ '--cols': 3, rowGap: 36 }}>
            {[
              ['۰۱', 'آموزش پایه', 'شناخت بدن، بیان، تمرکز و اصول حضور در صحنه و مقابل دوربین.'],
              ['۰۲', 'تمرین و بازخورد', 'تمرین‌های منظم فردی و گروهی برای تبدیل آموخته‌ها به مهارت عملی.'],
              ['۰۳', 'تجربهٔ تولید', 'آشنایی با فضای واقعی فیلم‌سازی و همکاری در یک گروه خلاق.'],
              ['۰۴', 'مسیر پیشرفت', 'ادامهٔ آموزش از سطح مقدماتی تا تکمیلی و پیشرفته بر اساس آمادگی هنرجو.'],
              ['۰۵', 'ارزیابی و گواهینامه', 'بررسی شرایط آموزشی و آزمون پایانی برای هنرجیانی که مسیر را کامل می‌کنند.'],
              ['۰۶', 'ساخت رزومه', 'ثبت تجربه‌ها و معرفی توانایی‌های هنرجو برای ادامهٔ مسیر حرفه‌ای.'],
            ].map(([num, title, text]) => (
              <div key={num}>
                <div className="vnum">{num}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <Link href="/courses" className="ab-pill">مشاهدهٔ دوره‌ها</Link>
          </div>
        </div>
      </section>

      {/* بنیان‌گذار */}
      <section id="about-founder" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="ab-split ab-split--rev">
            <div>
              <span className="ab-eyebrow">{t('about.founder.eyebrow')}</span>
              <h2 className="ab-title">{t('about.founder.heading')}</h2>
              <p style={{ color: '#E0A800', fontWeight: 700, marginTop: 6 }}>{t('about.founder.subtitle')}</p>
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
              <p style={{ marginTop: 24 }}><Link href="/yaser-nazari" className="ab-pill">معرفی و سوابق یاسر نظری</Link></p>
            </div>
            <div className="ab-split__media">
              <div className="ab-media ab-media--portrait"><img src={t('about.founder.image')} alt="یاسر نظری، بنیان‌گذار خانواده برداشت" loading="lazy" decoding="async" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* سوابق و افتخارات حرفه‌ای */}
      <section id="about-resume" style={{ background: 'var(--white)' }}>
        <div className="container">
          <div className="ab-head">
            <span className="ab-eyebrow">{t('about.resume.eyebrow')}</span>
            <h2 className="ab-title">{t('about.resume.heading')}</h2>
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
            <h3 style={{ textAlign: 'center', fontSize: '1.15rem', fontWeight: 900, color: 'var(--dark)', marginBottom: 22 }}>{t('about.skills.heading')}</h3>
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
          <div className="ab-head" style={{ marginBottom: 0 }}>
            <span className="ab-eyebrow">{t('about.creds.eyebrow')}</span>
            <h2 className="ab-title">{t('about.creds.heading')}</h2>
          </div>
          <div className="ab-row" style={{ '--cols': 3 }}>
            <div><div className="ab-ico"><Icon name="trophy" size={34} strokeWidth={1.4} /></div><h3>{t('about.cred1.title')}</h3><p>{t('about.cred1.body')}</p></div>
            <div><div className="ab-ico"><Icon name="graduationCap" size={34} strokeWidth={1.4} /></div><h3>{t('about.cred2.title')}</h3><p>{t('about.cred2.body')}</p></div>
            <div><div className="ab-ico"><Icon name="check" size={34} strokeWidth={1.4} /></div><h3>{t('about.cred3.title')}</h3><p>{t('about.cred3.body')}</p></div>
          </div>
        </div>
      </section>

      {/* ارزش‌ها */}
      <section id="about-values" style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="ab-head" style={{ marginBottom: 0 }}>
            <span className="ab-eyebrow">{t('about.values.eyebrow')}</span>
            <h2 className="ab-title">{t('about.values.heading')}</h2>
          </div>
          <div className="ab-row" style={{ '--cols': 3 }}>
            <div><div className="vnum">۰۱</div><h3>{t('about.value1.title')}</h3><p>{t('about.value1.body')}</p></div>
            <div><div className="vnum">۰۲</div><h3>{t('about.value2.title')}</h3><p>{t('about.value2.body')}</p></div>
            <div><div className="vnum">۰۳</div><h3>{t('about.value3.title')}</h3><p>{t('about.value3.body')}</p></div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, maxWidth: 720, margin: '14px auto 0' }}>
            {[
              { branch: 'شعبهٔ تهران', address: t('contact.tehranAddress') },
              { branch: 'شعبهٔ مازندران', address: t('contact.mazandaranAddress') },
            ].map(({ branch, address }) => (
              <div key={branch} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 'var(--radius)', padding: '16px' }}>
                <span style={{ color: 'var(--gold)', flex: '0 0 auto' }}><Icon name="mapPin" size={22} /></span>
                <p style={{ color: 'rgba(255,255,255,.72)', lineHeight: 1.9 }}><strong style={{ color: '#fff', display: 'block' }}>{branch}</strong>{address}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
