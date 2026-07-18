import { prisma } from '@/lib/prisma';

// رجیستری متن‌های قابل‌ویرایش صفحات.
// هر فیلد: key یکتا، label فارسی، type ('text' | 'textarea')، و مقدار پیش‌فرض.
// برای افزودن متن جدید کافی است فیلد را اینجا اضافه و در صفحه با t('key') بخوانید.
export const CONTENT_GROUPS = [
  {
    id: 'home',
    title: 'صفحهٔ اصلی',
    fields: [
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
