// فهرست همهٔ صفحات عمومی سایت و بخش‌های لنگردار (anchor) هر صفحه.
// این فایل منبع واحد پنل «لینک‌های صفحات» است. برای هر بخش، id باید با id همان
// section در فایل صفحه یکی باشد تا لینک #id درست کار کند.
export const SITE_LINKS = [
  {
    path: '/',
    title: 'صفحهٔ اصلی',
    sections: [
      { id: 'hero', label: 'هدر و اسلایدشوی بالای صفحه' },
      { id: 'story', label: 'داستان ما' },
      { id: 'stats', label: 'آمار (سال تأسیس، شعبه‌ها…)' },
      { id: 'contact', label: 'اطلاعات تماس' },
    ],
  },
  {
    path: '/about',
    title: 'دربارهٔ ما',
    sections: [
      { id: 'about-slider', label: 'اسلایدشوی بالای صفحه' },
      { id: 'about-intro', label: 'معرفی آموزشگاه' },
      { id: 'about-founder', label: 'بنیان‌گذار' },
      { id: 'about-resume', label: 'سوابق و افتخارات' },
      { id: 'about-creds', label: 'دلایل انتخاب' },
      { id: 'about-values', label: 'ارزش‌ها' },
      { id: 'about-contact', label: 'تماس' },
    ],
  },
  { path: '/courses', title: 'دوره جامع حضوری' },
  { path: '/gallery', title: 'گالری' },
  { path: '/faq', title: 'سؤالات متداول' },
  { path: '/news', title: 'اخبار و مطالب' },
  { path: '/actors', title: 'بانک بازیگران' },
  { path: '/works/output', title: 'خروجی خانواده برداشت' },
  { path: '/works/advertising', title: 'تولیدات تبلیغاتی' },
  { path: '/works/resume', title: 'پشتوانه علمی و هنری' },
  { path: '/social-responsibility', title: 'مسئولیت اجتماعی' },
  { path: '/blog', title: 'مجله برداشت' },
  { path: '/online-learning', title: 'دوره جامع غیر حضوری' },
  { path: '/certificate', title: 'آزمون فارغ‌التحصیلی' },
  { path: '/verify', title: 'استعلام گواهینامه' },
  { path: '/insurance', title: 'بیمهٔ هنرجویان' },
  { path: '/register', title: 'ثبت‌نام رایگان' },
  { path: '/audition', title: 'تست/ثبت‌نام آنلاین' },
  { path: '/auth', title: 'ورود و ثبت‌نام حساب' },
];
