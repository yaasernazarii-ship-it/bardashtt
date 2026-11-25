const CACHE = 'bardasht-pwa-v5';
const OFFLINE_URL = '/offline.html';
const STATIC_ASSETS = [
  OFFLINE_URL,
  '/pwa-192.png',
  '/pwa-512.png',
  '/pwa-maskable-192.png',
  '/pwa-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then((clients) => Promise.all(clients.map((client) => {
        client.postMessage({ type: 'PWA_REFRESH' });
        // نسخه‌های قبلی listener پیام نداشتند؛ navigate باعث می‌شود PWA قدیمی iOS
        // نیز HTML و جاوااسکریپت هماهنگِ بیلد جاری را دریافت کند.
        return client.navigate(client.url).catch(() => undefined);
      }))),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // پاسخ‌های شخصی، API و احراز هویت هرگز کش نمی‌شوند تا اطلاعات کاربران با هم مخلوط نشود.
  if (
    url.pathname.startsWith('/api/')
    || url.pathname.startsWith('/dashboard')
    || url.pathname.startsWith('/auth')
    || url.pathname.startsWith('/panel')
  ) {
    if (request.mode === 'navigate') {
      event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => caches.match(OFFLINE_URL)));
    }
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // فایل‌های بیلد Next نام نسخه‌دار و تغییرناپذیر دارند. اگر فایل قبلاً دریافت شده
  // باشد، خواندن آن از کش از ناقص ماندن hydration در شروع PWA جلوگیری می‌کند.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })).catch(() => fetch(request)),
    );
    return;
  }

  if (/\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })).catch(() => fetch(request)),
    );
  }
});
