import ClientChrome from './ClientChrome';
import { loadContent } from '@/lib/siteContent';

export default async function PageLayout({ children }) {
  const t = await loadContent();
  return <ClientChrome logo={t('site.logo')}>{children}</ClientChrome>;
}
