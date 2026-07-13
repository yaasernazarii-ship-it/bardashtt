import { Vazirmatn } from 'next/font/google';
import './globals.css';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://khanevadehbardasht.ir'),
  title: {
    default: 'خانواده برداشت | اولین آموزشگاه رایگان بازیگری سینما در ایران',
    template: '%s | خانواده برداشت',
  },
  description: 'خانواده برداشت — اولین و تنها آموزشگاه رایگان بازیگری سینما در ایران. دوره‌های مقدماتی، تکمیلی و پیشرفته بازیگری در تهران و مازندران. ثبت‌نام رایگان.',
  keywords: ['آموزشگاه بازیگری رایگان', 'دوره بازیگری سینما', 'کلاس بازیگری ایران', 'خانواده برداشت', 'یاسر نظری', 'آموزش بازیگری تهران'],
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    siteName: 'خانواده برداشت',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.className}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'EducationalOrganization',
              name: 'خانواده برداشت',
              url: 'https://khanevadehbardasht.ir',
              telephone: '+982191090934',
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
