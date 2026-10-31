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
  const sliderTitle = t('about.slider.title') || '';
  const titleParts = sliderTitle.split('·').map((s) => s.trim()).filter(Boolean);
  const heroMain = titleParts.length > 1 ? titleParts.slice(1).join(' · ') : sliderTitle;
  const heroSub = titleParts.length > 1 ? titleParts[0] : '';
  const heroWords = heroMain.split(' ');
  const heroLast = heroWords.length > 1 ? heroWords.pop() : '';
  const heroFirst = heroWords.join(' ');
  const founderTagIcons = ['clapperboard', 'video', 'graduationCap', 'bookOpen', 'trophy'];
  const bandImage = heroImages[0] || t('about.story.image');
  return (
    <PageLayout>
      <style>{`
        #about-slider { position:relative;background:var(--bg); }
        #about-slider .pslider { height:clamp(240px,24vw,380px);aspect-ratio:auto;max-height:none;border-radius:0 0 50% 50% / 0 0 16% 16%; }
        #about-slider .pslider__slide::after { content:'';position:absolute;inset:0;background:linear-gradient(270deg,rgba(0,0,0,.18) 0%,rgba(0,0,0,.5) 50%,rgba(0,0,0,.86) 100%); }
        #about-slider .pslider__img { filter:grayscale(.45) contrast(1.05); }
        #about-slider .pslider__nav { top:46%; }
        #about-slider .pslider__dots { bottom:34px; }
        .about-hero__title { position:absolute;inset:0;z-index:9;pointer-events:none;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;padding-inline:max(24px,calc((100% - 1140px) / 2 + 24px));padding-bottom:4%; }
        .about-hero__title h2 { position:relative;color:#fff;font-size:clamp(1.8rem,4.6vw,3.4rem);font-weight:900;letter-spacing:-.02em;line-height:1.3;padding-bottom:14px;text-shadow:0 4px 24px rgba(0,0,0,.6); }
        .about-hero__title h2 em { font-style:normal;color:var(--gold); }
        .about-hero__title h2::after { content:'';position:absolute;right:0;bottom:0;width:64px;height:3px;border-radius:3px;background:var(--gold); }
        .about-hero__title p { color:rgba(255,255,255,.82);font-size:clamp(.78rem,1.3vw,.95rem);font-weight:600;margin-top:12px;text-shadow:0 2px 12px rgba(0,0,0,.6); }
        .about-hero__down { position:absolute;left:50%;bottom:-23px;transform:translateX(-50%);z-index:12;width:46px;height:46px;border-radius:50%;background:var(--dark);color:#fff;display:flex;align-items:center;justify-content:center;border:3px solid var(--bg);box-shadow:0 8px 22px rgba(0,0,0,.22);transition:transform .25s,background .25s; }
        .about-hero__down svg { transform:rotate(180deg); }
        .about-hero__down:hover { background:#000;transform:translateX(-50%) translateY(3px); }

        .ab-sec { padding:72px 0;position:relative; }
        .ab-eyebrow { display:inline-flex;align-items:center;gap:12px;color:#E0A800;font-size:.78rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase; }
        .ab-eyebrow::after { content:'';width:72px;max-width:18vw;height:1.5px;background:var(--gold); }
        .ab-head { text-align:center;margin:0 auto 40px;max-width:780px; }
        .ab-head .ab-eyebrow::before { content:'';width:48px;height:1.5px;background:var(--gold); }
        .ab-head .ab-eyebrow::after { width:48px; }
        .ab-title { font-size:clamp(1.5rem,3.2vw,2.3rem);font-weight:900;color:var(--dark);letter-spacing:-.02em;line-height:1.45;margin-top:10px; }
        .ab-subhead { display:flex;align-items:center;gap:18px;font-size:clamp(1.25rem,2.4vw,1.7rem);font-weight:900;color:var(--dark);line-height:1.5;margin-bottom:14px; }
        .ab-subhead::after { content:'';flex:0 0 72px;height:2px;border-radius:2px;background:var(--gold);opacity:.75; }
        .ab-text { color:#444;line-height:2.1;font-size:.95rem; }

        .ab-split { display:grid;grid-template-columns:1fr 1.1fr;gap:56px;align-items:start; }
        .ab-split--rev .ab-split__media { order:-1; }
        .ab-split--media-start .ab-split__media { order:2; }
        .ab-media { position:relative;margin:16px; }
        .ab-media::before { content:'';position:absolute;inset:-16px auto -16px -16px;width:58%;border:2px solid var(--gold);border-right:0;border-radius:22px 0 0 22px;z-index:0; }
        .ab-media img { position:relative;z-index:1;display:block;width:100%;aspect-ratio:2.2/1;max-height:340px;object-fit:cover;border-radius:18px;box-shadow:0 18px 44px rgba(0,0,0,.16);background:#222; }
        .ab-media--founder img { object-position:center 22%; }
        .ab-pill { align-self:flex-start; display:inline-flex;align-items:center;gap:10px;border:1.5px solid var(--gold);border-radius:999px;padding:9px 24px;color:var(--dark);font-weight:800;font-size:.85rem;background:#fff;box-shadow:0 6px 18px rgba(0,0,0,.06);transition:all .25s; }
        .ab-pill::after { content:'‹';color:#E0A800;font-size:1.2rem;line-height:1; }
        .ab-pill:hover { background:var(--gold);color:var(--dark);transform:translateY(-2px);box-shadow:0 10px 24px rgba(255,215,0,.3); }
        .ab-pill:hover::after { color:var(--dark); }

        .founder-name { font-size:1.15rem;font-weight:800;color:var(--dark);margin:16px 0 2px; }
        .founder-title { font-size:.86rem;color:#E0A800;font-weight:700;margin-bottom:16px; }
        .founder-bio { font-size:.92rem;color:#444;line-height:2.05; }

        .ab-row { display:grid;grid-template-columns:repeat(var(--cols,3),1fr); }
        .ab-row > * { padding:8px 28px;text-align:center;position:relative; }
        .ab-row > * + *::before { content:'';position:absolute;right:0;top:14%;bottom:14%;width:1.5px;background:var(--gold);opacity:.75; }
        .ab-ico { display:flex;justify-content:center;color:var(--dark);margin-bottom:12px; }
        .ab-row h3 { font-size:.98rem;font-weight:800;color:var(--dark);margin-bottom:8px;line-height:1.7; }
        .ab-row p { font-size:.85rem;color:var(--muted);line-height:1.95; }
        .ab-row .resume-list { text-align:right;max-width:380px;margin:14px auto 0; }
        .ab-row .vnum { font-size:1.9rem;font-weight:900;color:var(--gold);line-height:1;margin-bottom:12px; }
        .ab-row--grid2 > :nth-child(3n+1)::before { display:none; }
        .ab-tags { margin-top:48px;padding-top:26px;border-top:1px solid var(--border); }
        .ab-tags > * { display:flex;flex-direction:column;align-items:center;gap:10px;font-size:.9rem;font-weight:800;color:var(--dark); }
        .ab-tags .ab-ico { margin:0; }

        .resume-list { list-style:none;display:flex;flex-direction:column;gap:12px;padding:0;margin:0; }
        .resume-list li { display:flex;gap:10px;font-size:.9rem;color:#444;line-height:1.9; }
        .resume-list li .li-ico { width:8px;height:8px;border-radius:50%;background:var(--gold);flex-shrink:0;margin-top:.7em; }
        .ab-deco { position:relative;border-radius:20px;overflow:hidden;aspect-ratio:16/9;background:radial-gradient(circle at 30% 40%,rgba(255,215,0,.22),transparent 45%),linear-gradient(135deg,#2a2a2a 0%,#111 60%,#1d1d1d 100%);box-shadow:0 20px 46px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;color:var(--gold); }
        .ab-deco::before { content:'';position:absolute;inset:14px;border:1px solid rgba(255,215,0,.28);border-radius:14px; }
        .ab-deco::after { content:'';position:absolute;width:46%;aspect-ratio:1;border-radius:50%;border:1.5px dashed rgba(255,215,0,.25); }
        .ab-deco svg { position:relative;z-index:1;filter:drop-shadow(0 10px 26px rgba(255,215,0,.35)); }
        .ab-deco--light { background:linear-gradient(135deg,#FAFAFA,#ECECEC);color:var(--dark);box-shadow:0 18px 40px rgba(0,0,0,.08); }
        .ab-deco--light::before { border-color:rgba(0,0,0,.08); }
        .ab-deco--light::after { border-color:rgba(224,168,0,.45); }
        .ab-deco--light svg { filter:none; }

        .ab-band { background:linear-gradient(180deg,#F4F4F4,#FAFAFA);border-radius:50% 50% 50% 50% / 40px 40px 40px 40px; }
        .edu-certs { position:relative;display:grid;grid-template-columns:1fr 1fr;gap:0;padding:12px 0 24px; }
        .edu-cert { position:relative;display:block;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 18px 40px rgba(0,0,0,.16);transition:transform .3s,box-shadow .3s;border:1px solid var(--border); }
        .edu-cert:first-child { transform:rotate(-3deg) translateY(10px);z-index:1;margin-left:-28px; }
        .edu-cert:last-child { transform:rotate(3deg);z-index:2; }
        .edu-cert:hover { transform:rotate(0) translateY(-4px);z-index:3;box-shadow:0 24px 50px rgba(0,0,0,.22); }
        .edu-cert img { width:100%;aspect-ratio:4/3;object-fit:cover;object-position:top;display:block; }
        .edu-cert__cap { display:block;padding:8px 10px;font-size:.72rem;font-weight:700;color:var(--muted);text-align:center;border-top:1px solid var(--border); }

        .skills-head { display:flex;align-items:center;justify-content:center;gap:16px;font-size:1.2rem;font-weight:900;color:var(--dark);margin-bottom:24px; }
        .skills-head::before, .skills-head::after { content:'';width:48px;height:1.5px;background:var(--gold); }
        .skills-groups { display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:860px;margin:0 auto; }
        .skills-group { background:#F3F3F3;border-radius:18px;padding:22px 24px 26px; }
        .skills-group__label { display:inline-flex;align-items:center;gap:8px;font-size:.82rem;font-weight:800;color:#E0A800;margin-bottom:16px; }
        .skills-group__label::before { content:'';width:7px;height:7px;border-radius:50%;background:var(--gold); }
        .skills-chips { display:flex;flex-direction:column;align-items:center;gap:10px; }
        .skill-chip { display:inline-flex;justify-content:center;min-width:180px;background:#fff;border:1px solid var(--border);border-radius:999px;padding:8px 20px;font-size:.84rem;font-weight:700;color:var(--dark);box-shadow:0 4px 12px rgba(0,0,0,.04);transition:all .25s; }
        .skill-chip:hover { border-color:var(--gold);transform:translateY(-1px); }

        .ab-quote { background:#EFEFEF;position:relative;overflow:hidden;padding:46px 0;margin-top:64px; }
        .ab-quote::before { content:'';position:absolute;left:-60px;top:50%;width:200px;height:200px;transform:translateY(-50%);border-radius:50%;border:18px solid rgba(0,0,0,.05);box-shadow:inset 0 0 0 28px rgba(0,0,0,.025); }
        .ab-quote__inner { display:flex;gap:18px;align-items:flex-start;justify-content:center;max-width:820px;margin:0 auto;padding:0 24px; }
        .ab-quote__mark { font-size:4.4rem;line-height:.8;font-weight:900;color:#F2B705;font-family:Georgia,serif;flex-shrink:0; }
        .ab-quote p { font-size:clamp(1rem,1.8vw,1.15rem);font-weight:800;color:var(--dark);line-height:2;text-align:center; }
        .ab-quote__line { display:block;width:160px;height:1.5px;margin:16px auto 0;background:linear-gradient(90deg,transparent,var(--gold),transparent); }

        .ab-dark { position:relative;overflow:hidden;background:#0F0F0F;color:#fff;border-radius:50% 50% 50% 50% / 56px 56px 56px 56px;padding:84px 0 76px; }
        .ab-dark__img { position:absolute;inset:0 45% 0 0;background-size:cover;background-position:center;filter:grayscale(.6) brightness(.6);-webkit-mask-image:linear-gradient(270deg,transparent 0%,#000 55%);mask-image:linear-gradient(270deg,transparent 0%,#000 55%); }
        .ab-dark .container { position:relative;z-index:1; }
        .ab-dark__body { width:min(620px,100%);margin-right:0;margin-left:auto; }
        .ab-dark .ab-title { color:#fff;margin-bottom:34px; }
        .ab-dark .ab-row h3 { color:#fff; }
        .ab-dark .ab-row p { color:rgba(255,255,255,.62); }
        .ab-dark .ab-row > * { padding:4px 20px; }
        .ab-dark .ab-ico { color:var(--gold); }

        .ab-values { background:#F1EEEA;overflow:hidden;border-radius:50% 50% 0 0 / 48px 48px 0 0; }
        .ab-reel { position:absolute;left:-110px;bottom:-60px;width:300px;height:300px;border-radius:50%;pointer-events:none;opacity:.9;
          background:
            radial-gradient(circle at 50% 50%,#d9d9d9 0 9%,#8a8a8a 10% 12%,transparent 13%),
            radial-gradient(circle at 50% 22%,#1c1c1c 0 10%,transparent 11%),
            radial-gradient(circle at 50% 78%,#1c1c1c 0 10%,transparent 11%),
            radial-gradient(circle at 25% 36%,#1c1c1c 0 10%,transparent 11%),
            radial-gradient(circle at 75% 36%,#1c1c1c 0 10%,transparent 11%),
            radial-gradient(circle at 25% 64%,#1c1c1c 0 10%,transparent 11%),
            radial-gradient(circle at 75% 64%,#1c1c1c 0 10%,transparent 11%),
            conic-gradient(from 30deg,#e8e8e8,#7d7d7d,#f2f2f2,#6c6c6c,#e0e0e0,#808080,#e8e8e8);
          box-shadow:inset 0 0 0 10px #9a9a9a,inset 0 0 0 14px #d4d4d4,0 20px 40px rgba(0,0,0,.18); }
        .ab-values .ab-head .ab-eyebrow { font-size:1.15rem;letter-spacing:0;text-transform:none; }
        .ab-values .ab-row { max-width:900px;margin:0 auto;position:relative;z-index:1; }

        .ab-contact { background:#111;color:#fff;padding:40px 0; }
        .ab-contact__grid { display:grid;grid-template-columns:1fr auto 1fr;gap:32px;align-items:center; }
        .ab-contact__addr { display:flex;flex-direction:column;gap:14px; }
        .ab-contact__addr div { display:flex;gap:10px;align-items:flex-start; }
        .ab-contact__addr span { color:var(--gold);flex:0 0 auto;margin-top:2px; }
        .ab-contact__addr p { color:rgba(255,255,255,.66);font-size:.82rem;line-height:1.9; }
        .ab-contact__addr strong { color:#fff;display:block;font-size:.88rem; }
        .ab-contact__mid { text-align:center; }
        .ab-contact__logo { display:inline-flex;align-items:center;justify-content:center;width:84px;height:84px;border-radius:16px;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,.4); }
        .ab-contact__logo img { width:62px;height:62px;object-fit:contain; }
        .ab-contact__mid .tag { margin-top:14px; }
        .ab-contact__mid h2 { color:#fff;font-size:1.25rem;font-weight:900;margin-top:8px; }
        .ab-contact__links { display:flex;flex-direction:column;gap:12px;align-items:flex-end; }
        .ab-contact__link { display:flex;align-items:center;gap:12px;color:#fff;direction:rtl; }
        .ab-contact__link i { width:40px;height:40px;border-radius:50%;border:1.5px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;color:#fff;transition:all .25s;flex:0 0 auto; }
        .ab-contact__link:hover i { border-color:var(--gold);color:var(--gold); }
        .ab-contact__link small { display:block;font-size:.66rem;color:rgba(255,255,255,.4);font-weight:700; }
        .ab-contact__link b { font-size:.85rem;font-weight:700; }

        @media(max-width:900px){
          .ab-sec{padding:52px 0;}
          .ab-split{grid-template-columns:1fr;gap:32px;}
          .ab-split .ab-split__media{order:2;}
          .ab-row{--cols:1!important;}
          .ab-row > *{padding:20px 8px;}
          .ab-row > * + *::before{left:25%;right:25%;top:0;bottom:auto;width:auto;height:1.5px;background:linear-gradient(90deg,transparent,var(--gold),transparent);}
          .ab-row--grid2{--cols:2!important;}
          .ab-row--grid2 > * + *::before{display:none;}
          .ab-row--grid2 > *{border-top:1px solid var(--border);}
          .ab-tags{--cols:3!important;}
          .ab-tags > * + *::before{display:none;}
          .skills-groups{grid-template-columns:1fr;}
          .ab-dark{border-radius:28px;padding:56px 0;}
          .ab-dark__img{inset:0;opacity:.35;-webkit-mask-image:none;mask-image:none;}
          .ab-contact__grid{grid-template-columns:1fr;text-align:center;}
          .ab-contact__mid{order:-1;}
          .ab-contact__addr div{justify-content:center;text-align:right;}
          .ab-contact__links{align-items:center;}
          .ab-reel{width:200px;height:200px;left:-90px;}
        }
        @media(max-width:640px){
          .ab-row--grid2{--cols:1!important;}
          .ab-tags{--cols:2!important;}
          .about-hero__title{align-items:center;text-align:center;}
          .about-hero__title h2::after{right:50%;transform:translateX(50%);}
          .about-hero__down{width:38px;height:38px;}
          .ab-quote__mark{font-size:3rem;}
          .edu-cert:first-child{margin-left:-12px;}
          .skill-chip{min-width:0;width:100%;}
        }
      `}</style>

      <div id="about-slider">
        <PageSlider
          title={null}
          count={3}
          images={heroImages}
        />
        <div className="about-hero__title">
          <h2>{heroFirst}{heroLast ? <> <em>{heroLast}</em></> : null}</h2>
          {heroSub ? <p>{heroSub}</p> : null}
        </div>
        <a href="#about-founder" className="about-hero__down" aria-label="ادامه"><Icon name="arrowUp" size={20} /></a>
      </div>

      {/* بنیان‌گذار */}
      <section id="about-founder" className="ab-sec" style={{ background: 'var(--bg)', paddingTop: 76 }}>
        <div className="container">
          <div className="ab-split ab-split--media-start">
            <div>
              <span className="ab-eyebrow">{t('about.founder.eyebrow')}</span>
              <h2 className="ab-title">{t('about.founder.heading')}</h2>
              <p style={{ color: '#E0A800', fontWeight: 700, marginTop: 4 }}>{t('about.founder.subtitle')}</p>
              <div className="founder-name">{t('about.founder.name')}</div>
              <div className="founder-title">{t('about.founder.title')}</div>
              <p className="founder-bio" style={{ marginBottom: 14 }}>
                {t('about.founder.bio1')}
              </p>
              <p className="founder-bio" style={{ marginBottom: 14 }}>
                {t('about.founder.bio2')}
              </p>
              <p className="founder-bio">
                {t('about.founder.bio3')}
              </p>
              <p style={{ marginTop: 18 }}><Link href="/yaser-nazari" className="ab-pill">معرفی و سوابق یاسر نظری</Link></p>
            </div>
            <div className="ab-split__media">
              <div className="ab-media ab-media--founder"><img src={t('about.founder.image')} alt="یاسر نظری، بنیان‌گذار خانواده برداشت" loading="lazy" decoding="async" /></div>
            </div>
          </div>

          {(() => {
            const tags = splitLines(t('about.founder.tags'));
            return (
              <div className="ab-row ab-tags" style={{ '--cols': tags.length || 1 }}>
                {tags.map((tg, i) => (
                  <div key={tg}>
                    <div className="ab-ico"><Icon name={founderTagIcons[i % founderTagIcons.length]} size={28} strokeWidth={1.5} /></div>
                    <span>{tg}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </section>

      {/* سوابق و افتخارات حرفه‌ای */}
      <section id="about-resume" style={{ background: 'var(--white)' }}>
        <div className="ab-sec" style={{ paddingTop: 8, paddingBottom: 40 }}>
          <div className="container">
            <div className="ab-head">
              <span className="ab-eyebrow">{t('about.resume.eyebrow')}</span>
              <h2 className="ab-title">{t('about.resume.heading')}</h2>
            </div>
            <div className="ab-split">
              <div>
                <h3 className="ab-subhead">{t('about.honors.heading')}</h3>
                <ul className="resume-list">
                  {splitLines(t('about.honors.items')).map((it) => (
                    <li key={it}><span className="li-ico" /><span>{it}</span></li>
                  ))}
                </ul>
              </div>
              <div className="ab-split__media">
                <div className="ab-split__media">
                  <div className="ab-deco" aria-hidden="true"><Icon name="trophy" size={96} strokeWidth={1.1} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ab-band ab-sec">
          <div className="container">
            <div className="ab-split ab-split--rev">
              <div>
                <h3 className="ab-subhead">{t('about.edu.heading')}</h3>
                <ul className="resume-list">
                  {splitLines(t('about.edu.items')).map((it) => (
                    <li key={it}><span className="li-ico" /><span>{it}</span></li>
                  ))}
                </ul>
              </div>
              <div className="ab-split__media">
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
            </div>
          </div>
        </div>

        <div className="ab-sec" style={{ paddingBottom: 40 }}>
          <div className="container">
            <div className="ab-split">
              <div>
                <h3 className="ab-subhead">{t('about.licenses.heading')}</h3>
                <ul className="resume-list">
                  {splitLines(t('about.licenses.items')).map((it) => (
                    <li key={it}><span className="li-ico" /><span>{it}</span></li>
                  ))}
                </ul>
              </div>
              <div className="ab-split__media">
                <div className="ab-deco ab-deco--light" aria-hidden="true"><Icon name="scroll" size={88} strokeWidth={1.1} /></div>
              </div>
            </div>

            <div style={{ marginTop: 40 }}>
              <h3 className="skills-head">{t('about.skills.heading')}</h3>
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
        </div>
      </section>

      {/* معرفی آموزشگاه */}
      <section id="about-intro" style={{ background: 'var(--bg)' }}>
        <div className="ab-sec" style={{ paddingBottom: 0 }}>
          <div className="container">
            <div className="ab-split ab-split--media-start">
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

            <div className="ab-row" style={{ '--cols': 2, marginTop: 44 }}>
              <div>
                <div className="ab-ico"><Icon name="clapperboard" size={32} strokeWidth={1.4} /></div>
                <h3>{t('about.card1.title')}</h3>
                <p>{t('about.card1.body')}</p>
              </div>
              <div>
                <div className="ab-ico"><Icon name="shield" size={32} strokeWidth={1.4} /></div>
                <h3>{t('about.card2.title')}</h3>
                <p>{t('about.card2.body')}</p>
                <ul className="resume-list">
                  {splitLines(t('about.card2.items')).map((it) => (
                    <li key={it}><span className="li-ico" /><span>{it}</span></li>
                  ))}
                </ul>
              </div>
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
      <section id="about-path" className="ab-sec" style={{ background: 'var(--white)' }}>
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

      {/* چرا ما؟ */}
      <section id="about-creds" style={{ background: 'var(--white)', padding: '0 0 64px' }}>
        <div className="ab-dark">
          <div className="ab-dark__img" style={{ backgroundImage: `url(${bandImage})` }} aria-hidden="true" />
          <div className="container">
            <div className="ab-dark__body">
              <span className="ab-eyebrow">{t('about.creds.eyebrow')}</span>
              <h2 className="ab-title">{t('about.creds.heading')}</h2>
              <div className="ab-row" style={{ '--cols': 3 }}>
                <div><div className="ab-ico"><Icon name="trophy" size={32} strokeWidth={1.4} /></div><h3>{t('about.cred1.title')}</h3><p>{t('about.cred1.body')}</p></div>
                <div><div className="ab-ico"><Icon name="graduationCap" size={32} strokeWidth={1.4} /></div><h3>{t('about.cred2.title')}</h3><p>{t('about.cred2.body')}</p></div>
                <div><div className="ab-ico"><Icon name="sparkles" size={32} strokeWidth={1.4} /></div><h3>{t('about.cred3.title')}</h3><p>{t('about.cred3.body')}</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ارزش‌ها */}
      <section id="about-values" className="ab-sec ab-values">
        <span className="ab-reel" aria-hidden="true" />
        <div className="container">
          <div className="ab-head">
            <span className="ab-eyebrow">{t('about.values.eyebrow')}</span>
            <h2 className="ab-title">{t('about.values.heading')}</h2>
          </div>
          <div className="ab-row" style={{ '--cols': 3 }}>
            <div><div className="ab-ico"><Icon name="users" size={32} strokeWidth={1.4} /></div><h3>{t('about.value1.title')}</h3><p>{t('about.value1.body')}</p></div>
            <div><div className="ab-ico"><Icon name="trophy" size={32} strokeWidth={1.4} /></div><h3>{t('about.value2.title')}</h3><p>{t('about.value2.body')}</p></div>
            <div><div className="ab-ico"><Icon name="video" size={32} strokeWidth={1.4} /></div><h3>{t('about.value3.title')}</h3><p>{t('about.value3.body')}</p></div>
          </div>
        </div>
      </section>

      {/* تماس */}
      <section id="about-contact" className="ab-contact">
        <div className="container">
          <div className="ab-contact__grid">
            <div className="ab-contact__addr">
              {[
                { branch: 'شعبهٔ تهران', address: t('contact.tehranAddress') },
                { branch: 'شعبهٔ مازندران', address: t('contact.mazandaranAddress') },
              ].map(({ branch, address }) => (
                <div key={branch}>
                  <span><Icon name="mapPin" size={20} /></span>
                  <p><strong>{branch}</strong>{address}</p>
                </div>
              ))}
            </div>
            <div className="ab-contact__mid">
              <span className="ab-contact__logo"><img src="/bardasht-logo.png" alt="خانواده برداشت" loading="lazy" /></span>
              <div><span className="tag tag--gold">{t('about.contact.eyebrow')}</span></div>
              <h2>{t('about.contact.heading')}</h2>
            </div>
            <div className="ab-contact__links">
              {[
                { ico: 'phone', lbl: 'تلفن', val: t('contact.phone'), href: `tel:${t('contact.phone')}` },
                { ico: 'instagram', lbl: 'اینستاگرام', val: t('contact.instagram'), href: t('contact.instagramUrl') },
                { ico: 'chat', lbl: 'کانال بله', val: t('contact.bale'), href: t('contact.baleUrl') },
              ].map(c => (
                <a key={c.lbl} className="ab-contact__link" href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                  <i><Icon name={c.ico} size={18} /></i>
                  <span><small>{c.lbl}</small><b>{c.val}</b></span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
