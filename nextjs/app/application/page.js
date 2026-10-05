import PageLayout from '@/components/PageLayout';
import { loadContent, splitLines } from '@/lib/siteContent';
import styles from './page.module.css';

export const metadata = {
  title: 'اپلیکیشن خانواده برداشت',
  description: 'روش نصب و دریافت اپلیکیشن خانواده برداشت در اندروید و iOS.',
};

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
        <div className={`container container--sm ${styles.grid}`}>
          <article className={`${styles.card} ${styles.android}`}>
            <span className={styles.platform}>{t('application.android.platform')}</span>
            <h2 className="subheading">{t('application.android.title')}</h2>
            <p>{t('application.android.text')}</p>
            <div className={styles.actions}>
              <a href="https://github.com/yaasernazarii-ship-it/bardashtt/releases/download/v1.0.0/bardashtt.apk" className="btn btn--dark" download>
                {t('application.android.direct')}
              </a>
              <a href="https://cafebazaar.ir/app/com.bardashtt.app" className="btn btn--gold" target="_blank" rel="noopener noreferrer">
                {t('application.android.bazaar')}
              </a>
            </div>
          </article>

          <article className={`${styles.card} ${styles.ios}`}>
            <span className={styles.platform}>{t('application.ios.platform')}</span>
            <h2 className="subheading">{t('application.ios.title')}</h2>
            <p>{t('application.ios.text')}</p>
            <details className={styles.iosGuide}>
              <summary className="btn btn--dark">{t('application.ios.guide')}</summary>
              <ol className={styles.steps}>
                {iosSteps.map((step, index) => <li key={index}>{step}</li>)}
              </ol>
            </details>
          </article>
        </div>
      </section>
    </PageLayout>
  );
}
