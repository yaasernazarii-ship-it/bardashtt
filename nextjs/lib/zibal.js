// اتصال به درگاه پرداخت «زیبال» — چرخهٔ request → redirect → callback → verify.
// کلید مرچنت فقط سمت سرور از متغیر محیطی خوانده می‌شود و هرگز نباید در کلاینت قرار گیرد.
// مبالغ در دیتابیس به «تومان» نگه داشته می‌شوند؛ زیبال «ریال» می‌خواهد، پس در لحظهٔ ارسال ×۱۰ می‌شود.

const BASE = 'https://gateway.zibal.ir';

export function isZibalConfigured() {
  return Boolean(process.env.ZIBAL_MERCHANT);
}

// آدرس پایهٔ سایت برای ساختِ callbackUrlِ مطلق.
export function siteUrl() {
  return (process.env.SITE_URL || 'https://www.bardashtt.com').replace(/\/+$/, '');
}

const ERRORS = {
  102: 'مرچنت یافت نشد.',
  103: 'مرچنت غیرفعال است.',
  104: 'مرچنت نامعتبر است.',
  105: 'مبلغ باید بیشتر از ۱۰۰۰ ریال باشد.',
  106: 'آدرس بازگشت (callback) نامعتبر است.',
  113: 'مبلغ تراکنش از سقف مجاز بیشتر است.',
  201: 'این تراکنش قبلاً تأیید شده است.',
  202: 'سفارش پرداخت نشده یا ناموفق بوده است.',
  203: 'شناسهٔ تراکنش (trackId) نامعتبر است.',
};
function zibalError(code) {
  return ERRORS[code] || `خطای درگاه پرداخت (کد ${code ?? '؟'}).`;
}

// ساختِ تراکنش. amountToman به تومان است. در صورت موفقیت { ok, trackId, startUrl } برمی‌گرداند.
export async function zibalRequest({ amountToman, orderId, description, mobile }) {
  const merchant = process.env.ZIBAL_MERCHANT;
  if (!merchant) return { ok: false, error: 'درگاه پرداخت پیکربندی نشده است.' };

  const amountRial = Math.round(Number(amountToman) * 10);
  if (!Number.isFinite(amountRial) || amountRial < 10000) {
    return { ok: false, error: 'مبلغ نامعتبر است.' };
  }

  try {
    const res = await fetch(`${BASE}/v1/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant,
        amount: amountRial,
        callbackUrl: `${siteUrl()}/api/payment/callback`,
        orderId: orderId ? String(orderId) : undefined,
        description: description ? String(description).slice(0, 250) : undefined,
        mobile: mobile || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.result !== 100 || !data.trackId) {
      return { ok: false, code: data.result, error: zibalError(data.result) };
    }
    const trackId = String(data.trackId);
    return { ok: true, trackId, startUrl: `${BASE}/start/${trackId}` };
  } catch {
    return { ok: false, error: 'ارتباط با درگاه پرداخت برقرار نشد.' };
  }
}

// تأییدِ تراکنش — تنها منبعِ حقیقت. حتی اگر callback موفق اعلام کند، باید صدا زده شود.
// نتیجه: { ok, alreadyVerified, amountRial, refNumber } یا { ok:false, error }.
export async function zibalVerify({ trackId }) {
  const merchant = process.env.ZIBAL_MERCHANT;
  if (!merchant) return { ok: false, error: 'درگاه پرداخت پیکربندی نشده است.' };
  if (!trackId) return { ok: false, error: 'شناسهٔ تراکنش موجود نیست.' };

  try {
    const res = await fetch(`${BASE}/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchant, trackId: String(trackId) }),
    });
    const data = await res.json().catch(() => ({}));
    // 100 = تأییدِ موفق، 201 = قبلاً تأیید شده (هر دو یعنی پرداخت انجام شده است).
    if (data.result === 100 || data.result === 201) {
      return {
        ok: true,
        alreadyVerified: data.result === 201,
        amountRial: Number(data.amount) || 0,
        refNumber: data.refNumber != null ? String(data.refNumber) : null,
      };
    }
    return { ok: false, code: data.result, error: zibalError(data.result) };
  } catch {
    return { ok: false, error: 'ارتباط با درگاه پرداخت برقرار نشد.' };
  }
}
