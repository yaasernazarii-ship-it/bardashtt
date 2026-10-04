import SimplePage from '@/components/SimplePage';
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
    <SimplePage title={t('community.title')} subtitle={t('community.subtitle')} tag={t('community.tag')} narrow cta={false} sectionClassName="cm-page-section">
      {t('community.intro') && <p className="cm-intro">{t('community.intro')}</p>}

      {!identity.account && !identity.canModerate && <SocialAuth />}
      <CommunityFeed />

      {rules.length > 0 && (
        <div className="cm-rules">
          <h2>قانون‌های این فضا</h2>
          <ul>{rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </div>
      )}
    </SimplePage>
  );
}
