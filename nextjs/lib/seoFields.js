// رجیستری سئوی صفحه‌ها: عنوان، توضیح، عکس اشتراک‌گذاری و اجازهٔ نمایش در گوگل.
// هر صفحهٔ عمومی یک کلید کوتاه دارد؛ همان کلید هم در پنل و هم در خودِ صفحه استفاده می‌شود.
//
// نکتهٔ مهم دربارهٔ عنوان‌ها: در layout ریشه قالب '%s | خانواده برداشت' تعریف شده و
// Next.js آن را فقط به صفحه‌های «فرزند» اضافه می‌کند، نه به صفحهٔ اصلی. بنابراین عنوان
// صفحهٔ اصلی کامل نوشته می‌شود و بقیهٔ صفحه‌ها پسوند را خودکار می‌گیرند.

export const SITE_URL = 'https://www.bardashtt.com';

export const SEO_PAGES = [
  {
    key: 'home',
    name: 'صفحهٔ اصلی',
    path: '/',
    absoluteTitle: true,
    title: 'خانواده برداشت | اولین آموزشگاه رایگان بازیگری سینما در ایران',
    description:
      'خانواده برداشت — اولین و تنها آموزشگاه رایگان بازیگری سینما در ایران. دوره‌های مقدماتی، تکمیلی و پیشرفته بازیگری در تهران و مازندران. ثبت‌نام رایگان.',
  },
  {
    key: 'about',
    name: 'دربارهٔ ما',
    path: '/about',
    title: 'درباره ما — آموزشگاه رایگان بازیگری',
    description:
      'آشنایی با خانواده برداشت، اولین آموزشگاه رایگان بازیگری سینما در ایران. داستان ما، تیم آموزشی، شعبه تهران و مازندران.',
  },
  {
    key: 'courses',
    name: 'دوره‌ها',
    path: '/courses',
    title: 'دوره‌های بازیگری',
    description: 'دوره‌های بازیگری مقدماتی، تکمیلی، اردو، پیشرفته و فیلمسازی در خانواده برداشت. ثبت‌نام کاملاً رایگان.',
  },
  {
    key: 'faq',
    name: 'سوالات متداول',
    path: '/faq',
    title: 'سوالات متداول',
    description: 'پاسخ به سوالات پرتکرار درباره دوره‌ها، ثبت‌نام، آزمون و گواهینامه خانواده برداشت.',
  },
  {
    key: 'gallery',
    name: 'گالری',
    path: '/gallery',
    title: 'گالری',
    description: 'گالری تصاویر کلاس‌ها، اردوها و فعالیت‌های خانواده برداشت.',
  },
  {
    key: 'blog',
    name: 'مقاله‌ها',
    path: '/blog',
    title: 'مقاله‌ها',
    description: 'مطالب آموزشی و تحلیلی درباره بازیگری و سینما.',
  },
  {
    key: 'news',
    name: 'اخبار',
    path: '/news',
    title: 'اخبار و مطالب',
    description: 'آخرین اخبار، مطالب و ویدیوهای خانواده برداشت.',
  },
  {
    key: 'actors',
    name: 'بانک بازیگران',
    path: '/actors',
    title: 'بانک بازیگران',
    // کلمهٔ «کارگردانان» عمداً فقط اینجاست (توضیح گوگل) و در متن دیدهٔ صفحه نمی‌آید؛
    // در محصول نقشِ کاربری «فیلم‌ساز» تعریف شده و متن صفحه باید با همان یکی بماند.
    description:
      'بانک رزومه بازیگران خانواده برداشت؛ جست‌وجوی بازیگر برای فیلم‌سازان و کارگردانان بر اساس جنسیت، سن، شهر، قد و مهارت.',
  },
  {
    key: 'register',
    name: 'ثبت‌نام رایگان',
    path: '/register',
    title: 'ثبت‌نام رایگان',
    description: 'ثبت درخواست عضویت در خانواده برداشت برای شروع مسیر آموزش رایگان بازیگری سینما.',
  },
  {
    key: 'audition',
    name: 'تست بازیگری',
    path: '/audition',
    title: 'تست بازیگری',
    description: 'فرم شرکت در تست بازیگری خانواده برداشت؛ ثبت مشخصات و ارسال درخواست حضور در تست.',
  },
  {
    key: 'certificate',
    name: 'آزمون فارغ‌التحصیلی',
    path: '/certificate',
    title: 'آزمون فارغ‌التحصیلی',
    description: 'آزمون و مسیر دریافت گواهینامه خانواده برداشت.',
  },
  {
    key: 'verify',
    name: 'استعلام گواهینامه',
    path: '/verify',
    title: 'استعلام گواهینامه',
    description: 'اعتبارسنجی و استعلام گواهینامه‌های صادرشده توسط خانواده برداشت با کد گواهی.',
  },
  {
    key: 'insurance',
    name: 'بیمهٔ هنرجویان',
    path: '/insurance',
    title: 'بیمه هنرجویان',
    description: 'پوشش بیمه‌ای و ایمنی هنرجویان در دوره‌ها و اردوهای خانواده برداشت.',
  },
  {
    key: 'onlineLearning',
    name: 'یادگیری آنلاین',
    path: '/online-learning',
    title: 'یادگیری آنلاین',
    description: 'منابع آنلاین آموزشی خانواده برداشت برای تمرین بازیگری در خانه.',
  },
  {
    key: 'socialResponsibility',
    name: 'مسئولیت اجتماعی',
    path: '/social-responsibility',
    title: 'مسئولیت اجتماعی',
    description: 'فعالیت‌های فرهنگی و اجتماعی خانواده برداشت: معرفی و خرید کتاب، پادکست، عکس، ویدئو و آگاهی‌سازی.',
  },
  {
    key: 'worksOutput',
    name: 'آثار — خروجی خانواده برداشت',
    path: '/works/output',
    title: 'خروجی خانواده برداشت',
    description: 'نمایش خروجی‌های آموزشی، تمرین‌ها و آثار هنرجویان خانواده برداشت.',
  },
  {
    key: 'worksAdvertising',
    name: 'آثار — تولیدات تبلیغاتی',
    path: '/works/advertising',
    title: 'تولیدات تبلیغاتی',
    description: 'معرفی پروژه‌های تبلیغاتی و ویدیویی تولیدشده توسط هنرجویان و تیم خانواده برداشت.',
  },
  {
    key: 'worksResume',
    name: 'آثار — پشتوانه علمی و هنری',
    path: '/works/resume',
    title: 'پشتوانه علمی و هنری',
    description: 'رزومه، افتخارات و پشتوانه علمی و هنری تیم آموزشی خانواده برداشت.',
  },
  {
    key: 'auth',
    name: 'ورود هنرجویان',
    path: '/auth',
    title: 'ورود هنرجویان',
    description: 'ورود به حساب کاربری خانواده برداشت با نام کاربری و رمز عبور.',
    // صفحهٔ ورود ارزش جست‌وجویی ندارد؛ پیش‌فرض از نتایج گوگل کنار گذاشته می‌شود.
    index: false,
  },
];

export const SEO_PAGE_BY_KEY = new Map(SEO_PAGES.map((p) => [p.key, p]));

// صفحه‌ها را به دو گروه تقسیم می‌کنیم تا فهرست پنل بیش از حد بلند نشود.
const MAIN_KEYS = new Set(['home', 'about', 'courses', 'faq', 'gallery', 'blog', 'news', 'actors', 'register', 'auth']);

function fieldsFor(page) {
  const titleHint = page.absoluteTitle
    ? 'عنوان کامل صفحه در گوگل'
    : 'عنوان صفحه در گوگل (پسوند « | خانواده برداشت» خودکار اضافه می‌شود)';
  return [
    { key: `seo.${page.key}.title`, label: `${page.name} — ${titleHint}`, type: 'text', default: page.title },
    {
      key: `seo.${page.key}.description`,
      label: `${page.name} — توضیح زیر عنوان در گوگل (بهترین طول: ۱۲۰ تا ۱۶۰ نویسه)`,
      type: 'textarea',
      default: page.description,
    },
    {
      key: `seo.${page.key}.image`,
      label: `${page.name} — عکس هنگام اشتراک‌گذاری لینک (تلگرام، واتساپ، اینستاگرام). خالی = لوگوی سایت`,
      type: 'image',
      default: '',
    },
    {
      key: `seo.${page.key}.index`,
      label: `${page.name} — نمایش در نتایج گوگل (بنویسید «بله» یا «خیر»)`,
      type: 'text',
      default: page.index === false ? 'خیر' : 'بله',
    },
  ];
}

export const SEO_GROUPS = [
  {
    id: 'seoMain',
    title: 'سئو — صفحه‌های اصلی (عنوان و توضیح در گوگل)',
    fields: SEO_PAGES.filter((p) => MAIN_KEYS.has(p.key)).flatMap(fieldsFor),
  },
  {
    id: 'seoOther',
    title: 'سئو — صفحه‌های تخصصی و آثار',
    fields: SEO_PAGES.filter((p) => !MAIN_KEYS.has(p.key)).flatMap(fieldsFor),
  },
];
