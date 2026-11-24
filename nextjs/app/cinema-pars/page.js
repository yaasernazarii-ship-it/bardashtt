import PageLayout from '@/components/PageLayout';
import Icon from '@/components/Icon';
import CinemaParsForm from '@/components/CinemaParsForm';
import { loadContent } from '@/lib/siteContent';
import { siteUrl } from '@/lib/siteUrl';
import './cinema-pars.css';

export const dynamic = 'force-dynamic';

const TITLE = 'برداشت سینمای پارس';
const SLOGAN = 'تصویر، روایت، اندیشه';
const INTRO = 'مجموعه‌ای فعال در زمینه طراحی، مشاوره و تولید خدمات فرهنگی، هنری و رسانه‌ای';

const SERVICES = [
  { icon: 'clapperboard', title: 'تولید فیلم و سریال', text: 'طراحی، برنامه‌ریزی و تولید آثار سینمایی و تصویری.' },
  { icon: 'pencil', title: 'طراحی و مشاوره', text: 'ارائه خدمات مشاوره و طراحی در پروژه‌های فرهنگی و هنری.' },
  { icon: 'video', title: 'خدمات رسانه‌ای', text: 'توسعه و تولید محتوای تصویری و رسانه‌ای.' },
  { icon: 'sparkles', title: 'فعالیت‌های فرهنگی و هنری', text: 'طراحی و اجرای پروژه‌ها و فعالیت‌های فرهنگی و هنری.' },
];

const NAV = [
  { id: 'about', label: 'دربارهٔ مجموعه' },
  { id: 'services', label: 'حوزه‌های فعالیت' },
  { id: 'projects', label: 'پروژه‌ها' },
  { id: 'management', label: 'مدیریت' },
  { id: 'legal', label: 'اطلاعات حقوقی' },
  { id: 'contact', label: 'تماس' },
];

export async function generateMetadata() {
  const site = await siteUrl();
  const url = `${site}/cinema-pars`;
  const title = 'برداشت سینمای پارس | تولید فیلم و خدمات رسانه‌ای';
  const description = 'برداشت سینمای پارس؛ مجموعه‌ای فعال در طراحی، مشاوره و تولید خدمات فرهنگی، هنری و رسانه‌ای و تولید فیلم سینمایی خانه خاکی.';
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      url,
      siteName: TITLE,
      title,
      description,
      images: [{ url: '/cinema-pars/cp-hero.webp', width: 1568, height: 837, alt: TITLE }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/cinema-pars/cp-hero.webp'] },
  };
}

export default async function CinemaParsPage() {
  const t = await loadContent();
  const site = await siteUrl();
  const phone = t('contact.phone');

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${site}/cinema-pars#organization`,
        name: TITLE,
        alternateName: 'Cinema Pars',
        description: INTRO,
        url: `${site}/cinema-pars`,
        logo: `${site}/cinema-pars/cp-logo.webp`,
        image: `${site}/cinema-pars/cp-hero.webp`,
        telephone: phone ? `+98${phone.replace(/^0/, '')}` : undefined,
        identifier: { '@type': 'PropertyValue', name: 'شناسه ملی', value: '14015909396' },
        founder: { '@type': 'Person', name: 'یاسر نظری', jobTitle: 'مدیر مجموعه' },
        knowsAbout: ['تولید فیلم', 'سینما', 'مشاوره فرهنگی', 'تولید محتوای رسانه‌ای'],
      },
      {
        '@type': 'Movie',
        name: 'خانه خاکی',
        url: `${site}/cinema-pars#projects`,
        productionCompany: { '@id': `${site}/cinema-pars#organization` },
        description: 'فیلم سینمایی خانه خاکی، شمارهٔ ثبت در خانهٔ سینما ۶۷۳۵۰، در مرحلهٔ توسعه و آماده‌سازی تولید.',
      },
      {
        '@type': 'WebPage',
        '@id': `${site}/cinema-pars`,
        url: `${site}/cinema-pars`,
        name: TITLE,
        inLanguage: 'fa-IR',
        isPartOf: { '@id': `${site}/#organization` },
      },
    ],
  };

  return (
    <PageLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />

      <div className="cp">
        {/* هدر اختصاصی صفحه */}
        <header className="cp-bar">
          <div className="cp-bar__inner">
            <a href="#top" className="cp-brand">
              <img src="/cinema-pars/cp-logo.webp" alt={TITLE} width={48} height={48} />
              <span>
                <b>برداشت سینمای پارس</b>
                <small>Cinema Pars</small>
              </span>
            </a>
            <nav className="cp-nav" aria-label="بخش‌های صفحه">
              {NAV.map((n) => <a key={n.id} href={`#${n.id}`}>{n.label}</a>)}
            </nav>
            <a href="#collaborate" className="cp-btn cp-btn--solid cp-bar__cta">درخواست همکاری</a>
          </div>
        </header>

        {/* Hero */}
        <section id="top" className="cp-hero">
          <img className="cp-hero__img" src="/cinema-pars/cp-hero.webp" alt="" width="1568" height="837" fetchPriority="high" />
          <div className="cp-hero__veil" aria-hidden="true" />
          <div className="cp-wrap cp-hero__inner">
            <p className="cp-kicker">مجموعهٔ سینمایی</p>
            <h1 className="cp-hero__title">{TITLE}</h1>
            <p className="cp-hero__slogan">«{SLOGAN}»</p>
            <p className="cp-hero__text">{INTRO}</p>
            <div className="cp-hero__actions">
              <a href="#about" className="cp-btn cp-btn--solid">آشنایی با مجموعه</a>
              <a href="#collaborate" className="cp-btn cp-btn--ghost">درخواست همکاری</a>
            </div>
          </div>
        </section>

        {/* دربارهٔ مجموعه */}
        <section id="about" className="cp-sec">
          <div className="cp-wrap cp-split">
            <div>
              <p className="cp-kicker">معرفی</p>
              <h2 className="cp-h2">دربارهٔ {TITLE}</h2>
              <p className="cp-lead">
                {TITLE} با تمرکز بر طراحی، مشاوره و تولید خدمات فرهنگی، هنری و رسانه‌ای، در مسیر توسعهٔ ایده‌های خلاقانه و تبدیل آن‌ها به محصولات حرفه‌ای فعالیت می‌کند.
              </p>
              <p className="cp-text">
                این مجموعه با رویکردی مبتنی بر شناخت سینما، روایت تصویری و استانداردهای تولید، زمینهٔ همکاری با هنرمندان، متخصصان و فعالان حوزهٔ فرهنگ و رسانه را فراهم می‌کند.
              </p>
            </div>
            <figure className="cp-figure">
              <img src="/cinema-pars/cp-workshop.webp" alt="تمرین و آماده‌سازی گروهی در فضای تولید" width="1200" height="675" loading="lazy" decoding="async" />
              <figcaption>آماده‌سازی و تمرین گروهی، پیش از ورود به مرحلهٔ تولید</figcaption>
            </figure>
          </div>
        </section>

        {/* حوزه‌های فعالیت */}
        <section id="services" className="cp-sec cp-sec--alt">
          <div className="cp-wrap">
            <div className="cp-head">
              <p className="cp-kicker">خدمات</p>
              <h2 className="cp-h2">حوزه‌های فعالیت</h2>
            </div>
            <div className="cp-cards">
              {SERVICES.map((s) => (
                <article key={s.title} className="cp-card">
                  <span className="cp-card__ico" aria-hidden="true"><Icon name={s.icon} size={26} strokeWidth={1.4} /></span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* پروژه‌ها */}
        <section id="projects" className="cp-sec">
          <div className="cp-wrap">
            <div className="cp-head">
              <p className="cp-kicker">تولیدات</p>
              <h2 className="cp-h2">پروژه‌های سینمایی</h2>
            </div>
            <article className="cp-project">
              <figure className="cp-project__media">
                <img src="/cinema-pars/cp-workshop.webp" alt="تمرین گروهی، پیش از تولید فیلم خانه خاکی" width="1200" height="675" loading="lazy" decoding="async" />
              </figure>
              <div className="cp-project__body">
                <span className="cp-tag">پروژهٔ شاخص</span>
                <h3>فیلم سینمایی خانه خاکی</h3>
                <dl className="cp-facts">
                  <div><dt>عنوان</dt><dd>خانه خاکی</dd></div>
                  <div><dt>شمارهٔ ثبت در خانهٔ سینما</dt><dd><span dir="ltr">۶۷۳۵۰</span></dd></div>
                  <div><dt>وضعیت</dt><dd>در مرحلهٔ توسعه و آماده‌سازی تولید</dd></div>
                </dl>
              </div>
            </article>
          </div>
        </section>

        {/* مدیریت مجموعه — بدون هیچ تصویری از مدیر */}
        <section id="management" className="cp-sec cp-sec--alt">
          <div className="cp-wrap cp-management">
            <p className="cp-kicker">مدیریت</p>
            <h2 className="cp-h2">مدیر مجموعه</h2>
            <p className="cp-management__name">یاسر نظری</p>
            <p className="cp-management__role">مدیر مجموعه</p>
            <p className="cp-text cp-management__text">
              هدایت مجموعه بر پایهٔ شناخت سینما، روایت تصویری و استانداردهای حرفه‌ای تولید انجام می‌شود.
            </p>
          </div>
        </section>

        {/* اطلاعات حقوقی */}
        <section id="legal" className="cp-sec">
          <div className="cp-wrap">
            <div className="cp-head">
              <p className="cp-kicker">حقوقی</p>
              <h2 className="cp-h2">اطلاعات ثبتی و حقوقی</h2>
            </div>
            <dl className="cp-legal">
              <div><dt>نام مجموعه</dt><dd>{TITLE}</dd></div>
              <div><dt>شناسهٔ ملی</dt><dd><span dir="ltr">۱۴۰۱۵۹۰۹۳۹۶</span></dd></div>
              <div><dt>موضوع فعالیت</dt><dd>طراحی، مشاوره و تولید خدمات فرهنگی، هنری و رسانه‌ای</dd></div>
            </dl>
          </div>
        </section>

        {/* همکاری با ما */}
        <section id="collaborate" className="cp-sec cp-sec--alt">
          <div className="cp-wrap cp-split cp-split--form">
            <div>
              <p className="cp-kicker">همکاری</p>
              <h2 className="cp-h2">برای همکاری آماده‌ایم</h2>
              <p className="cp-lead">
                از همکاری با هنرمندان، فیلم‌سازان، تهیه‌کنندگان و فعالان حوزهٔ فرهنگ و رسانه استقبال می‌کنیم.
              </p>
              <figure className="cp-figure cp-figure--tall">
                <img src="/cinema-pars/cp-about.webp" alt="فضای تولید و اجرای برنامه در مجموعه" width="666" height="1000" loading="lazy" decoding="async" />
              </figure>
            </div>
            <CinemaParsForm />
          </div>
        </section>

        {/* تماس */}
        <section id="contact" className="cp-sec">
          <div className="cp-wrap">
            <div className="cp-head">
              <p className="cp-kicker">ارتباط</p>
              <h2 className="cp-h2">تماس با ما</h2>
            </div>
            <div className="cp-contact">
              <a className="cp-contact__item" href={`tel:${phone}`}>
                <span aria-hidden="true"><Icon name="phone" size={20} /></span>
                <small>تلفن</small>
                <b dir="ltr">{t('nav.support.phoneText')}</b>
              </a>
              <div className="cp-contact__item">
                <span aria-hidden="true"><Icon name="mapPin" size={20} /></span>
                <small>{t('contact.tehranLabel')}</small>
                <b>{t('contact.tehranAddress')}</b>
              </div>
              <div className="cp-contact__item">
                <span aria-hidden="true"><Icon name="mapPin" size={20} /></span>
                <small>{t('contact.mazandaranLabel')}</small>
                <b>{t('contact.mazandaranAddress')}</b>
              </div>
              <a className="cp-contact__item" href={t('contact.instagramUrl')} target="_blank" rel="noopener noreferrer">
                <span aria-hidden="true"><Icon name="instagram" size={20} /></span>
                <small>اینستاگرام</small>
                <b dir="ltr">{t('contact.instagram')}</b>
              </a>
            </div>
          </div>
        </section>

        {/* فوتر اختصاصی */}
        <footer className="cp-foot">
          <div className="cp-wrap cp-foot__inner">
            <div className="cp-foot__brand">
              <img src="/cinema-pars/cp-logo.webp" alt={TITLE} width={56} height={56} loading="lazy" />
              <div>
                <b>{TITLE}</b>
                <p>{INTRO}</p>
              </div>
            </div>
            <nav className="cp-foot__links" aria-label="بخش‌های صفحه">
              {NAV.map((n) => <a key={n.id} href={`#${n.id}`}>{n.label}</a>)}
            </nav>
            <div className="cp-foot__contact">
              <a href={`tel:${phone}`} dir="ltr">{t('nav.support.phoneText')}</a>
              <span>{t('contact.tehranAddress')}</span>
              <span>{t('contact.instagram')}</span>
            </div>
          </div>
          <div className="cp-wrap cp-foot__copy">© {TITLE} — تمامی حقوق محفوظ است.</div>
        </footer>
      </div>
    </PageLayout>
  );
}
