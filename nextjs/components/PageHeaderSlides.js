'use client';

import { usePathname } from 'next/navigation';
import PageSlider from './PageSlider';

export default function PageHeaderSlides({ slides }) {
  const pathname = usePathname();
  const images = slides[pathname] || [];
  if (!images.length) return null;
  return <PageSlider images={images} />;
}
