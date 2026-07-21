import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';

const MAX_BYTES = 6 * 1024 * 1024; // 6MB
const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

// آپلود عمومی برای عکس شناسنامه/کارت ملیِ متقاضیِ ثبت‌نام (بدون نیاز به ورود).
export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return Response.json({ ok: false, error: 'فایلی انتخاب نشده است.' }, { status: 400 });
    }
    const ext = EXT_BY_TYPE[file.type];
    if (!ext) {
      return Response.json({ ok: false, error: 'فقط تصویر (jpg, png, webp) مجاز است.' }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > MAX_BYTES) {
      return Response.json({ ok: false, error: 'حجم فایل نباید بیشتر از ۶ مگابایت باشد.' }, { status: 400 });
    }

    const dir = path.join(process.cwd(), 'uploads');
    await mkdir(dir, { recursive: true });
    const name = `idcard-${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;
    await writeFile(path.join(dir, name), buf);

    return Response.json({ ok: true, url: `/media/${name}` });
  } catch {
    return Response.json({ ok: false, error: 'آپلود ناموفق بود.' }, { status: 500 });
  }
}
