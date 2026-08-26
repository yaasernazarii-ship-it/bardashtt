export default function manifest() {
  return {
    name: 'خانواده برداشت',
    short_name: 'برداشت',
    description: 'آموزش رایگان و حرفه‌ای بازیگری سینما و پنل خانواده برداشت',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#f7f7f5',
    theme_color: '#1b1b1b',
    lang: 'fa',
    dir: 'rtl',
    categories: ['education', 'entertainment', 'social'],
    icons: [
      { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'داشبورد', short_name: 'داشبورد', url: '/dashboard', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
      { name: 'برداشتگرام', short_name: 'برداشتگرام', url: '/community', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
    ],
  };
}
