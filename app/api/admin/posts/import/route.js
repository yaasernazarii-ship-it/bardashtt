import { getSessionUser, isManager } from '@/lib/auth';
import { extractArticle } from '@/lib/articleExtract';

// دریافت محتوای یک مطلب از روی لینک سایتِ دیگر برای پرکردنِ فرم افزودن مطلب.
export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی لازم را ندارید.' }, { status: 403 });

  let url = '';
  try {
    const b = await request.json();
    url = String(b.url || '').trim();
  } catch {
    return Response.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 });
  }
  if (!url) return Response.json({ ok: false, error: 'لینک را وارد کنید.' }, { status: 400 });

  const result = await extractArticle(url);
  if (!result.ok) return Response.json(result, { status: 422 });
  return Response.json(result);
}
