import SimplePage from '@/components/SimplePage';
import GalleryBoard from '@/components/GalleryBoard';
import { loadContent } from '@/lib/siteContent';

export const metadata = {
  title: 'گالری',
  description: 'گالری تصاویر کلاس‌ها، اردوها و فعالیت‌های خانواده برداشت.',
  alternates: { canonical: 'https://www.bardashtt.com/gallery' },
};

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const t = await loadContent();
  return (
    <SimplePage title={t('gallery.title')} subtitle={t('gallery.subtitle')} tag={t('gallery.tag')}>
      <GalleryBoard />
    </SimplePage>
  );
}
