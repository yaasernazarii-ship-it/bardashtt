import PageLayout from '@/components/PageLayout';
import CommunityFeed from '@/components/CommunityFeed';
import SocialAuth from '@/components/SocialAuth';
import { getSocialIdentity } from '@/lib/socialAuth';
import { loadContent, splitLines } from '@/lib/siteContent';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('community');
}

export const dynamic = 'force-dynamic';

export default async function CommunityPage() {
  const t = await loadContent();
  const rules = splitLines(t('community.rules'));
  const identity = await getSocialIdentity();

  return (
    <PageLayout>
      <section className="cm-page">
        <div className="container container--sm">
          <h1 className="cm-page__title">{t('community.title')}</h1>
          {!identity.account && !identity.canModerate && <SocialAuth />}
          <CommunityFeed />
          {rules.length > 0 && (
            <details className="cm-rules">
              <summary>قوانین برداشتگرام</summary>
              <ul>{rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </details>
          )}
        </div>
      </section>
    </PageLayout>
  );
}
