import PageLayout from '@/components/PageLayout';
import Icon from '@/components/Icon';
import { loadContent, splitLines } from '@/lib/siteContent';
import styles from './page.module.css';

export const metadata = {
  title: 'اپلیکیشن خانواده برداشت',
  description: 'روش نصب و دریافت اپلیکیشن خانواده برداشت در اندروید و iOS.',
};

function AndroidLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 18c0 .55.45 1 1 1h1v3.5a1.5 1.5 0 0 0 3 0V19h2v3.5a1.5 1.5 0 0 0 3 0V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8A1.5 1.5 0 0 0 2 9.5v7a1.5 1.5 0 0 0 3 0v-7A1.5 1.5 0 0 0 3.5 8zm17 0A1.5 1.5 0 0 0 19 9.5v7a1.5 1.5 0 0 0 3 0v-7A1.5 1.5 0 0 0 20.5 8zm-4.97-5.84 1.3-1.3a.5.5 0 0 0-.7-.7l-1.48 1.48A5.84 5.84 0 0 0 12 1c-.96 0-1.86.23-2.66.63L7.85.15a.5.5 0 0 0-.7.7l1.31 1.31A5.97 5.97 0 0 0 6 7h12a5.97 5.97 0 0 0-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
    </svg>
  );
}

function AppleLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.67zM14.1 5.84c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.58.67-1.09 1.75-.96 2.79 1.02.08 2.05-.52 2.68-1.27z" />
    </svg>
  );
}

function BagIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 7V6a4 4 0 0 1 8 0v1h3a1 1 0 0 1 1 .93l.8 12A2 2 0 0 1 18.8 22H5.2a2 2 0 0 1-2-2.07l.8-12A1 1 0 0 1 5 7h3zm2 0h4V6a2 2 0 0 0-4 0v1z" />
    </svg>
  );
}

function ApkIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2.5h8l4.5 4.5v14.5H6z" />
      <path d="M14 2.5V7h4.5" />
      <rect x="3" y="11.5" width="15" height="7" rx="1.5" fill="currentColor" stroke="none" />
      <text x="10.5" y="17" textAnchor="middle" fontSize="5.4" fontWeight="800" fill="#fff" stroke="none" fontFamily="Arial, sans-serif">APK</text>
    </svg>
  );
}

function Chevron() {
  return (
    <svg className={styles.chevron} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

// کلمهٔ لاتین عنوان (مثل Android) فقط برای نمایش به شکل خوشنویسی برجسته می‌شود؛ متن از پنل می‌آید.
function AccentTitle({ text, className }) {
  const match = /^(.*?)([A-Za-z][A-Za-z ]*[A-Za-z])\s*$/.exec(text || '');
  if (!match) return <h2 className={className}>{text}</h2>;
  return (
    <h2 className={className}>
      {match[1].trim()}
      <span className={styles.script} dir="ltr">{match[2]}</span>
    </h2>
  );
}

export default async function ApplicationPage() {
  const t = await loadContent();
  const iosSteps = splitLines(t('application.ios.steps'));
  return (
    <PageLayout>
      <section className={styles.hero}>
        <div className="container container--sm">
          <span className="tag tag--gold">{t('application.tag')}</span>
          <h1 className="heading" style={{ marginTop: 16 }}>{t('application.title')}</h1>
          <p className="body-lg" style={{ marginTop: 16 }}>
            {t('application.intro')}
          </p>
        </div>
      </section>

      <section className={styles.platforms}>
        <div className={`container ${styles.grid}`}>
          <article className={`${styles.card} ${styles.android}`}>
            <div className={styles.androidArt} aria-hidden="true">
              <span className={styles.brush} />
              <span className={`${styles.brush} ${styles.brushTwo}`} />
              <div className={`${styles.phone} ${styles.phoneDark}`}>
                <span className={styles.notch} />
                <span className={styles.androidTile}><AndroidLogo size={64} /></span>
                <span className={styles.downloadDot}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v13" /><polyline points="6 12 12 18 18 12" /></svg>
                </span>
              </div>
            </div>

            <div className={styles.body}>
              <span className={`${styles.platform} ${styles.platformDark}`}>
                {t('application.android.platform')}
                <span className={styles.platformIcon}><AndroidLogo size={20} /></span>
              </span>
              <AccentTitle text={t('application.android.title')} className={`${styles.title} ${styles.titleLight}`} />
              <p className={styles.text}>{t('application.android.text')}</p>
              <div className={styles.actions}>
                <a href="https://cafebazaar.ir/app/com.bardashtt.app" className={`${styles.cta} ${styles.ctaYellow}`} target="_blank" rel="noopener noreferrer">
                  <span className={styles.ctaIcon}><BagIcon /></span>
                  <span className={styles.ctaLabel}>{t('application.android.bazaar')}</span>
                  <Chevron />
                </a>
                <a href="https://github.com/yaasernazarii-ship-it/bardashtt/releases/download/v1.0.0/bardashtt.apk" className={`${styles.cta} ${styles.ctaOutline}`} download>
                  <span className={styles.ctaIcon}><ApkIcon /></span>
                  <span className={styles.ctaLabel}>{t('application.android.direct')}</span>
                  <Chevron />
                </a>
              </div>
            </div>
          </article>

          <article className={`${styles.card} ${styles.ios}`}>
            <div className={styles.iosArt} aria-hidden="true">
              <div className={`${styles.phone} ${styles.phoneLight}`}>
                <span className={styles.notch} />
                <span className={styles.appTile}>
                  <img src="/pwa-192.png" alt="" width="72" height="72" />
                </span>
              </div>
              <span className={styles.arrow} />
              <span className={styles.addBubble}>
                <span className={styles.addIcon}><Icon name="plus" size={22} /></span>
                <span dir="ltr">Add to<br />Home Screen</span>
              </span>
            </div>

            <div className={styles.body}>
              <span className={`${styles.platform} ${styles.platformLight}`}>
                {t('application.ios.platform')}
                <span className={styles.platformIcon}><AppleLogo /></span>
              </span>
              <h2 className={`${styles.title} ${styles.titleDark}`}>
                <span className={styles.squiggle}>{t('application.ios.title')}</span>
              </h2>
              <p className={styles.text}>{t('application.ios.text')}</p>
              <details className={styles.iosGuide}>
                <summary className={`${styles.cta} ${styles.ctaNavy}`}>
                  <span className={styles.ctaIcon}><Icon name="bookOpen" size={22} /></span>
                  <span className={styles.ctaLabel}>{t('application.ios.guide')}</span>
                  <Chevron />
                </summary>
                <ol className={styles.steps}>
                  {iosSteps.map((step, index) => <li key={index}>{step}</li>)}
                </ol>
              </details>
            </div>
          </article>
        </div>
      </section>
    </PageLayout>
  );
}
