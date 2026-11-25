import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import AccountPanel from '@/components/AccountPanel';
import { pageMetadata } from '@/lib/pageMeta';
import { loadContent } from '@/lib/siteContent';
import { authContent, signupContent, parsePairs } from '@/lib/formContent';

export async function generateMetadata() {
  return pageMetadata('auth');
}

export const dynamic = 'force-dynamic';

export default async function AuthPage() {
  const t = await loadContent();
  const perks = parsePairs(t('auth.page.perks'));
  return (
    <PageLayout>
      <div className="page-header">
        <div className="page-header__inner">
          <div className="page-header__tag">{t('auth.page.tag')}</div>
          <h1>{t('auth.page.title')}</h1>
          <p>{t('auth.page.subtitle')}</p>
          <div className="breadcrumb"><Link href="/">خانه</Link> › ورود</div>
        </div>
      </div>
      <section style={{ background: 'var(--surface)' }}>
        <div className="container split-layout split-layout--compact">
          <div className="stack-card">
            <span className="tag tag--dark" style={{ marginBottom: 18 }}>{t('auth.page.sideTag')}</span>
            <h2 className="heading" style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', marginBottom: 12 }}>{t('auth.page.sideHeading')}</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.95, marginBottom: 20 }}>{t('auth.page.sideText')}</p>
            <div className="feature-list">
              {perks.map((item, index) => (
                <div key={item.title} className="feature-list__item">
                  <div className="feature-list__icon">{index + 1}</div>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <AccountPanel auth={authContent(t)} signup={signupContent(t)} />
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
