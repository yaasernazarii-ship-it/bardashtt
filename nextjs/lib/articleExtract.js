// استخراج محتوای یک مطلب از روی نشانی (URL) بدون نیاز به مرورگر.
// فقط با درخواست ساده HTTP و تحلیل HTML: عنوان، خلاصه، متن و عکس کاور را برمی‌گرداند.

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  zwnj: '\u200c', laquo: '«', raquo: '»', hellip: '…', mdash: '—', ndash: '–',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', middot: '·', times: '×',
};

// تبدیل موجودیت‌های HTML (نام‌دار و عددی) به کاراکتر واقعی.
export function decodeEntities(str) {
  if (!str) return '';
  return String(str).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, code) => {
    if (code[0] === '#') {
      const num = code[1] === 'x' || code[1] === 'X'
        ? parseInt(code.slice(2), 16)
        : parseInt(code.slice(1), 10);
      if (Number.isFinite(num)) { try { return String.fromCodePoint(num); } catch { return m; } }
      return m;
    }
    const key = code.toLowerCase();
    return Object.prototype.hasOwnProperty.call(ENTITIES, key) ? ENTITIES[key] : m;
  });
}

// خواندن مقدار یک متاتگ (og/twitter/name) با هر ترتیبی از ویژگی‌ها.
function metaContent(html, names) {
  for (const name of names) {
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)\\s*=\\s*["']${esc}["'][^>]*>`, 'i'),
      new RegExp(`<meta[^>]+content\\s*=\\s*["']([^"']*)["'][^>]*(?:property|name)\\s*=\\s*["']${esc}["']`, 'i'),
    ];
    for (const re of patterns) {
      const tag = html.match(re);
      if (!tag) continue;
      const withContent = tag[0].match(/content\s*=\s*["']([^"']*)["']/i);
      const val = withContent ? withContent[1] : tag[1];
      if (val && val.trim()) return decodeEntities(val.trim());
    }
  }
  return '';
}

// تبدیل نشانی نسبی عکس به نشانی کامل بر اساس آدرس صفحه.
function absoluteUrl(src, base) {
  if (!src) return '';
  try { return new URL(src, base).href; } catch { return src; }
}

// حذف تگ‌های غیرمحتوایی برای تمیز شدن متن.
function stripNoise(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template|iframe|form|nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
}

// تبدیل یک قطعه HTML به متن پاراگراف‌بندی‌شده.
function blockToParagraphs(chunk) {
  const cleaned = stripNoise(chunk);
  const paras = [];
  const blockRe = /<(p|h[1-6]|li|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = blockRe.exec(cleaned)) !== null) {
    const text = decodeEntities(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
    if (text.length >= 30) paras.push(text);
  }
  return paras;
}

// استخراج متن اصلی مطلب: اول <article>، سپس نامزدهای رایج، در نهایت کل <body>.
function extractBody(html) {
  const candidates = [];
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  if (article) candidates.push(article[1]);
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (main) candidates.push(main[1]);
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (body) candidates.push(body[1]);
  candidates.push(html);

  let best = [];
  for (const chunk of candidates) {
    const paras = blockToParagraphs(chunk);
    const len = paras.join(' ').length;
    if (len > best.join(' ').length) best = paras;
    if (best.join(' ').length > 400) break;
  }
  return best.join('\n\n').slice(0, 20000);
}

// دریافت و تحلیل یک صفحه؛ خروجی: { title, excerpt, body, coverImage, sourceUrl }.
export async function extractArticle(rawUrl) {
  const url = String(rawUrl || '').trim();
  if (!/^https?:\/\//i.test(url)) {
    return { ok: false, error: 'نشانی باید با http یا https شروع شود.' };
  }

  let res;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BardashtBot/1.0; +https://khanevadeh-bardasht.ir)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fa,en;q=0.8',
      },
    });
    clearTimeout(timer);
  } catch {
    return { ok: false, error: 'دریافت صفحه ممکن نشد؛ نشانی را بررسی کنید یا کمی بعد دوباره امتحان کنید.' };
  }

  if (!res.ok) {
    return { ok: false, error: `سایت مقصد پاسخ نداد (کد ${res.status}).` };
  }
  const ctype = res.headers.get('content-type') || '';
  if (!ctype.includes('html')) {
    return { ok: false, error: 'این نشانی یک صفحهٔ وب متنی نیست.' };
  }

  const html = (await res.text()).slice(0, 2_000_000);
  const finalUrl = res.url || url;

  const ogTitle = metaContent(html, ['og:title', 'twitter:title']);
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = (ogTitle || (titleTag ? decodeEntities(titleTag[1]).replace(/\s+/g, ' ').trim() : '')).slice(0, 200);

  const excerpt = metaContent(html, ['og:description', 'twitter:description', 'description']).slice(0, 300);

  const rawImage = metaContent(html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']);
  const coverImage = rawImage ? absoluteUrl(rawImage, finalUrl) : '';

  const body = extractBody(html);

  if (!title && body.length < 200) {
    return { ok: false, error: 'محتوایی از این صفحه پیدا نشد؛ ممکن است سایت مقصد اجازهٔ خواندنِ خودکار را ندهد (مثلاً پشتِ سامانهٔ ضدربات باشد). می‌توانید متن را دستی کپی کنید.' };
  }

  return { ok: true, title, excerpt, body, coverImage, sourceUrl: finalUrl };
}
