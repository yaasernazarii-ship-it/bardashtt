import { prisma } from '@/lib/prisma';

// رجیستری متن‌های قابل‌ویرایش صفحات.
// هر فیلد: key یکتا، label فارسی، type ('text' | 'textarea' | 'image' | 'list')، و مقدار پیش‌فرض.
//  - image: مقدار یک نشانی تصویر است؛ در پنل با دکمهٔ آپلود قابل‌تغییر است.
//  - list: چند مورد، هر مورد در یک خط؛ در صفحه با splitLines() به آرایه تبدیل می‌شود.
// برای افزودن متن جدید کافی است فیلد را اینجا اضافه و در صفحه با t('key') بخوانید.
export const CONTENT_GROUPS = [
  {
    id: 'home',
    title: 'صفحهٔ اصلی',
    fields: [
      { key: 'home.hero.logo', label: 'لوگوی بالای صفحهٔ اصلی', type: 'image', default: '/bardasht-logo.png' },
      { key: 'home.hero.eyebrow', label: 'برچسب بالای عنوان', type: 'text', default: 'اولین آموزشگاه رایگان بازیگری سینما در ایران' },
      { key: 'home.hero.title', label: 'عنوان اصلی (شعار)', type: 'text', default: 'استعداد بازیگری‌ات را جدی بگیر' },
      { key: 'home.hero.subtitle', label: 'زیرعنوان شعار', type: 'text', default: 'آموزش حرفه‌ای، رایگان و قابل‌اعتماد' },
      { key: 'home.hero.ctaPrimary', label: 'دکمهٔ اصلی', type: 'text', default: 'مشاهده دوره‌ها' },
      { key: 'home.hero.ctaSecondary', label: 'دکمهٔ دوم', type: 'text', default: 'درباره ما' },
      { key: 'home.branch.heading', label: 'عنوان بخش شعبه‌ها', type: 'text', default: 'ما کجاییم؟' },
      { key: 'home.branch1.title', label: 'شعبهٔ ۱ — نام', type: 'text', default: 'تهران' },
      { key: 'home.branch1.desc', label: 'شعبهٔ ۱ — توضیح', type: 'textarea', default: 'مرکز اصلی خانواده برداشت در پایتخت. دوره‌های تخصصی با حضور موسس و اساتید مجرب.' },
      { key: 'home.branch2.title', label: 'شعبهٔ ۲ — نام', type: 'text', default: 'مازندران' },
      { key: 'home.branch2.desc', label: 'شعبهٔ ۲ — توضیح', type: 'textarea', default: 'شعبه شمال کشور — فرصتی برای استعدادهای استان مازندران و مناطق همجوار.' },
    ],
  },
  {
    id: 'about',
    title: 'دربارهٔ ما',
    fields: [
      { key: 'about.story.heading', label: 'عنوان داستان', type: 'text', default: 'از ۱۳۹۷ تا امروز' },
      { key: 'about.story.lead', label: 'جملهٔ شاخص داستان', type: 'text', default: 'استعداد نباید گرو پول باشد.' },
      { key: 'about.story.p1', label: 'داستان — پاراگراف ۱', type: 'textarea', default: 'از همان روز اول تصمیم گرفتیم درهایمان را برای همه باز بگذاریم. امروز به عنوان تنها آموزشگاه رایگان بازیگری سینما در کشور شناخته می‌شویم؛ با مجوز رسمی، دوره‌های تخصصی و کمپ‌های آموزشی که برای هنرجویان در تمامی سنین طراحی شده‌اند.' },
      { key: 'about.story.p2', label: 'داستان — پاراگراف ۲', type: 'textarea', default: 'هنرجویان علاوه بر حضور در کلاس‌ها، در آفیش‌ها و اردوهای آموزشی ۲۴ ساعته تا ۱۰ روزه شرکت می‌کنند و از نزدیک با فضای واقعی تولید آثار سینمایی آشنا می‌شوند.' },
      { key: 'about.story.p3', label: 'داستان — پاراگراف ۳', type: 'textarea', default: 'ما باور داریم هر استعدادی شایسته دیده شدن است و هر رویا می‌تواند با آموزش درست به واقعیت تبدیل شود.' },
      { key: 'about.intro.heading', label: 'معرفی — عنوان', type: 'text', default: 'جایی که رویاهای سینمایی به واقعیت می‌پیوندند' },
      { key: 'about.intro.lead', label: 'معرفی — متن', type: 'textarea', default: '«خانواده برداشت» فراتر از یک فضای آموزشی، یک جامعه‌ی بزرگ هنری است؛ جایی که بیش از ۲۰۰ هزار هنرجو و علاقه‌مند به سینما گرد هم آمده‌اند تا مسیر حرفه‌ای شدن را با اصالت، صداقت و آموزش‌های استاندارد طی کنند.' },
      { key: 'about.founder.name', label: 'بنیان‌گذار — نام', type: 'text', default: 'یاسر نظری' },
      { key: 'about.founder.title', label: 'بنیان‌گذار — عنوان شغلی', type: 'text', default: 'کارگردان سینما · نویسنده کتاب «پنج متد طلایی»' },
      { key: 'about.founder.bio1', label: 'بنیان‌گذار — بیو ۱', type: 'textarea', default: 'یاسر نظری، کارگردان سینما و نویسنده کتاب «پنج متد طلایی»، فعالیت هنری خود را با رویکردی عمیق، فلسفی و نمادین پیگیری می‌کند. او معتقد است سینما فراتر از یک سرگرمی، ابزاری برای واکاوی پیچیدگی‌های رفتار انسانی است.' },
      { key: 'about.founder.bio2', label: 'بنیان‌گذار — بیو ۲', type: 'textarea', default: 'تخصص و دانش او حاصل سال‌ها تجربه عملی در بیش از ۸۰ پروژه سینمایی، تلویزیونی و تبلیغاتی در مقام کارگردان، تهیه‌کننده و مدیر تولید است. او با تکیه بر تحصیلات آکادمیک خود — شامل مدرک درجه یک هنری (معادل دکتری فیلم‌سازی) از کالج ابن‌سینا گرجستان و کارشناسی ارشد فیلم‌سازی از دانشگاه آکسفورد انگلستان — و همچنین کسب افتخارات بین‌المللی نظیر جایزه بهترین کارگردانی از جشنواره زاگرب کرواسی، نگاهی استاندارد و جهانی به هنر سینما دارد.' },
      { key: 'about.founder.bio3', label: 'بنیان‌گذار — بیو ۳', type: 'textarea', default: 'وی علاوه بر فعالیت‌های هنری، با دریافت مجوزهای رسمی از وزارت فرهنگ و ارشاد اسلامی و سازمان فنی و حرفه‌ای کشور، بنیان‌گذار «آموزشگاه خانواده برداشت» است؛ مجموعه‌ای که امروز با همراهی بیش از ۲۰۰ هزار هنرجو و علاقه‌مند، به یکی از پرمخاطب‌ترین قطب‌های آموزشی بازیگری در کشور تبدیل شده است. او با تلفیق هنر، تحلیل رفتار و مهارت‌های کسب‌وکار، بستری فراهم کرده تا هنرجویان نه‌تنها تکنیک بازیگری، بلکه مهارت‌های زیستن و حضور در فضای حرفه‌ای سینما را بیاموزند.' },
    ],
  },
  {
    id: 'courses',
    title: 'صفحهٔ دوره‌ها',
    fields: [
      { key: 'courses.title', label: 'عنوان', type: 'text', default: 'مسیر آموزشی خانواده برداشت' },
      { key: 'courses.subtitle', label: 'زیرعنوان', type: 'text', default: '۵ مرحله برای تبدیل علاقه به مهارت حرفه‌ای' },
    ],
  },
  {
    id: 'gallery',
    title: 'صفحهٔ گالری',
    fields: [
      { key: 'gallery.tag', label: 'برچسب', type: 'text', default: 'تصاویر' },
      { key: 'gallery.title', label: 'عنوان', type: 'text', default: 'گالری' },
      { key: 'gallery.subtitle', label: 'زیرعنوان', type: 'text', default: 'لحظه‌هایی از کلاس‌ها، اردوها و فعالیت‌های ما' },
    ],
  },
  {
    id: 'faq',
    title: 'سؤالات متداول',
    fields: [
      { key: 'faq.tag', label: 'برچسب بالای عنوان', type: 'text', default: 'راهنمای هنرجویان' },
      { key: 'faq.title', label: 'عنوان', type: 'text', default: 'سوالات متداول' },
      { key: 'faq.subtitle', label: 'زیرعنوان', type: 'text', default: 'پاسخ سوال‌های رایج درباره ثبت‌نام، دوره‌ها، گواهینامه و روند آموزشی خانواده برداشت.' },
      { key: 'faq.side.heading', label: 'عنوان کادر پشتیبانی', type: 'text', default: 'اگر پاسخ را پیدا نکردید' },
      { key: 'faq.side.text', label: 'متن کادر پشتیبانی', type: 'textarea', default: 'اگر سوال شما در این بخش نیست، تیم پشتیبانی خانواده برداشت آماده پاسخ‌گویی مستقیم به شماست.' },
    ],
  },
  {
    id: 'certificate',
    title: 'گواهینامه / آزمون فارغ‌التحصیلی',
    fields: [
      { key: 'certificate.tag', label: 'برچسب', type: 'text', default: 'گواهینامه' },
      { key: 'certificate.title', label: 'عنوان', type: 'text', default: 'آزمون فارغ‌التحصیلی' },
      { key: 'certificate.subtitle', label: 'زیرعنوان', type: 'text', default: 'ارزیابی نهایی و دریافت گواهینامه' },
      { key: 'certificate.heading', label: 'عنوان متن اصلی', type: 'text', default: 'مسیر دریافت گواهینامه' },
      { key: 'certificate.body', label: 'متن اصلی', type: 'textarea', default: 'پس از گذراندن مراحل آموزشی، هنرجو وارد ارزیابی نهایی می‌شود. این ارزیابی فقط یک امتحان تئوری نیست؛ عملکرد واقعی هنرجو در تمرین، اجرا و حضور گروهی بررسی می‌شود.' },
      { key: 'certificate.result', label: 'متن کادر نتیجهٔ نهایی', type: 'textarea', default: 'هنرجویان موفق، گواهینامه رسمی مسیر آموزشی خود را دریافت می‌کنند و برای مراحل بعدی معرفی و آماده‌سازی می‌شوند.' },
    ],
  },
  {
    id: 'insurance',
    title: 'بیمهٔ هنرجویان',
    fields: [
      { key: 'insurance.tag', label: 'برچسب', type: 'text', default: 'ایمنی' },
      { key: 'insurance.title', label: 'عنوان', type: 'text', default: 'بیمه هنرجویان' },
      { key: 'insurance.subtitle', label: 'زیرعنوان', type: 'text', default: 'پوشش بیمه‌ای در دوره‌ها و اردوها' },
      { key: 'insurance.heading', label: 'عنوان متن اصلی', type: 'text', default: 'امنیت و آرامش هنرجو برای ما جدی است' },
      { key: 'insurance.body', label: 'متن اصلی', type: 'textarea', default: 'خانواده برداشت برای هنرجویان در برنامه‌های آموزشی، کلاس‌ها و اردوها پوشش بیمه‌ای و فرآیندهای مراقبتی در نظر می‌گیرد تا مسیر آموزش با اطمینان بیشتری طی شود.' },
    ],
  },
  {
    id: 'onlineLearning',
    title: 'یادگیری آنلاین',
    fields: [
      { key: 'online.tag', label: 'برچسب', type: 'text', default: 'آموزش آنلاین' },
      { key: 'online.title', label: 'عنوان', type: 'text', default: 'یادگیری آنلاین' },
      { key: 'online.subtitle', label: 'زیرعنوان', type: 'text', default: 'منابع آموزشی برای تمرین در خانه' },
      { key: 'online.heading', label: 'عنوان متن اصلی', type: 'text', default: 'تمرین‌های مکمل برای رشد مستمر' },
      { key: 'online.body', label: 'متن اصلی', type: 'textarea', default: 'در این بخش آموزش‌های آنلاین، تمرین‌های بیان، بدن و تحلیل متن برای هنرجویان منتشر می‌شود تا مسیر آموزش فقط به کلاس محدود نماند.' },
    ],
  },
  {
    id: 'blog',
    title: 'مقاله‌ها',
    fields: [
      { key: 'blog.tag', label: 'برچسب', type: 'text', default: 'مطالب آموزشی' },
      { key: 'blog.title', label: 'عنوان', type: 'text', default: 'مقاله‌ها' },
      { key: 'blog.subtitle', label: 'زیرعنوان', type: 'text', default: 'مطالب آموزشی درباره بازیگری و سینما' },
    ],
  },
  {
    id: 'register',
    title: 'ثبت‌نام رایگان',
    fields: [
      { key: 'register.tag', label: 'برچسب بالای عنوان', type: 'text', default: 'عضویت رایگان' },
      { key: 'register.title', label: 'عنوان', type: 'text', default: 'ثبت‌نام در خانواده برداشت' },
      { key: 'register.subtitle', label: 'زیرعنوان', type: 'text', default: 'درخواست عضویت خود را ثبت کنید تا تیم ما برای ادامه مسیر آموزشی با شما در ارتباط باشد.' },
      { key: 'register.side.heading', label: 'عنوان کادر کناری', type: 'text', default: 'شروع مسیر بازیگری بدون مانع مالی' },
      { key: 'register.side.text', label: 'متن کادر کناری', type: 'textarea', default: 'اگر می‌خواهید به‌صورت جدی وارد مسیر آموزش بازیگری شوید، این فرم اولین قدم برای ارتباط با تیم خانواده برداشت است.' },
    ],
  },
  {
    id: 'contact',
    title: 'اطلاعات تماس (مشترک همهٔ صفحات)',
    fields: [
      { key: 'contact.phone', label: 'شمارهٔ تماس', type: 'text', default: '02191090934' },
      { key: 'contact.instagram', label: 'اینستاگرام (نام کاربری)', type: 'text', default: '@bardashtt' },
      { key: 'contact.instagramUrl', label: 'اینستاگرام (لینک کامل)', type: 'text', default: 'https://instagram.com/bardashtt' },
      { key: 'contact.bale', label: 'کانال بله (نام کاربری)', type: 'text', default: '@bardasht_family' },
      { key: 'contact.baleUrl', label: 'کانال بله (لینک کامل)', type: 'text', default: 'https://ble.ir/bardasht_family' },
    ],
  },
  {
    id: 'coursesChart',
    title: 'چارت دوره‌ها (جزئیات هر دوره)',
    fields: [
      { key: 'courses.panel.listHeading', label: 'عنوان فهرست سرفصل‌ها', type: 'text', default: 'آنچه یاد می‌گیرید' },
      { key: 'courses.pay.title', label: 'کادر ثبت‌نام — عنوان', type: 'text', default: 'ثبت‌نام رایگان' },
      { key: 'courses.pay.text', label: 'کادر ثبت‌نام — متن', type: 'textarea', default: 'تمام دوره‌های اصلی خانواده برداشت بدون شهریه برگزار می‌شود.' },
      { key: 'courses.pay.button', label: 'کادر ثبت‌نام — دکمه', type: 'text', default: 'شروع ثبت‌نام' },

      { key: 'course.c1.title', label: 'دورهٔ ۱ — نام', type: 'text', default: 'مقدماتی' },
      { key: 'course.c1.sub', label: 'دورهٔ ۱ — زیرعنوان', type: 'text', default: 'شروع مسیر' },
      { key: 'course.c1.icon', label: 'دورهٔ ۱ — آیکن (اموجی)', type: 'text', default: '🎭' },
      { key: 'course.c1.desc', label: 'دورهٔ ۱ — توضیح', type: 'textarea', default: 'ورود به دنیای بازیگری، کشف استعداد درونی و پرورش بیان، بدن، خلاقیت و تمرکز.' },
      { key: 'course.c1.items', label: 'دورهٔ ۱ — سرفصل‌ها (هر مورد یک خط)', type: 'list', default: 'شناخت استعداد درونی\nبیان\nبدن\nخلاقیت\nتمرکز' },

      { key: 'course.c2.title', label: 'دورهٔ ۲ — نام', type: 'text', default: 'تکمیلی' },
      { key: 'course.c2.sub', label: 'دورهٔ ۲ — زیرعنوان', type: 'text', default: 'عمق مهارت' },
      { key: 'course.c2.icon', label: 'دورهٔ ۲ — آیکن (اموجی)', type: 'text', default: '🧩' },
      { key: 'course.c2.desc', label: 'دورهٔ ۲ — توضیح', type: 'textarea', default: 'تعمیق مهارت‌ها با متدهای حرفه‌ای بازیگری و ساخت و تحلیل شخصیت.' },
      { key: 'course.c2.items', label: 'دورهٔ ۲ — سرفصل‌ها (هر مورد یک خط)', type: 'list', default: 'متد اکتینگ لی استراسبرگ\nمتد پنج سؤال طلایی\nتحلیل شخصیت\nشخصیت‌پردازی\nمنحنی شخصیت\nتیپ‌سازی' },

      { key: 'course.c3.title', label: 'دورهٔ ۳ — نام', type: 'text', default: 'اردو' },
      { key: 'course.c3.sub', label: 'دورهٔ ۳ — زیرعنوان', type: 'text', default: 'تجربه عملی' },
      { key: 'course.c3.icon', label: 'دورهٔ ۳ — آیکن (اموجی)', type: 'text', default: '⛺' },
      { key: 'course.c3.desc', label: 'دورهٔ ۳ — توضیح', type: 'textarea', default: 'اردوهای آموزشی برای زیستن با شخصیت و تجربه‌ی فضای واقعی تولید فیلم.' },
      { key: 'course.c3.items', label: 'دورهٔ ۳ — سرفصل‌ها (هر مورد یک خط)', type: 'list', default: 'زیست با شخصیت\nکار گروهی\nآشنایی با قوانین تولید فیلم\nاتودهای گروهی' },

      { key: 'course.c4.title', label: 'دورهٔ ۴ — نام', type: 'text', default: 'پیشرفته' },
      { key: 'course.c4.sub', label: 'دورهٔ ۴ — زیرعنوان', type: 'text', default: 'حرفه‌ای شدن' },
      { key: 'course.c4.icon', label: 'دورهٔ ۴ — آیکن (اموجی)', type: 'text', default: '🎥' },
      { key: 'course.c4.desc', label: 'دورهٔ ۴ — توضیح', type: 'textarea', default: 'بازیگری حرفه‌ای مقابل دوربین و شناخت زبان فنی و روانی سینما.' },
      { key: 'course.c4.items', label: 'دورهٔ ۴ — سرفصل‌ها (هر مورد یک خط)', type: 'list', default: 'بازی در قاب سینما\nشناخت لنزها\nتدوین برای بازیگر\nزبان مشترک با کارگردان و عوامل\nشناخت جایگاه‌ها در سینما\nروانشناسی بازیگر و کارگردان' },

      { key: 'course.c5.title', label: 'دورهٔ ۵ — نام', type: 'text', default: 'فیلمسازی' },
      { key: 'course.c5.sub', label: 'دورهٔ ۵ — زیرعنوان', type: 'text', default: 'زبان سینما' },
      { key: 'course.c5.icon', label: 'دورهٔ ۵ — آیکن (اموجی)', type: 'text', default: '🎬' },
      { key: 'course.c5.desc', label: 'دورهٔ ۵ — توضیح', type: 'textarea', default: 'تجربه‌ی کامل ساخت و بازی در فیلم، از ایده تا اجرا.' },
      { key: 'course.c5.items', label: 'دورهٔ ۵ — سرفصل‌ها (هر مورد یک خط)', type: 'list', default: 'ساخت و بازی در فیلم' },
    ],
  },
  {
    id: 'aboutMedia',
    title: 'عکس‌ها و اسلایدشوی صفحهٔ «دربارهٔ ما»',
    fields: [
      { key: 'about.slide1.image', label: 'اسلاید ۱ (بالای صفحه)', type: 'image', default: '' },
      { key: 'about.slide2.image', label: 'اسلاید ۲ (بالای صفحه)', type: 'image', default: '' },
      { key: 'about.slide3.image', label: 'اسلاید ۳ (بالای صفحه)', type: 'image', default: '' },
      { key: 'about.slider.title', label: 'متن روی اسلایدشو', type: 'text', default: 'خانواده برداشت · درباره ما' },
      { key: 'about.story.image', label: 'عکس بخش «داستان ما»', type: 'image', default: '/story-venue.jpg' },
      { key: 'about.founder.image', label: 'عکس بنیان‌گذار', type: 'image', default: '/founder-yaser.jpg' },
      { key: 'about.edu1.image', label: 'گواهی تحصیلی ۱', type: 'image', default: '/edu-avicenna.jpg' },
      { key: 'about.edu2.image', label: 'گواهی تحصیلی ۲', type: 'image', default: '/edu-oxford.jpg' },
    ],
  },
];

// نگاشت key → فیلد (برای اعتبارسنجی و مقدار پیش‌فرض)
const FIELD_BY_KEY = new Map();
for (const g of CONTENT_GROUPS) for (const f of g.fields) FIELD_BY_KEY.set(f.key, f);

export function isKnownKey(key) {
  return FIELD_BY_KEY.has(key);
}

export function defaultFor(key) {
  return FIELD_BY_KEY.get(key)?.default ?? '';
}

// تبدیل مقدار فیلدِ فهرستی (چند خطی) به آرایه‌ای از موردها، با حذف خط‌های خالی.
export function splitLines(value) {
  return String(value ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

// بارگذاری همهٔ متن‌ها از دیتابیس و برگرداندن تابع t(key) با fallback به پیش‌فرض.
export async function loadContent() {
  let rows = [];
  try {
    rows = await prisma.siteContent.findMany();
  } catch {
    rows = [];
  }
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return function t(key) {
    if (map.has(key)) return map.get(key);
    return defaultFor(key);
  };
}
