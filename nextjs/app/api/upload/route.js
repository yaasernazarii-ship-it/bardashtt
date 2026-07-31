import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import sharp from 'sharp';
import { getSessionUser, isManager } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_BYTES = 6 * 1024 * 1024; // 6MB
const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
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
    const ext = EXT_BY_TYPE[file.type];
    if (!ext) {
      return Response.json({ ok: false, error: 'فقط تصویر (jpg, png, webp, gif) مجاز است.' }, { status: 400 });
    }
    let buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return Response.json({ ok: false, error: 'حجم فایل نباید بیشتر از ۶ مگابایت باشد.' }, { status: 400 });
    }

    // برای سرعت بارگذاری و سئو، jpg/png را به WebP فشرده تبدیل می‌کنیم
    let finalExt = ext;
    if (CONVERT_TO_WEBP.has(file.type)) {
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
