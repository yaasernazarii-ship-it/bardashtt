import { randomInt } from 'crypto';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { isLocked, recordFailure } from '@/lib/rateLimit';
import { readMenuSettings, serviceFeeOf } from '@/lib/menuSettings';

export const runtime = 'nodejs';

const MAX_LINES = 30;
const MAX_QUANTITY = 20;

function bad(message, status = 400) { return Response.json({ ok: false, error: message }, { status }); }
function clean(value, max) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  // سفارش فقط از روی نشانی خصوصی منو پذیرفته می‌شود.
  if (!process.env.MENU_PUBLIC_SLUG || body.slug !== process.env.MENU_PUBLIC_SLUG) return bad('این منو در دسترس نیست.', 404);

  const store = await headers();
  const ip = (store.get('x-forwarded-for') || '').split(',')[0].trim() || store.get('x-real-ip') || 'unknown';
  const key = `menu-order:${ip}`;
  if (isLocked(key, { max: 8, windowMs: 10 * 60 * 1000 })) return bad('تعداد سفارش‌های پیاپی زیاد است. کمی بعد دوباره تلاش کنید.', 429);

  const customer = clean(body.customer, 60);
  const place = clean(body.place, 60);
  const phone = clean(body.phone, 15).replace(/\D/g, '');
  const note = clean(body.note, 300);
  if (customer.length < 2) return bad('نام سفارش‌دهنده الزامی است.');
  if (!place) return bad('شماره میز یا محل تحویل الزامی است.');
  if (phone && !/^09\d{9}$/.test(phone)) return bad('شماره تماس معتبر نیست.');

  const requested = Array.isArray(body.items) ? body.items : [];
  if (!requested.length || requested.length > MAX_LINES) return bad('سبد خرید معتبر نیست.');
  const quantities = new Map();
  for (const row of requested) {
    const quantity = Number(row?.quantity);
    if (typeof row?.id !== 'string' || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return bad('تعداد سفارش معتبر نیست.');
    quantities.set(row.id, quantity);
  }

  // قیمت و موجودی همیشه از دیتابیس خوانده می‌شود تا از دستکاری سمت مرورگر جلوگیری شود.
  const items = await prisma.menuItem.findMany({ where: { id: { in: [...quantities.keys()] }, available: true, category: { active: true } } });
  if (items.length !== quantities.size) return bad('یکی از موارد سبد خرید دیگر موجود نیست. سبد را به‌روز کنید.', 409);

  const settings = await readMenuSettings();
  const subtotal = items.reduce((sum, item) => sum + item.price * quantities.get(item.id), 0);
  const total = subtotal + serviceFeeOf(settings);

  const data = {
    customer, place, phone: phone || null, note: note || null, total,
    lines: { create: items.map((item) => ({ itemId: item.id, name: item.name, price: item.price, quantity: quantities.get(item.id) })) },
  };
  // کد پیگیری کوتاه است تا برای مشتری و باریستا خوانا بماند؛ در صورت تکرار، کد تازه امتحان می‌شود.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const day = new Date().toISOString().slice(5, 10).replace('-', '');
      const order = await prisma.menuOrder.create({ data: { ...data, code: `${day}-${randomInt(1000, 10000)}` } });
      recordFailure(key, { max: 8, windowMs: 10 * 60 * 1000 });
      return Response.json({ ok: true, code: order.code, total: order.total });
    } catch (error) {
      if (error?.code !== 'P2002') return bad('ثبت سفارش انجام نشد. دوباره تلاش کنید.', 500);
    }
  }
  return bad('ثبت سفارش انجام نشد. دوباره تلاش کنید.', 500);
}
