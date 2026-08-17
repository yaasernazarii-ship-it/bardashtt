import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import { getSessionUser } from '@/lib/auth';
import { canUseSocial } from '@/lib/social';
import { isLocked, recordFailure } from '@/lib/rateLimit';

export const runtime = 'nodejs';

// آپلودِ کاربرِ عادی عمداً از مسیر مدیریتی (/api/upload) جداست تا قواعد سخت‌گیرانهٔ
// خودش را داشته باشد: فقط تصویر، بازفشرده‌سازی اجباری، و سقف تعداد در ساعت.
const MAX_BYTES = 8 * 1024 * 1024; // ورودی تا ۸ مگ؛ خروجی پس از فشرده‌سازی خیلی کوچک‌تر می‌شود
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const HOURLY_UPLOADS = 30;

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!canUseSocial(user)) {
    return Response.json({ ok: false, error: 'حساب شما اجازهٔ انتشار در شبکهٔ اجتماعی ندارد.' }, { status: 403 });
  }

  const key = `social-upload:${user.id}`;
  if (isLocked(key, { max: HOURLY_UPLOADS, windowMs: 60 * 60 * 1000 })) {
    return Response.json({ ok: false, error: 'تعداد آپلود شما در این ساعت زیاد بوده؛ کمی بعد دوباره تلاش کنید.' }, { status: 429 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    const kind = form.get('kind') === 'story' ? 'story' : 'post';
    if (!file || typeof file.arrayBuffer !== 'function') {
      return Response.json({ ok: false, error: 'عکسی انتخاب نشده است.' }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return Response.json({ ok: false, error: 'فقط عکس (jpg، png، webp) مجاز است.' }, { status: 400 });
    }
    const input = Buffer.from(await file.arrayBuffer());
    if (input.length > MAX_BYTES) {
      return Response.json({ ok: false, error: 'حجم عکس نباید بیشتر از ۸ مگابایت باشد.' }, { status: 400 });
    }

    // rotate(): چرخشِ ثبت‌شده در EXIF گوشی اعمال می‌شود تا عکس وارونه ذخیره نشود.
    // خروجی بدون متادیتا ساخته می‌شود، پس موقعیت مکانیِ عکسِ کاربر منتشر نمی‌شود.
    const box = kind === 'story' ? { width: 1080, height: 1920 } : { width: 1440, height: 1440 };
    let out;
    try {
      out = await sharp(input)
        .rotate()
        .resize({ ...box, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch {
      return Response.json({ ok: false, error: 'این فایل عکس معتبر نیست.' }, { status: 400 });
    }

    const dir = path.join(process.cwd(), 'uploads');
    await mkdir(dir, { recursive: true });
    const name = `s${Date.now()}-${randomBytes(6).toString('hex')}.webp`;
    await writeFile(path.join(dir, name), out);
    recordFailure(key, { max: HOURLY_UPLOADS, windowMs: 60 * 60 * 1000 });

    return Response.json({ ok: true, url: `/media/${name}` });
  } catch {
    return Response.json({ ok: false, error: 'آپلود ناموفق بود.' }, { status: 500 });
  }
}
