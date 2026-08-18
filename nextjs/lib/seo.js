import { siteUrl } from './siteUrl';

export { siteUrl };

// schema.org Article — برای صفحهٔ جزئیات مطلب (وبلاگ/اخبار).
// image باید از قبل توسط فراخواننده (با siteUrl() همان درخواست) مطلق ساخته شده باشد.
// site: آدرس پایهٔ همان درخواست (siteUrl()) — فقط برای ساختِ لوگوی سازمان در publisher.
export function articleJsonLd({ title, description, url, image, datePublished, dateModified, site }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
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

export function jsonLdScript(data) {
  // escape '<' تا اگر متنِ عنوان/توضیحات حاوی «</script>» بود، از تگ اسکریپت خارج نشود.
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
