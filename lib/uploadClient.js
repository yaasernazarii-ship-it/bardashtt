'use client';

// ارسال فایل به /api/upload از سمت مرورگر.
// این تابع هرگز throw نمی‌کند؛ همیشه { ok, url } یا { ok:false, error } برمی‌گرداند.
// دلیلش این است که در خطاهایی مثل «حجم زیاد» یا «قطع ارتباط»، پاسخِ سرور JSON نیست
// و اگر مستقیم res.json() صدا زده شود، استثنا پرتاب می‌شود و نشانگرِ «در حال آپلود…»
// برای همیشه روی صفحه می‌ماند بدون آنکه پیام خطایی به کاربر نشان داده شود.

function messageForStatus(status) {
  if (status === 413) return 'حجم فایل بیشتر از حد مجاز سرور است؛ فایل کوچک‌تری انتخاب کنید.';
  if (status === 401) return 'نشست شما منقضی شده است؛ دوباره وارد شوید.';
  if (status === 403) return 'برای آپلود دسترسی لازم را ندارید.';
  if (status >= 500) return 'سرور در پردازش فایل خطا داد؛ چند لحظه بعد دوباره تلاش کنید.';
  return `آپلود ناموفق بود (خطای ${status}).`;
}

export async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);

  let res;
  try {
    res = await fetch('/api/upload', { method: 'POST', body: fd });
  } catch {
    return { ok: false, error: 'ارتباط با سرور برقرار نشد؛ اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.' };
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // پاسخ JSON نبود (مثلاً صفحهٔ خطای nginx)
  }
  if (data && typeof data.ok === 'boolean') return data;
  return { ok: false, error: messageForStatus(res.status) };
}
