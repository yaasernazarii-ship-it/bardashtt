import { hasCafeAccess } from '@/lib/cafeAuth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request, { params }) {
  if (!await hasCafeAccess()) return Response.json({ error: 'دسترسی ندارید.' }, { status: 403 });
  const body = await request.json(); const id = (await params).id;
  try {
    if (body.type === 'category') {
      if (body.name !== undefined && !String(body.name).trim()) return Response.json({ error: 'نام دسته نمی‌تواند خالی باشد.' }, { status: 400 });
      return Response.json({ category: await prisma.menuCategory.update({ where: { id }, data: { ...(body.name !== undefined && { name: String(body.name).trim() }), ...(body.kind !== undefined && { kind: body.kind === 'image' ? 'image' : 'items' }), ...(body.description !== undefined && { description: String(body.description).trim() || null }), ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }), ...(body.active !== undefined && { active: !!body.active }), ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }) } }) });
    }
    if (body.type === 'item') {
      const price = body.price === undefined ? undefined : Number(body.price);
      if (body.name !== undefined && !String(body.name).trim()) return Response.json({ error: 'نام آیتم نمی‌تواند خالی باشد.' }, { status: 400 });
      if (price !== undefined && (!Number.isSafeInteger(price) || price < 0)) return Response.json({ error: 'قیمت باید عددی صفر یا بیشتر باشد.' }, { status: 400 });
      return Response.json({ item: await prisma.menuItem.update({ where: { id }, data: { ...(body.name !== undefined && { name: String(body.name).trim() }), ...(body.description !== undefined && { description: String(body.description).trim() || null }), ...(price !== undefined && { price }), ...(body.available !== undefined && { available: !!body.available }), ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }), ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }) } }) });
    }
    return Response.json({ error: 'نوع داده نامعتبر است.' }, { status: 400 });
  } catch { return Response.json({ error: 'رکورد پیدا نشد.' }, { status: 404 }); }
}

export async function DELETE(request, { params }) {
  if (!await hasCafeAccess()) return Response.json({ error: 'دسترسی ندارید.' }, { status: 403 });
  const body = await request.json(); const id = (await params).id;
  if (body.type === 'category') await prisma.menuCategory.delete({ where: { id } });
  else if (body.type === 'item') await prisma.menuItem.delete({ where: { id } });
  else if (body.type === 'expense') await prisma.menuExpense.delete({ where: { id } });
  else if (body.type === 'sale') await prisma.menuSale.delete({ where: { id } });
  else return Response.json({ error: 'نوع داده نامعتبر است.' }, { status: 400 });
  return Response.json({ ok: true });
}
