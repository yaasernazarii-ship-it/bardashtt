import SimplePage from '@/components/SimplePage';
import GalleryBoard from '@/components/GalleryBoard';

export const metadata = {
  title: 'گالری',
  description: 'گالری تصاویر کلاس‌ها، اردوها و فعالیت‌های خانواده برداشت.',
  alternates: { canonical: 'https://www.bardashtt.com/gallery' },
};

export default function GalleryPage() {
  return (
    <SimplePage title="گالری" subtitle="لحظه‌هایی از کلاس‌ها، اردوها و فعالیت‌های ما" tag="تصاویر">
      <GalleryBoard />
    </SimplePage>
  );
}
