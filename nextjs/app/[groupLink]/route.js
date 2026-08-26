import { prisma } from '@/lib/prisma';
import { siteUrl } from '@/lib/siteUrl';

export async function GET(request, { params }) {
  const { groupLink } = await params;
  const baseUrl = await siteUrl();
  if (!/^c[a-z0-9]{24}$/.test(groupLink)) {
    return Response.redirect(new URL('/dashboard', baseUrl), 307);
  }

  const [chatGroup, classGroup] = await Promise.all([
    prisma.chatGroup.findUnique({ where: { id: groupLink }, select: { id: true } }),
    prisma.classGroup.findUnique({ where: { id: groupLink }, select: { id: true } }),
  ]);

  if (chatGroup) {
    return Response.redirect(new URL(`/dashboard/groups?g=${encodeURIComponent(groupLink)}`, baseUrl), 307);
  }
  if (classGroup) {
    return Response.redirect(new URL(`/dashboard/schedule?g=${encodeURIComponent(groupLink)}`, baseUrl), 307);
  }
  return Response.redirect(new URL('/dashboard', baseUrl), 307);
}
