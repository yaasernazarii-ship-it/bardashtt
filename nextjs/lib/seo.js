import { siteUrl } from './siteUrl';

export { siteUrl };

// schema.org Article — برای صفحهٔ جزئیات مطلب (وبلاگ/اخبار).
// image باید از قبل توسط فراخواننده (با siteUrl() همان درخواست) مطلق ساخته شده باشد.
// site: آدرس پایهٔ همان درخواست (siteUrl()) — فقط برای ساختِ لوگوی سازمان در publisher.
export function articleJsonLd({ title, description, url, image, datePublished, dateModified, site, type = 'Article', isBasedOn }) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    headline: title,
    description: description || undefined,
    image: [image],
    datePublished: datePublished ? new Date(datePublished).toISOString() : undefined,
    dateModified: dateModified ? new Date(dateModified).toISOString() : (datePublished ? new Date(datePublished).toISOString() : undefined),
    author: { '@type': 'Organization', name: 'خانواده برداشت' },
    publisher: {
      '@type': 'Organization',
      name: 'خانواده برداشت',
      logo: { '@type': 'ImageObject', url: `${site}/imgg.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    isBasedOn: isBasedOn || undefined,
    url,
  };
}

// schema.org BreadcrumbList — items: [{ name, url? }] (آخرین آیتم بدون url یعنی صفحهٔ جاری)
export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(it.url ? { item: it.url } : {}),
    })),
  };
}

// schema.org FAQPage — groups: [{ items: [{ q, a }] }]
export function faqJsonLd(groups) {
  const questions = groups.flatMap((g) => g.items);
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

// schema.org ItemList از Courseها — برای صفحهٔ چارت دوره‌ها.
// courses: [{ name, description, items[] }] — همهٔ دوره‌ها، نه فقط دورهٔ فعال.
// site: آدرس پایهٔ همان درخواست (siteUrl()).
export function courseListJsonLd(courses, { site, url }) {
  const provider = {
    '@type': 'Organization',
    name: 'خانواده برداشت',
    url: site,
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: courses.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Course',
        name: c.name,
        description: c.description || undefined,
        url: `${url}#course-panel-${i}`,
        inLanguage: 'fa-IR',
        provider,
        teaches: c.items?.length ? c.items : undefined,
        // دوره‌های حضوری و بدون شهریه‌اند؛ Offer با قیمت صفر شرطِ Rich Result گوگل را کامل می‌کند.
        offers: {
          '@type': 'Offer',
          price: 0,
          priceCurrency: 'IRR',
          category: 'Free',
          availability: 'https://schema.org/InStock',
          url: `${site}/audition`,
        },
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'Onsite',
          courseWorkload: 'PT4H',
          location: { '@type': 'Place', name: 'آموزشگاه خانواده برداشت', address: 'تهران، ایران' },
        },
      },
    })),
  };
}

export function jsonLdScript(data) {
  // escape '<' تا اگر متنِ عنوان/توضیحات حاوی «</script>» بود، از تگ اسکریپت خارج نشود.
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
