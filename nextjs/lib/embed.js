import { aparatEmbedUrl } from '@/lib/aparat';

function isPrivateHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((part) => part > 255)) return true;
    const [a, b] = octets;
    return a === 0 || a === 10 || a === 127 || a >= 224
      || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168);
  }

  return host === '::' || host === '::1' || host.startsWith('fc') || host.startsWith('fd')
    || /^fe[89ab]/.test(host) || host.startsWith('::ffff:');
}

// از لینک یا کد iframe فقط نشانیِ HTTPS عمومی را استخراج می‌کند. ورودی خام HTML
// هیچ‌وقت ذخیره یا اجرا نمی‌شود و مقصدهای محلی/خصوصی نیز قابل ثبت نیستند.
export function normalizeEmbedUrl(input) {
  if (!input) return null;
  const value = String(input).trim();
  const match = value.match(/<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i);
  let candidate = (match ? match[1] : value).trim();
  if (candidate.startsWith('//')) candidate = `https:${candidate}`;

  const aparat = aparatEmbedUrl(candidate);
  if (aparat) candidate = aparat;

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' || url.username || url.password || isPrivateHostname(url.hostname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function embedSrc(input) {
  return normalizeEmbedUrl(input);
}

export function embedOrigin(input) {
  const src = normalizeEmbedUrl(input);
  return src ? new URL(src).origin : null;
}
