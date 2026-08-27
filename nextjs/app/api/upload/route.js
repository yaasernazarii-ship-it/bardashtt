import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import { getSessionUser, isManager } from '@/lib/auth';
import { hasCafeCookie } from '@/lib/cafeAuth';

export const runtime = 'nodejs';

const MAX_BYTES = 6 * 1024 * 1024; // 6MB برای تصویر
const MAX_AUDIO_BYTES = 40 * 1024 * 1024; // 40MB برای فایل صوتی
const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
// فرمت‌های صوتیِ مجاز برای مطالبِ صوتی
const AUDIO_EXT_BY_TYPE = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/webm': 'weba',
};
// فرمت‌هایی که برای سئو و سرعت بارگذاری به WebP تبدیل می‌شوند (gif متحرک دست‌نخورده می‌ماند)
const CONVERT_TO_WEBP = new Set(['image/jpeg', 'image/png']);

export async function POST(request) {
  const user = await getSessionUser();
  // مدیر کافه با رمز اختصاصی خودش وارد می‌شود و فقط اجازه‌ی آپلود تصویر منو را دارد.
  const cafeOnly = !isManager(user) && await hasCafeCookie();
  if (!user && !cafeOnly) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user) && !cafeOnly) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return Response.json({ ok: false, error: 'فایلی انتخاب نشده است.' }, { status: 400 });
    }
    const audioExt = AUDIO_EXT_BY_TYPE[file.type];
    const ext = EXT_BY_TYPE[file.type];
    if (!ext && !audioExt) {
      return Response.json({ ok: false, error: 'فقط تصویر (jpg, png, webp, gif) یا فایل صوتی (mp3, m4a, aac, ogg, wav) مجاز است.' }, { status: 400 });
    }
    if (cafeOnly && !ext) {
      return Response.json({ ok: false, error: 'فقط تصویر (jpg, png, webp, gif) مجاز است.' }, { status: 400 });
    }
    let buf = Buffer.from(await file.arrayBuffer());
    const limit = audioExt ? MAX_AUDIO_BYTES : MAX_BYTES;
    if (buf.length > limit) {
      const mb = audioExt ? '۴۰' : '۶';
      return Response.json({ ok: false, error: `حجم فایل نباید بیشتر از ${mb} مگابایت باشد.` }, { status: 400 });
    }

    // فایل صوتی بدون پردازش ذخیره می‌شود؛ فقط تصاویرِ jpg/png برای سرعت به WebP تبدیل می‌شوند
    let finalExt = audioExt || ext;
    if (!audioExt && CONVERT_TO_WEBP.has(file.type)) {
      try {
        buf = await sharp(buf).webp({ quality: 82 }).toBuffer();
        finalExt = 'webp';
      } catch { /* در صورت خطای تبدیل، فایل اصلی بدون تغییر ذخیره می‌شود */ }
    }

    const dir = path.join(process.cwd(), 'uploads');
    await mkdir(dir, { recursive: true });
    const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${finalExt}`;
    await writeFile(path.join(dir, name), buf);

    return Response.json({ ok: true, url: `/media/${name}` });
  } catch {
    return Response.json({ ok: false, error: 'آپلود ناموفق بود.' }, { status: 500 });
  }
}
