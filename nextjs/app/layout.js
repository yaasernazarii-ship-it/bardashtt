import { Vazirmatn } from 'next/font/google';
import './globals.css';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata = {
  metadataBase: new URL('https://www.bardashtt.com'),
  applicationName: 'خانواده برداشت',
  title: {
    default: 'خانواده برداشت | آموزش رایگان بازیگری سینما',
    template: '%s | خانواده برداشت',
  },
  description: 'خانواده برداشت، آموزشگاه رایگان بازیگری سینما در ایران با دوره‌های مقدماتی، تکمیلی، پیشرفته و فیلمسازی در تهران و مازندران.',
  keywords: ['آموزشگاه بازیگری رایگان', 'دوره بازیگری سینما', 'کلاس بازیگری ایران', 'خانواده برداشت', 'یاسر نظری', 'آموزش بازیگری تهران'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: 'خانواده برداشت',
    url: '/',
    title: 'خانواده برداشت | آموزش رایگان بازیگری سینما',
    description: 'آموزش رایگان و حرفه‌ای بازیگری سینما برای کشف و پرورش استعدادهای هنری.',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.className}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){if(typeof Node!=="function"||!Node.prototype)return;' +
              'var r=Node.prototype.removeChild;Node.prototype.removeChild=function(c){' +
              'if(c&&c.parentNode!==this){return c;}return r.apply(this,arguments);};' +
              'var i=Node.prototype.insertBefore;Node.prototype.insertBefore=function(n,ref){' +
              'if(ref&&ref.parentNode!==this){return n;}return i.apply(this,arguments);};})();',
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'خانواده برداشت',
              url: 'https://www.bardashtt.com',
              telephone: '+982191090934',
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
