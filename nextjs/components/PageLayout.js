import ClientChrome from './ClientChrome';
import { loadContent, defaultFor } from '@/lib/siteContent';
import { parseMenu } from '@/lib/navMenu';

export default async function PageLayout({ children }) {
  const t = await loadContent();

  // اگر متن منو در پنل خالی یا خراب شده باشد به منوی پیش‌فرض برمی‌گردیم،
  // تا ناوبری سایت هرگز به‌خاطر یک اشتباه تایپی از بین نرود.
  const parsed = parseMenu(t('nav.menu'));
  const nav = {
    menu: parsed.length ? parsed : parseMenu(defaultFor('nav.menu')),
    supportButton: t('nav.support.button'),
    supportFaq: t('nav.support.faq'),
    supportChat: t('nav.support.chat'),
    supportChatHint: t('nav.support.chatHint'),
    callLabel: t('nav.support.callLabel'),
    phoneText: t('nav.support.phoneText'),
    phoneHref: t('nav.support.phoneHref'),
    btnLogin: t('nav.btn.login'),
    btnDashboard: t('nav.btn.dashboard'),
    btnLogout: t('nav.btn.logout'),
    drawerTitle: t('nav.drawer.title'),
    drawerSubtitle: t('nav.drawer.subtitle'),
  };

  const footer = {
    copyright: t('footer.copyright'),
    instagram: t('footer.instagram'),
    bale: t('footer.bale'),
    phone: t('footer.phone'),
    enamadId: t('footer.enamad.id'),
    enamadCode: t('footer.enamad.code'),
  };

  return (
    <ClientChrome logo={t('site.logo')} nav={nav} footer={footer}>
      {children}
    </ClientChrome>
  );
}
