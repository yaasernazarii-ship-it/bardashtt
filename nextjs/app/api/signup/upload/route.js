import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import { privateDocumentRef } from '@/lib/privateDocuments';
import { isLocked, recordFailure } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const MAX_BYTES = 6 * 1024 * 1024; // 6MB
const HOURLY_UPLOADS = 10;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

// آپلود عمومی برای عکس شناسنامه/کارت ملیِ متقاضیِ ثبت‌نام (بدون نیاز به ورود).
export async function POST(request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const key = `signup-document:${forwarded || 'unknown'}`;
  if (isLocked(key, { max: HOURLY_UPLOADS, windowMs: 60 * 60 * 1000 })) {
    return Response.json({ ok: false, error: 'تعداد بارگذاری‌ها زیاد بوده؛ کمی بعد دوباره تلاش کنید.' }, { status: 429 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return Response.json({ ok: false, error: 'فایلی انتخاب نشده است.' }, { status: 400 });
    }
    if (!ALLOWED.has(file.type)) {
      return Response.json({ ok: false, error: 'فقط تصویر (jpg, png, webp) مجاز است.' }, { status: 400 });
    }
    const input = Buffer.from(await file.arrayBuffer());
    if (input.length > MAX_BYTES) {
      return Response.json({ ok: false, error: 'حجم فایل نباید بیشتر از ۶ مگابایت باشد.' }, { status: 400 });
    }

    let buffer;
    try {
      buffer = await sharp(input)
        .rotate()
        .resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 86 })
        .toBuffer();
    } catch {
      return Response.json({ ok: false, error: 'فایل انتخاب‌شده تصویر معتبر نیست.' }, { status: 400 });
    }

    const dir = path.join(process.cwd(), 'private_uploads', 'id-cards');
    await mkdir(dir, { recursive: true });
    const name = `idcard-${Date.now()}-${randomBytes(12).toString('hex')}.webp`;
    await writeFile(path.join(dir, name), buffer, { mode: 0o600 });
    recordFailure(key, { max: HOURLY_UPLOADS, windowMs: 60 * 60 * 1000 });

    return Response.json({ ok: true, ref: privateDocumentRef(name) });
  } catch {
    return Response.json({ ok: false, error: 'آپلود ناموفق بود.' }, { status: 500 });
  }
}
