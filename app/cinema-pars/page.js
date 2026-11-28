import PageLayout from '@/components/PageLayout';
import Icon from '@/components/Icon';
import CinemaParsForm from '@/components/CinemaParsForm';
import { loadContent, splitLines } from '@/lib/siteContent';
import { siteUrl } from '@/lib/siteUrl';
import './cinema-pars.css';

export const dynamic = 'force-dynamic';

const SERVICES = [
  { icon: 'clapperboard', n: 1 },
  { icon: 'pencil', n: 2 },
  { icon: 'video', n: 3 },
  { icon: 'sparkles', n: 4 },
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
  const t = await loadContent();
  const url = `${site}/cinema-pars`;
  const title = `${t('cp.hero.title')} | ${t('cp.services.heading')} و ${t('cp.projects.heading')}`;
  const description = `${t('cp.hero.text')} — ${t('cp.projects.title')}.`;
  const image = t('cp.hero.image') || '/cinema-pars/cp-hero.webp';
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      url,
      siteName: t('cp.hero.title'),
      title,
      description,
      images: [{ url: image, alt: t('cp.hero.title') }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function CinemaParsPage() {
  const t = await loadContent();
  const site = await siteUrl();
  const phone = t('contact.phone');
  const brandName = t('cp.hero.title');
  const logo = t('cp.logo');

  const services = SERVICES.map((s) => ({
    ...s,
    title: t(`cp.service${s.n}.title`),
    body: t(`cp.service${s.n}.body`),
  })).filter((s) => s.title || s.body);

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${site}/cinema-pars#organization`,
        name: brandName,
        alternateName: 'Cinema Pars',
        description: t('cp.hero.text'),
        url: `${site}/cinema-pars`,
        ...(logo ? { logo: `${site}${logo.startsWith('http') ? '' : ''}${logo}` } : {}),
        telephone: phone ? `+98${phone.replace(/^0/, '')}` : undefined,
        identifier: { '@type': 'PropertyValue', name: 'شناسه ملی', value: t('cp.legal.nationalId') },
        founder: { '@type': 'Person', name: t('cp.management.name'), jobTitle: t('cp.management.role') },
        knowsAbout: ['تولید فیلم', 'سینما', 'مشاوره فرهنگی', 'تولید محتوای رسانه‌ای'],
      },
      {
        '@type': 'Movie',
        name: t('cp.projects.title'),
        url: `${site}/cinema-pars#projects`,
        productionCompany: { '@id': `${site}/cinema-pars#organization` },
        description: `${t('cp.projects.title')}، ${t('cp.projects.registerLabel')} ${t('cp.projects.registerValue')}، ${t('cp.projects.statusValue')}.`,
      },
      {
        '@type': 'WebPage',
        '@id': `${site}/cinema-pars`,
        url: `${site}/cinema-pars`,
        name: brandName,
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
              {logo ? <img src={logo} alt={brandName} width={48} height={48} /> : null}
              <span>
                <b>{brandName}</b>
                {t('cp.brand.sub') ? <small>{t('cp.brand.sub')}</small> : null}
              </span>
            </a>
            <nav className="cp-nav" aria-label="بخش‌های صفحه">
              {NAV.map((n) => <a key={n.id} href={`#${n.id}`}>{n.label}</a>)}
            </nav>
          </div>
        </header>

        {/* Hero */}
        <section id="top" className="cp-hero">
          {t('cp.hero.image') ? (
            <img className="cp-hero__img" src={t('cp.hero.image')} alt="" width="1568" height="837" fetchPriority="high" />
          ) : null}
          <div className="cp-hero__veil" aria-hidden="true" />
          <div className="cp-wrap cp-hero__inner">
            {t('cp.hero.eyebrow') ? <p className="cp-kicker">{t('cp.hero.eyebrow')}</p> : null}
            <h1 className="cp-hero__title">{brandName}</h1>
            {t('cp.hero.slogan') ? <p className="cp-hero__slogan">«{t('cp.hero.slogan')}»</p> : null}
            {t('cp.hero.text') ? <p className="cp-hero__text">{t('cp.hero.text')}</p> : null}
            <div className="cp-hero__actions">
              <a href="#about" className="cp-btn cp-btn--solid">{t('cp.hero.ctaPrimary')}</a>
              <a href="#collaborate" className="cp-btn cp-btn--ghost">{t('cp.hero.ctaSecondary')}</a>
            </div>
          </div>
        </section>

        {/* دربارهٔ مجموعه */}
        <section id="about" className="cp-sec">
          <div className={`cp-wrap${t('cp.about.image') ? ' cp-split' : ''}`}>
            <div>
              {t('cp.about.kicker') ? <p className="cp-kicker">{t('cp.about.kicker')}</p> : null}
              <h2 className="cp-h2">{t('cp.about.heading')}</h2>
              {t('cp.about.p1') ? <p className="cp-lead">{t('cp.about.p1')}</p> : null}
              {t('cp.about.p2') ? <p className="cp-text">{t('cp.about.p2')}</p> : null}
            </div>
            {t('cp.about.image') ? (
              <figure className="cp-figure">
                <img src={t('cp.about.image')} alt={t('cp.about.imageAlt')} width="1200" height="675" loading="lazy" decoding="async" />
                {t('cp.about.imageCaption') ? <figcaption>{t('cp.about.imageCaption')}</figcaption> : null}
              </figure>
            ) : null}
          </div>
        </section>

        {/* حوزه‌های فعالیت */}
        {services.length > 0 && (
          <section id="services" className="cp-sec cp-sec--alt">
            <div className="cp-wrap">
              <div className="cp-head">
                {t('cp.services.kicker') ? <p className="cp-kicker">{t('cp.services.kicker')}</p> : null}
                <h2 className="cp-h2">{t('cp.services.heading')}</h2>
              </div>
              <div className="cp-cards">
                {services.map((s) => (
                  <article key={s.n} className="cp-card">
                    <span className="cp-card__ico" aria-hidden="true"><Icon name={s.icon} size={26} strokeWidth={1.4} /></span>
                    <h3>{s.title}</h3>
                    {s.body ? <p>{s.body}</p> : null}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* پروژه‌ها */}
        <section id="projects" className="cp-sec">
          <div className="cp-wrap">
            <div className="cp-head">
              {t('cp.projects.kicker') ? <p className="cp-kicker">{t('cp.projects.kicker')}</p> : null}
              <h2 className="cp-h2">{t('cp.projects.heading')}</h2>
            </div>
            <article className="cp-project">
              {t('cp.projects.image') ? (
                <figure className="cp-project__media">
                  <img src={t('cp.projects.image')} alt={t('cp.projects.imageAlt')} width="1200" height="675" loading="lazy" decoding="async" />
                </figure>
              ) : null}
              <div className="cp-project__body">
                {t('cp.projects.tag') ? <span className="cp-tag">{t('cp.projects.tag')}</span> : null}
                <h3>{t('cp.projects.title')}</h3>
                <dl className="cp-facts">
                  {t('cp.projects.registerValue') ? (
                    <div><dt>{t('cp.projects.registerLabel')}</dt><dd><span dir="ltr">{t('cp.projects.registerValue')}</span></dd></div>
                  ) : null}
                  {t('cp.projects.statusValue') ? (
                    <div><dt>{t('cp.projects.statusLabel')}</dt><dd>{t('cp.projects.statusValue')}</dd></div>
                  ) : null}
                </dl>
              </div>
            </article>
          </div>
        </section>

        {/* مدیریت مجموعه — بدون هیچ تصویری از مدیر */}
        <section id="management" className="cp-sec cp-sec--alt">
          <div className="cp-wrap cp-management">
            {t('cp.management.kicker') ? <p className="cp-kicker">{t('cp.management.kicker')}</p> : null}
            <h2 className="cp-h2">{t('cp.management.heading')}</h2>
            <p className="cp-management__name">{t('cp.management.name')}</p>
            <p className="cp-management__role">{t('cp.management.role')}</p>
            {t('cp.management.text') ? <p className="cp-text cp-management__text">{t('cp.management.text')}</p> : null}
          </div>
        </section>

        {/* اطلاعات حقوقی */}
        <section id="legal" className="cp-sec">
          <div className="cp-wrap">
            <div className="cp-head">
              {t('cp.legal.kicker') ? <p className="cp-kicker">{t('cp.legal.kicker')}</p> : null}
              <h2 className="cp-h2">{t('cp.legal.heading')}</h2>
            </div>
            <dl className="cp-legal">
              {t('cp.legal.name') ? <div><dt>نام مجموعه</dt><dd>{t('cp.legal.name')}</dd></div> : null}
              {t('cp.legal.nationalId') ? <div><dt>شناسهٔ ملی</dt><dd><span dir="ltr">{t('cp.legal.nationalId')}</span></dd></div> : null}
              {t('cp.legal.subject') ? <div><dt>موضوع فعالیت</dt><dd>{t('cp.legal.subject')}</dd></div> : null}
            </dl>
          </div>
        </section>

        {/* درخواست همکاری — یک بلوک کامل */}
        <section id="collaborate" className="cp-sec cp-sec--alt">
          <div className="cp-wrap cp-collab">
            <figure className="cp-collab__banner">
              <img src={t('cp.collaborate.image') || '/cinema-pars/cp-workshop.webp'} alt={t('cp.collaborate.imageAlt')} width="1200" height="525" loading="lazy" decoding="async" />
            </figure>

            <div className="cp-collab__head">
              {t('cp.collaborate.kicker') ? <p className="cp-kicker cp-kicker--c">{t('cp.collaborate.kicker')}</p> : null}
              <h2 className="cp-h2 cp-h2--c">{t('cp.collaborate.heading')}</h2>
              {t('cp.collaborate.text') ? <p className="cp-collab__lead">{t('cp.collaborate.text')}</p> : null}
            </div>

            <div className="cp-collab__panel">
              <CinemaParsForm
                labels={{
                  name: t('cp.form.name'),
                  phone: t('cp.form.phone'),
                  email: t('cp.form.email'),
                  emailOptional: t('cp.form.emailOptional'),
                  subject: t('cp.form.subject'),
                  message: t('cp.form.message'),
                  placeholder: t('cp.form.placeholder'),
                  subjects: splitLines(t('cp.form.subjects')),
                  submit: t('cp.form.submit'),
                  sending: t('cp.form.sending'),
                  note: t('cp.form.note'),
                  successTitle: t('cp.form.successTitle'),
                  successText: t('cp.form.successText'),
                  successAgain: t('cp.form.successAgain'),
                }}
              />
            </div>
          </div>
        </section>

        {/* تماس */}
        <section id="contact" className="cp-sec">
          <div className="cp-wrap">
            <div className="cp-head">
              {t('cp.contact.kicker') ? <p className="cp-kicker">{t('cp.contact.kicker')}</p> : null}
              <h2 className="cp-h2">{t('cp.contact.heading')}</h2>
            </div>
            <div className="cp-contact">
              <a className="cp-contact__item" href={`tel:${phone}`}>
                <span aria-hidden="true"><Icon name="phone" size={20} /></span>
                <small>{t('cp.contact.phoneLabel')}</small>
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
                <small>{t('cp.contact.instagramLabel')}</small>
                <b dir="ltr">{t('contact.instagram')}</b>
              </a>
            </div>
          </div>
        </section>

        {/* نوار پایانی اختصاصی */}
        <footer className="cp-foot">
          <div className="cp-wrap cp-foot__inner">
            <div className="cp-foot__brand">
              {logo ? <img src={logo} alt={brandName} width={56} height={56} loading="lazy" /> : null}
              <div>
                <b>{brandName}</b>
                {t('cp.footer.text') ? <p>{t('cp.footer.text')}</p> : null}
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
          <div className="cp-wrap cp-foot__copy">{t('cp.footer.copyright')}</div>
        </footer>
      </div>
    </PageLayout>
  );
}
