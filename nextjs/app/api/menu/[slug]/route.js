import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() { return []; }

export async function GET(request, { params }) {
  const slug = process.env.MENU_PUBLIC_SLUG;
  const routeParams = await params;
  if (!slug || routeParams.slug !== slug) return new Response('Not found', { status: 404 });
  const categories = await prisma.menuCategory.findMany({
    where: { active: true }, orderBy: { sortOrder: 'asc' },
    include: { items: { where: { available: true }, orderBy: { sortOrder: 'asc' } } },
  });
  return Response.json({ categories }, { headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow, noarchive' } });
}
