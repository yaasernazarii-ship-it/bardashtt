import PageLayout from '@/components/PageLayout';
import Icon from '@/components/Icon';
import CinemaParsForm from '@/components/CinemaParsForm';
import { loadContent, splitLines } from '@/lib/siteContent';
import { siteUrl } from '@/lib/siteUrl';
import './preview.css';

export const dynamic = 'force-dynamic';

const SERVICES = [
  { icon: 'clapperboard', n: 1, tag: 'تولید' },
  { icon: 'pencil', n: 2, tag: 'مشاوره' },
  { icon: 'video', n: 3, tag: 'رسانه' },
  { icon: 'sparkles', n: 4, tag: 'فرهنگ' },
];

const NAV = [
  { id: 'about', n: '۰۱', label: 'دربارهٔ مجموعه' },
  { id: 'services', n: '۰۲', label: 'حوزه‌های فعالیت' },
  { id: 'projects', n: '۰۳', label: 'پروژه' },
  { id: 'management', n: '۰۴', label: 'مدیریت' },
  { id: 'legal', n: '۰۵', label: 'اطلاعات حقوقی' },
  { id: 'contact', n: '۰۶', label: 'تماس' },
];

export const metadata = {
  title: 'پیش‌نمایش طراحی — برداشت سینمای پارس',
  robots: { index: false, follow: false },
};

export default async function CinemaParsPreview() {
  const t = await loadContent();
  const site = await siteUrl();
  const phone = t('contact.phone');
  const brandName = t('cp.hero.title');
  const logo = t('cp.logo');
  // بنر سرِ بلوک همکاری؛ اگر مدیر تصویر را خالی بگذارد، عکس واقعی کارگاه نمایش داده می‌شود.
  const collabImage = t('cp.collaborate.image') || '/cinema-pars/cp-workshop.webp';

  const services = SERVICES.map((s) => ({
    ...s,
    title: t(`cp.service${s.n}.title`),
    body: t(`cp.service${s.n}.body`),
  })).filter((s) => s.title || s.body);

  return (
    <PageLayout>
      <div className="cpx">
        {/* نوار بالای اختصاصی — اسلیت سر صحنه */}
        <header className="cpx-bar">
          <div className="cpx-wrap cpx-bar__in">
            <a href="#top" className="cpx-brand">
              {logo ? <img src={logo} alt={brandName} width={44} height={44} /> : null}
              <span>
                <b>{brandName}</b>
                {t('cp.brand.sub') ? <small>{t('cp.brand.sub')}</small> : null}
              </span>
            </a>
            <nav className="cpx-nav" aria-label="بخش‌های صفحه">
              {NAV.map((n) => (
                <a key={n.id} href={`#${n.id}`}>
                  <i aria-hidden="true">{n.n}</i>{n.label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        {/* هیرو — پردهٔ نمایش با لترباکس */}
        <section id="top" className="cpx-hero">
          <div className="cpx-hero__frame">
            {t('cp.hero.image') ? (
              <img className="cpx-hero__img" src={t('cp.hero.image')} alt="" width="1568" height="837" fetchPriority="high" />
            ) : null}
            <span className="cpx-hero__bar cpx-hero__bar--top" aria-hidden="true" />
            <span className="cpx-hero__bar cpx-hero__bar--bottom" aria-hidden="true" />
            <div className="cpx-hero__grain" aria-hidden="true" />
            <div className="cpx-wrap cpx-hero__copy">
              {t('cp.hero.eyebrow') ? (
                <p className="cpx-eyebrow"><span aria-hidden="true" />{t('cp.hero.eyebrow')}</p>
              ) : null}
              <h1 className="cpx-hero__title">
                <span>{brandName}</span>
              </h1>
              {t('cp.hero.slogan') ? <p className="cpx-hero__slogan">{t('cp.hero.slogan')}</p> : null}
              {t('cp.hero.text') ? <p className="cpx-hero__text">{t('cp.hero.text')}</p> : null}
              <div className="cpx-hero__acts">
                <a href="#about" className="cpx-btn cpx-btn--solid">{t('cp.hero.ctaPrimary')}</a>
                <a href="#collaborate" className="cpx-btn">{t('cp.hero.ctaSecondary')}</a>
              </div>
              {/* ردیف فنی اسلیت */}
              <dl className="cpx-slate">
                <div><dt>مجموعه</dt><dd>{t('cp.legal.name')}</dd></div>
                <div><dt>شناسهٔ ملی</dt><dd><span dir="ltr">{t('cp.legal.nationalId')}</span></dd></div>
                <div><dt>وضعیت</dt><dd>{t('cp.projects.statusValue')}</dd></div>
              </dl>
            </div>
          </div>
        </section>

        {/* دربارهٔ مجموعه */}
        <section id="about" className="cpx-sec">
          <div className="cpx-wrap cpx-sec__grid">
            <aside className="cpx-rail" aria-hidden="true">
              <span className="cpx-rail__n">۰۱</span>
              <span className="cpx-rail__t">معرفی</span>
            </aside>
            <div className="cpx-sec__body">
              {t('cp.about.kicker') ? <p className="cpx-kicker">{t('cp.about.kicker')}</p> : null}
              <h2 className="cpx-h2">{t('cp.about.heading')}</h2>
              <div className="cpx-about">
                <div>
                  {t('cp.about.p1') ? <p className="cpx-lead">{t('cp.about.p1')}</p> : null}
                  {t('cp.about.p2') ? <p className="cpx-text">{t('cp.about.p2')}</p> : null}
                </div>
                {t('cp.about.image') ? (
                  <figure className="cpx-fig">
                    <img src={t('cp.about.image')} alt={t('cp.about.imageAlt')} width="1200" height="675" loading="lazy" decoding="async" />
                    <span className="cpx-fig__corner" aria-hidden="true" />
                    {t('cp.about.imageCaption') ? <figcaption>{t('cp.about.imageCaption')}</figcaption> : null}
                  </figure>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* حوزه‌های فعالیت — نوار فیلم */}
        {services.length > 0 && (
          <section id="services" className="cpx-sec cpx-sec--alt">
            <div className="cpx-wrap">
              <div className="cpx-heada">
                <span className="cpx-heada__n" aria-hidden="true">۰۲</span>
                <div>
                  {t('cp.services.kicker') ? <p className="cpx-kicker">{t('cp.services.kicker')}</p> : null}
                  <h2 className="cpx-h2">{t('cp.services.heading')}</h2>
                </div>
              </div>
              <div className="cpx-strip">
                <span className="cpx-strip__perf" aria-hidden="true" />
                <div className="cpx-strip__grid">
                  {services.map((s) => (
                    <article key={s.n} className="cpx-frame">
                      <span className="cpx-frame__n" aria-hidden="true">۰{s.n}</span>
                      <span className="cpx-frame__ico" aria-hidden="true"><Icon name={s.icon} size={24} strokeWidth={1.3} /></span>
                      <em>{s.tag}</em>
                      <h3>{s.title}</h3>
                      {s.body ? <p>{s.body}</p> : null}
                    </article>
                  ))}
                </div>
                <span className="cpx-strip__perf" aria-hidden="true" />
              </div>
            </div>
          </section>
        )}

        {/* پروژه — پروندهٔ تولید */}
        <section id="projects" className="cpx-sec">
          <div className="cpx-wrap">
            <div className="cpx-heada">
              <span className="cpx-heada__n" aria-hidden="true">۰۳</span>
              <div>
                {t('cp.projects.kicker') ? <p className="cpx-kicker">{t('cp.projects.kicker')}</p> : null}
                <h2 className="cpx-h2">{t('cp.projects.heading')}</h2>
              </div>
            </div>

            <article className="cpx-dossier">
              {t('cp.projects.image') ? (
                <figure className="cpx-dossier__media">
                  <img src={t('cp.projects.image')} alt={t('cp.projects.imageAlt')} width="1200" height="675" loading="lazy" decoding="async" />
                  <span className="cpx-dossier__stamp">{t('cp.projects.statusValue')}</span>
                </figure>
              ) : null}
              <div className="cpx-dossier__body">
                {t('cp.projects.tag') ? <span className="cpx-tag">{t('cp.projects.tag')}</span> : null}
                <h3>{t('cp.projects.title')}</h3>
                <dl className="cpx-facts">
                  {t('cp.projects.registerValue') ? (
                    <div>
                      <dt>{t('cp.projects.registerLabel')}</dt>
                      <dd><span dir="ltr">{t('cp.projects.registerValue')}</span></dd>
                    </div>
                  ) : null}
                  {t('cp.projects.statusValue') ? (
                    <div>
                      <dt>{t('cp.projects.statusLabel')}</dt>
                      <dd>{t('cp.projects.statusValue')}</dd>
                    </div>
                  ) : null}
                </dl>

                {/* تایم‌لاین تولید — فقط مرحلهٔ جاری فعال است */}
                <ol className="cpx-steps" aria-label="مراحل تولید">
                  <li className="is-current">
                    <span className="cpx-steps__dot" aria-hidden="true" />
                    <b>توسعه</b>
                    <small>مرحلهٔ جاری</small>
                  </li>
                  <li>
                    <span className="cpx-steps__dot" aria-hidden="true" />
                    <b>پیش‌تولید</b>
                  </li>
                  <li>
                    <span className="cpx-steps__dot" aria-hidden="true" />
                    <b>تولید</b>
                  </li>
                </ol>
              </div>
            </article>
          </div>
        </section>

        {/* مدیریت — بدون تصویر */}
        <section id="management" className="cpx-sec cpx-sec--dark">
          <div className="cpx-wrap cpx-manage">
            <span className="cpx-manage__n" aria-hidden="true">۰۴</span>
            {t('cp.management.kicker') ? <p className="cpx-kicker cpx-kicker--c">{t('cp.management.kicker')}</p> : null}
            <h2 className="cpx-h2 cpx-h2--c">{t('cp.management.heading')}</h2>
            <p className="cpx-manage__name">{t('cp.management.name')}</p>
            <p className="cpx-manage__role">{t('cp.management.role')}</p>
            {t('cp.management.text') ? <p className="cpx-text cpx-manage__text">{t('cp.management.text')}</p> : null}
          </div>
        </section>

        {/* اطلاعات حقوقی — تیتراژ */}
        <section id="legal" className="cpx-sec">
          <div className="cpx-wrap">
            <div className="cpx-heada">
              <span className="cpx-heada__n" aria-hidden="true">۰۵</span>
              <div>
                {t('cp.legal.kicker') ? <p className="cpx-kicker">{t('cp.legal.kicker')}</p> : null}
                <h2 className="cpx-h2">{t('cp.legal.heading')}</h2>
              </div>
            </div>
            <dl className="cpx-credits">
              {t('cp.legal.name') ? <div><dt>نام مجموعه</dt><dd>{t('cp.legal.name')}</dd></div> : null}
              {t('cp.legal.nationalId') ? <div><dt>شناسهٔ ملی</dt><dd><span dir="ltr">{t('cp.legal.nationalId')}</span></dd></div> : null}
              {t('cp.legal.subject') ? <div><dt>موضوع فعالیت</dt><dd>{t('cp.legal.subject')}</dd></div> : null}
            </dl>
          </div>
        </section>

        {/* درخواست همکاری — یک بلوک کامل و یک‌پارچه */}
        <section id="collaborate" className="cpx-sec cpx-sec--alt">
          <div className="cpx-wrap cpx-collab">
            <figure className="cpx-collab__banner">
              <img src={collabImage} alt={t('cp.collaborate.imageAlt')} width="1200" height="525" loading="lazy" decoding="async" />
            </figure>

            <div className="cpx-collab__head">
              <span className="cpx-heada__n" aria-hidden="true">۰۶</span>
              {t('cp.collaborate.kicker') ? <p className="cpx-kicker cpx-kicker--c">{t('cp.collaborate.kicker')}</p> : null}
              <h2 className="cpx-h2 cpx-h2--c">{t('cp.collaborate.heading')}</h2>
              {t('cp.collaborate.text') ? <p className="cpx-collab__lead">{t('cp.collaborate.text')}</p> : null}
            </div>

            <div className="cpx-collab__panel">
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
        <section id="contact" className="cpx-sec cpx-sec--dark">
          <div className="cpx-wrap">
            <div className="cpx-heada">
              <span className="cpx-heada__n" aria-hidden="true">۰۷</span>
              <div>
                {t('cp.contact.kicker') ? <p className="cpx-kicker">{t('cp.contact.kicker')}</p> : null}
                <h2 className="cpx-h2">{t('cp.contact.heading')}</h2>
              </div>
            </div>
            <ul className="cpx-contact">
              <li>
                <a href={`tel:${phone}`}>
                  <span className="cpx-contact__ico"><Icon name="phone" size={18} /></span>
                  <small>{t('cp.contact.phoneLabel')}</small>
                  <b dir="ltr">{t('nav.support.phoneText')}</b>
                </a>
              </li>
              <li>
                <span className="cpx-contact__ico"><Icon name="mapPin" size={18} /></span>
                <small>{t('contact.tehranLabel')}</small>
                <b>{t('contact.tehranAddress')}</b>
              </li>
              <li>
                <span className="cpx-contact__ico"><Icon name="mapPin" size={18} /></span>
                <small>{t('contact.mazandaranLabel')}</small>
                <b>{t('contact.mazandaranAddress')}</b>
              </li>
              <li>
                <a href={t('contact.instagramUrl')} target="_blank" rel="noopener noreferrer">
                  <span className="cpx-contact__ico"><Icon name="instagram" size={18} /></span>
                  <small>{t('cp.contact.instagramLabel')}</small>
                  <b dir="ltr">{t('contact.instagram')}</b>
                </a>
              </li>
            </ul>
          </div>
        </section>

        {/* تیتراژ پایانی */}
        <footer className="cpx-foot">
          <div className="cpx-wrap cpx-foot__grid">
            <div className="cpx-foot__brand">
              {logo ? <img src={logo} alt={brandName} width={52} height={52} loading="lazy" /> : null}
              <div>
                <b>{brandName}</b>
                {t('cp.footer.text') ? <p>{t('cp.footer.text')}</p> : null}
              </div>
            </div>
            <nav className="cpx-foot__links" aria-label="بخش‌های صفحه">
              {NAV.map((n) => <a key={n.id} href={`#${n.id}`}><i aria-hidden="true">{n.n}</i>{n.label}</a>)}
            </nav>
            <div className="cpx-foot__meta">
              <a href={`tel:${phone}`} dir="ltr">{t('nav.support.phoneText')}</a>
              <span>{t('contact.tehranAddress')}</span>
              <span dir="ltr">{t('contact.instagram')}</span>
            </div>
          </div>
          <div className="cpx-wrap cpx-foot__copy">
            <span>{t('cp.footer.copyright')}</span>
            <span className="cpx-foot__note">پیش‌نمایش طراحی — این نشانی موقت است و در گوگل ثبت نمی‌شود</span>
          </div>
        </footer>
      </div>
    </PageLayout>
  );
}
