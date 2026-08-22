import { Vazirmatn } from 'next/font/google';
import './globals.css';
import BookPromo from '@/components/BookPromo';
import PwaRegistration from '@/components/PwaRegistration';
import { siteUrl } from '@/lib/siteUrl';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1b1b1b',
  colorScheme: 'light',
  viewportFit: 'cover',
};

// metadataBase باید بر اساس دامنهٔ همان درخواست باشد (siteUrl())، نه یک مقدار ثابت؛
// در غیر این صورت همهٔ URLهای نسبیِ سئو (canonical/OG) روی هر دو دامنه به یک دامنهٔ ثابت حل می‌شدند.
export async function generateMetadata() {
  const base = await siteUrl();
  const verificationTitle = base === 'https://bardashtt.ir.bardashtt.com';
  return {
    metadataBase: new URL(base),
    applicationName: 'خانواده برداشت',
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      title: 'خانواده برداشت',
      statusBarStyle: 'black-translucent',
    },
    formatDetection: { telephone: false },
    title: {
      default: verificationTitle ? '55990608' : 'خانواده برداشت | آموزش رایگان بازیگری سینما',
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
}

export default async function RootLayout({ children }) {
  const base = await siteUrl();
  return (
    <html lang="fa" dir="rtl" translate="no" className={vazirmatn.className}>
      <head>
        <meta name="google" content="notranslate" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'خانواده برداشت',
              url: base,
              telephone: '+982191090934',
            }),
          }}
        />
      </head>
      <body>
        <PwaRegistration />
        {children}
        <BookPromo />
      </body>
    </html>
  );
}
