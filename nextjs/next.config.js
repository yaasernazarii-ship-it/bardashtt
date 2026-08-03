/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdfkit فایل‌های داخلی (فونت‌های AFM/داده‌ها) را در زمان اجرا از node_modules می‌خواند؛
  // باید از باندل‌شدن توسط سرور خارج بماند.
  serverExternalPackages: ['pdfkit', 'fontkit'],
  images: {
    unoptimized: false,
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/about.html', destination: '/about', permanent: true },
      { source: '/courses.html', destination: '/courses', permanent: true },
      { source: '/actors.html', destination: '/actors', permanent: true },
      { source: '/gallery.html', destination: '/gallery', permanent: true },
      { source: '/blog.html', destination: '/blog', permanent: true },
      { source: '/news.html', destination: '/news', permanent: true },
      { source: '/podcast.html', destination: '/social-responsibility', permanent: true },
      { source: '/podcast', destination: '/social-responsibility', permanent: true },
      { source: '/works/cinema', destination: '/works/resume', permanent: true },
      { source: '/faq.html', destination: '/faq', permanent: true },
      { source: '/dashboard.html', destination: '/dashboard', permanent: true },
      { source: '/auth.html', destination: '/auth', permanent: true },
      { source: '/register.html', destination: '/register', permanent: true },
      { source: '/audition.html', destination: '/audition', permanent: true },
      { source: '/certificate.html', destination: '/certificate', permanent: true },
      { source: '/verify.html', destination: '/verify', permanent: true },
      { source: '/online-learning.html', destination: '/online-learning', permanent: true },
      { source: '/insurance.html', destination: '/insurance', permanent: true },
      { source: '/profile.html', destination: '/profile', permanent: true },
      { source: '/works-output.html', destination: '/works/output', permanent: true },
      { source: '/works-cinema.html', destination: '/works/resume', permanent: true },
      { source: '/works-advertising.html', destination: '/works/advertising', permanent: true },
      { source: '/works-resume.html', destination: '/works/resume', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // صفحهٔ ثبت‌نام نباید در مرورگر یا پروکسی‌های میانی کش شود؛ در غیر این صورت
        // بازدیدکننده می‌تواند مدت‌ها بعد از انتشار اصلاح، هنوز نسخهٔ قدیمی را ببیند.
        source: '/audition',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
