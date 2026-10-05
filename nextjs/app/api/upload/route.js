import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import { getSessionUser, isManager } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_BYTES = 12 * 1024 * 1024; // 12MB برای تصویر
const MAX_AUDIO_BYTES = 40 * 1024 * 1024; // 40MB برای فایل صوتی
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60MB برای ویدیوی کوتاه؛ ویدیوی بلند با لینک آپارات/ویو اضافه می‌شود
const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
// ویدیوی کوتاهی که مدیر مستقیم بارگذاری می‌کند (مثلاً ویدیوی معرفی رزومه)
const VIDEO_EXT_BY_TYPE = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
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
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return Response.json({ ok: false, error: 'فایلی انتخاب نشده است.' }, { status: 400 });
    }
    const audioExt = AUDIO_EXT_BY_TYPE[file.type];
    const videoExt = VIDEO_EXT_BY_TYPE[file.type];
    const ext = EXT_BY_TYPE[file.type];
    if (!ext && !audioExt && !videoExt) {
      return Response.json({ ok: false, error: 'فقط تصویر (jpg, png, webp, gif)، فایل صوتی (mp3, m4a, aac, ogg, wav) یا ویدیو (mp4, webm, mov) مجاز است.' }, { status: 400 });
    }
    let buf = Buffer.from(await file.arrayBuffer());
    const limit = videoExt ? MAX_VIDEO_BYTES : audioExt ? MAX_AUDIO_BYTES : MAX_BYTES;
    if (buf.length > limit) {
      const mb = videoExt ? '۶۰' : audioExt ? '۴۰' : '۱۲';
      return Response.json({ ok: false, error: `حجم فایل نباید بیشتر از ${mb} مگابایت باشد.` }, { status: 400 });
    }

    // فایل صوتی و ویدیویی بدون پردازش ذخیره می‌شوند؛ فقط تصاویرِ jpg/png برای سرعت به WebP تبدیل می‌شوند
    let finalExt = audioExt || videoExt || ext;
    if (!audioExt && !videoExt && CONVERT_TO_WEBP.has(file.type)) {
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
