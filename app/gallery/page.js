import SimplePage from '@/components/SimplePage';
import GalleryBoard from '@/components/GalleryBoard';
import SectionPosts from '@/components/SectionPosts';
import { loadContent, splitLines } from '@/lib/siteContent';
import { pageMetadata } from '@/lib/pageMeta';

export async function generateMetadata() {
  return pageMetadata('gallery');
}

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const t = await loadContent();
  return (
    <SimplePage title={t('gallery.title')} subtitle={t('gallery.subtitle')} tag={t('gallery.tag')} slides={splitLines(t('gallery.slides'))}>
      <SectionPosts section="gallery" variant="media" />
      <GalleryBoard />
    </SimplePage>
  );
}
