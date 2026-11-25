// نام دامنهٔ سایت منبع برای نمایش روی کارت مطلب (مثلاً: irna.ir).
export function sourceHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return 'سایت منبع';
  }
}
