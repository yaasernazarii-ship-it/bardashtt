import Link from 'next/link';
import PageLayout from '@/components/PageLayout';
import Accordion from '@/components/Accordion';
import OpenChatButton from '@/components/OpenChatButton';
import { loadContent, splitLines } from '@/lib/siteContent';
import { SITE_URL, faqJsonLd, breadcrumbJsonLd, jsonLdScript } from '@/lib/seo';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('faq');
}

export const dynamic = 'force-dynamic';

// هر خط «سؤال | پاسخ» است؛ روی اولین | جدا می‌شود.
function parseItems(value) {
  return splitLines(value).map((line) => {
    const idx = line.indexOf('|');
    if (idx === -1) return { q: line.trim(), a: '' };
    return { q: line.slice(0, idx).trim(), a: line.slice(idx + 1).trim() };
  });
}

const breadcrumbLd = breadcrumbJsonLd([{ name: 'خانه', url: SITE_URL }, { name: 'سوالات متداول' }]);

export default async function FaqPage() {
  const t = await loadContent();
  const groups = [
    { title: t('faq.g1.title'), tag: 'tag--gold', items: parseItems(t('faq.g1.items')) },
    { title: t('faq.g2.title'), tag: 'tag--dark', items: parseItems(t('faq.g2.items')) },
    { title: t('faq.g3.title'), tag: 'tag--dark', items: parseItems(t('faq.g3.items')) },
  ];
  const faqLd = faqJsonLd(groups);
  return (
    <PageLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(faqLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(breadcrumbLd)} />
      <div className="page-header">
        <div className="page-header__inner">
          <div className="page-header__tag">{t('faq.tag')}</div>
          <h1>{t('faq.title')}</h1>
          <p>{t('faq.subtitle')}</p>
          <div className="breadcrumb"><Link href="/">خانه</Link> › سوالات متداول</div>
        </div>
      </div>
      <section style={{ background: 'var(--bg)' }}>
        <div className="container">
          <div className="faq-grid">
            <aside className="faq-side">
              <span className="tag tag--gold" style={{ marginBottom: 14 }}>{t('faq.side.tag')}</span>
              <h3>{t('faq.side.heading')}</h3>
              <p>{t('faq.side.text')}</p>
              <div className="feature-list">
                <div className="feature-list__item">
                  <div className="feature-list__icon">۱</div>
                  <div>
                    <strong>{t('faq.side.f1.title')}</strong>
                    <span>{t('faq.side.f1.text')}</span>
                  </div>
                </div>
                <div className="feature-list__item">
                  <div className="feature-list__icon">۲</div>
                  <div>
                    <strong>{t('faq.side.f2.title')}</strong>
                    <span>{t('faq.side.f2.text')}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
                <OpenChatButton className="btn btn--gold">پشتیبانی آنلاین</OpenChatButton>
                <a href={`tel:${t('contact.phone')}`} className="btn btn--hero-secondary">تماس مستقیم</a>
                <Link href="/courses" className="btn btn--hero-secondary">مشاهده دوره‌ها</Link>
              </div>
            </aside>
            <div>
              {groups.map(group => (
                <div key={group.title} style={{ marginBottom: 20 }}>
                  <span className={`tag ${group.tag}`} style={{ marginBottom: 14 }}>{group.title}</span>
                  <div className="faq-panel"><Accordion items={group.items} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
