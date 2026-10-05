import ClientChrome from './ClientChrome';
import PageHeaderSlides from './PageHeaderSlides';
import { loadContent, defaultFor, splitLines } from '@/lib/siteContent';
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
    btnApplication: t('nav.btn.application'),
    btnDashboard: t('nav.btn.dashboard'),
    btnLogout: t('nav.btn.logout'),
    drawerTitle: t('nav.drawer.title'),
    drawerSubtitle: t('nav.drawer.subtitle'),
  };
  const pageHeaderSlides = {
    '/news': splitLines(t('header.news.slides')),
    '/blog': splitLines(t('header.blog.slides')),
    '/gallery': splitLines(t('header.gallery.slides')),
    '/actors': splitLines(t('header.actors.slides')),
    '/online-learning': splitLines(t('header.online-learning.slides')),
    '/social-responsibility': splitLines(t('header.social-responsibility.slides')),
    '/works/output': splitLines(t('header.works-output.slides')),
    '/works/advertising': splitLines(t('header.works-advertising.slides')),
    '/works/resume': splitLines(t('header.works-resume.slides')),
    '/faq': splitLines(t('header.faq.slides')),
    '/register': splitLines(t('header.register.slides')),
    '/auth': splitLines(t('header.auth.slides')),
    '/audition': splitLines(t('header.audition.slides')),
    '/certificate': splitLines(t('header.certificate.slides')),
    '/insurance': splitLines(t('header.insurance.slides')),
    '/application': splitLines(t('header.application.slides')),
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
      <PageHeaderSlides slides={pageHeaderSlides} />
      {children}
    </ClientChrome>
  );
}
