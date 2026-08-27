import { getSessionUser, isManager } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function manager() { const user = await getSessionUser(); return isManager(user) ? user : null; }
function bad(message, status = 400) { return Response.json({ ok: false, error: message }, { status }); }
function cleanText(value) { return typeof value === 'string' ? value.trim() : ''; }
function positiveAmount(value, { allowZero = false } = {}) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && (allowZero ? amount >= 0 : amount > 0) ? amount : null;
}
function validDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date; }

export async function GET() {
  if (!await manager()) return bad('دسترسی ندارید.', 403);
  const [categories, expenses, sales] = await Promise.all([
    prisma.menuCategory.findMany({ orderBy: { sortOrder: 'asc' }, include: { items: { orderBy: { sortOrder: 'asc' } } } }),
    prisma.menuExpense.findMany({ orderBy: { expenseDate: 'desc' }, take: 100 }),
    prisma.menuSale.findMany({ orderBy: { saleDate: 'desc' }, take: 100 }),
  ]);
  return Response.json({ categories, expenses, sales });
}

export async function PATCH(request) {
  const user = await manager();
  if (!user) return bad('دسترسی ندارید.', 403);
  const body = await request.json();
  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === 'string') : [];
  if (!ids.length || ids.length > 200 || new Set(ids).size !== ids.length) return bad('ترتیب ارسال‌شده معتبر نیست.');

  try {
    if (body.type === 'categories') {
      const count = await prisma.menuCategory.count({ where: { id: { in: ids } } });
      if (count !== ids.length) return bad('یکی از دسته‌ها پیدا نشد.', 404);
      await prisma.$transaction(ids.map((id, sortOrder) => prisma.menuCategory.update({ where: { id }, data: { sortOrder } })));
      return Response.json({ ok: true });
    }
    if (body.type === 'items' && typeof body.categoryId === 'string') {
      const count = await prisma.menuItem.count({ where: { id: { in: ids }, categoryId: body.categoryId } });
      if (count !== ids.length) return bad('یکی از آیتم‌ها پیدا نشد.', 404);
      await prisma.$transaction(ids.map((id, sortOrder) => prisma.menuItem.update({ where: { id }, data: { sortOrder } })));
      return Response.json({ ok: true });
    }
    return bad('نوع مرتب‌سازی نامعتبر است.');
  } catch { return bad('ذخیره ترتیب انجام نشد.', 500); }
}

export async function POST(request) {
  const user = await manager(); if (!user) return bad('دسترسی ندارید.', 403);
  const body = await request.json();
  try {
    if (body.type === 'category') {
      const name = cleanText(body.name);
      if (!name) return bad('نام دسته الزامی است.');
      return Response.json({ category: await prisma.menuCategory.create({ data: { name, kind: body.kind === 'image' ? 'image' : 'items', sortOrder: Number(body.sortOrder) || 0 } }) });
    }
    if (body.type === 'item') {
      const name = cleanText(body.name); const price = positiveAmount(body.price, { allowZero: true });
      if (!name) return bad('نام آیتم الزامی است.');
      if (price === null) return bad('قیمت باید عددی صفر یا بیشتر باشد.');
      return Response.json({ item: await prisma.menuItem.create({ data: { categoryId: body.categoryId, name, description: cleanText(body.description) || null, price, imageUrl: body.imageUrl || null, sortOrder: Number(body.sortOrder) || 0 } }) });
    }
    if (body.type === 'expense') {
      const title = cleanText(body.title); const amount = positiveAmount(body.amount); const expenseDate = validDate(body.date);
      if (!title || amount === null || !expenseDate) return bad('عنوان، مبلغ مثبت و تاریخ معتبر هزینه الزامی است.');
      return Response.json({ expense: await prisma.menuExpense.create({ data: { title, amount, expenseDate } }) });
    }
    if (body.type === 'sale') {
      const amount = positiveAmount(body.amount); const saleDate = validDate(body.date);
      if (amount === null || !saleDate) return bad('مبلغ مثبت و تاریخ معتبر فروش الزامی است.');
      return Response.json({ sale: await prisma.menuSale.create({ data: { amount, note: cleanText(body.note) || null, saleDate } }) });
    }
    return bad('نوع داده نامعتبر است.');
  } catch { return bad('اطلاعات واردشده معتبر نیست.'); }
}
