import PageLayout from '@/components/PageLayout';
import styles from './page.module.css';

export const metadata = {
  title: 'اپلیکیشن خانواده برداشت',
  description: 'روش نصب و دریافت اپلیکیشن خانواده برداشت در اندروید و iOS.',
};

export default function ApplicationPage() {
  return (
    <PageLayout>
      <section className={styles.hero}>
        <div className="container container--sm">
          <span className="tag tag--gold">اپلیکیشن خانواده برداشت</span>
          <h1 className="heading" style={{ marginTop: 16 }}>خانواده برداشت، همیشه همراه شما</h1>
          <p className="body-lg" style={{ marginTop: 16 }}>
            اپلیکیشن را روی گوشی خود نصب کنید تا سریع‌تر به دوره‌ها، حساب کاربری و جامعهٔ برداشت دسترسی داشته باشید.
          </p>
        </div>
      </section>

      <section className={styles.platforms}>
        <div className={`container container--sm ${styles.grid}`}>
          <article className={`${styles.card} ${styles.android}`}>
            <span className={styles.platform}>اندروید</span>
            <h2 className="subheading">دریافت برای Android</h2>
            <p>می‌توانید اپلیکیشن را مستقیم دریافت کنید یا از کافه‌بازار نصب کنید.</p>
            <div className={styles.actions}>
              <a href="https://github.com/yaasernazarii-ship-it/bardashtt/releases/download/v1.0.0/bardashtt.apk" className="btn btn--dark" download>
                دانلود مستقیم APK
              </a>
              <a href="https://cafebazaar.ir/app/com.bardashtt.app" className="btn btn--gold" target="_blank" rel="noopener noreferrer">
                دانلود از کافه‌بازار
              </a>
            </div>
          </article>

          <article className={`${styles.card} ${styles.ios}`}>
            <span className={styles.platform}>iPhone و iPad</span>
            <h2 className="subheading">افزودن به صفحهٔ اصلی</h2>
            <p>در iPhone یا iPad، سایت را با Safari باز کنید و این سه گام را انجام دهید:</p>
            <ol className={styles.steps}>
              <li>در پایین Safari، دکمهٔ <strong>Share</strong> را بزنید.</li>
              <li>گزینهٔ <strong>Add to Home Screen</strong> را انتخاب کنید.</li>
              <li>روی <strong>Add</strong> بزنید تا آیکون خانواده برداشت به صفحهٔ اصلی اضافه شود.</li>
            </ol>
          </article>
        </div>
      </section>
    </PageLayout>
  );
}
