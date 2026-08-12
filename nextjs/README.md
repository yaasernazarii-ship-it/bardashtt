# خانواده برداشت — وب‌اپلیکیشن

سایت رسمی آموزشگاه رایگان بازیگری سینما «خانواده برداشت» (`bardashtt.com`).
یک اپلیکیشن یکپارچهٔ **Next.js** (App Router) که هم سایت عمومی و هم داشبورد هنرجو/مدیریت را سرو می‌کند.

> این پروژه کاملاً روی Next.js اجرا می‌شود. هیچ فایل HTML/PHP استاتیکِ جداگانه‌ای در پروداکشن سرو نمی‌شود؛
> آدرس‌های قدیمیِ `*.html` صرفاً برای حفظ سئو با ریدایرکت دائمی به مسیرهای تمیز هدایت می‌شوند (`next.config.js`).

---

## پشتهٔ فناوری

| لایه | فناوری |
|---|---|
| فریم‌ورک | Next.js 16 (App Router) + React 19 |
| پایگاه‌داده | PostgreSQL از طریق Prisma ORM |
| احراز هویت | نشست کوکی‌محور + کد یک‌بارمصرف پیامکی (OTP) |
| تولید PDF | pdfkit (گواهی/رزومه) |
| پردازش تصویر | sharp |
| درگاه پرداخت | زیبال |
| اطلاع‌رسانی | پیامک + پیام‌رسان بله |
| استقرار | systemd (`bardasht-nextjs.service`) پشت nginx |

---

## چه چیزهایی در محصول هست

### سایت عمومی
| مسیر | چه چیزی است |
|---|---|
| `/` | صفحهٔ اصلی |
| `/about` | دربارهٔ آموزشگاه، رزومه و افتخارات مؤسس |
| `/courses` | مسیر آموزشی پنج‌مرحله‌ای (مقدماتی → فیلمسازی) |
| `/audition` | **فرم ثبت‌نام دوره** — مهم‌ترین مسیر تبدیل |
| `/online-learning` | دوره‌های آنلاین؛ ویدیوها پس از خرید باز می‌شوند |
| `/actors` | بانک بازیگران — فقط برای فیلمساز و مدیریت |
| `/gallery` `/blog` `/news` | محتوا؛ از پنل مدیریت پر می‌شود |
| `/social-responsibility` | کتاب، پادکست، عکس، ویدئو، آگاهی‌سازی |
| `/certificate` `/verify` | صدور و استعلام گواهی پایان دوره |
| `/insurance` `/faq` `/works/*` | صفحات اطلاع‌رسانی |
| `/auth` `/register` | ورود و ساخت حساب |

### داشبورد هنرجو (`/dashboard`)
پروفایل و عکس ۳×۴ · برنامهٔ کلاس و حضور و غیاب · تقویم · آزمون آنلاین ·
رزومهٔ بازیگری و ویدیوی معرفی · سفارش کتاب · پرداخت‌ها · دستیار هوشمند Bardasht.AI

### پنل مدیریت (`/dashboard/admin`)
کاربران · کلاس‌ها و جلسات · ثبت‌نام‌ها · درخواست عضویت · پرداخت‌ها ·
دوره‌های آنلاین و دسترسی خریداران · کتاب و سفارش‌ها · گواهی‌ها ·
مطالب و اخبار · محتوای قابل‌ویرایش صفحات · پشتیبانی زنده · بانک سؤال آزمون · لینک‌های سایت

---

## ساختار پوشه‌ها

```
nextjs/
├── app/                    # مسیرها (App Router) — هر پوشه یک صفحه
│   ├── page.js             # صفحهٔ اصلی
│   ├── layout.js           # لایهٔ ریشه (فونت، RTL، متادیتای پایه)
│   ├── globals.css         # استایل سراسری + قواعد آیکون
│   ├── home.css            # استایل صفحهٔ اصلی
│   ├── courses/courses.css # استایل صفحهٔ دوره‌ها
│   ├── dashboard/          # داشبورد هنرجو و پنل مدیریت (admin/*)
│   ├── media/[name]/       # سرو کردن فایل‌های آپلودی از uploads/
│   ├── robots.js sitemap.js
│   └── api/                # روت‌های سمت سرور (REST)
│       ├── login/ logout/ signup/ me/          # احراز هویت
│       ├── send-otp/ verify-otp/               # کد پیامکی
│       ├── enrollment/     # ثبت‌نام و تحلیل
│       ├── payment/        # درگاه پرداخت (زیبال)
│       ├── my/             # داده‌های شخصی کاربر واردشده
│       ├── support-chat/   # چت پشتیبانی زنده
│       └── admin/ ...      # عملیات مدیریتی
│
├── components/             # کامپوننت‌های React
│   ├── Icon.js             # مجموعهٔ آیکون خطیِ SVG — تنها منبع آیکون
│   ├── Nav.js  Footer.js  SiteHeader.js  MobileBottomNav.js
│   ├── DashboardSidebar.js
│   └── Admin*.js           # پنل‌های مدیریتی
│
├── lib/                    # منطق سمت سرور و داده
│   ├── prisma.js           # کلاینت Prisma
│   ├── auth.js  password.js  sms.js            # احراز هویت
│   ├── enrollment*.js  registrationPdf.js      # ثبت‌نام
│   ├── zibal.js            # درگاه پرداخت
│   ├── siteContent.js      # متن قابل‌ویرایشِ صفحات (از پنل)
│   └── bale.js             # اطلاع‌رسانی به پیام‌رسان بله
│
├── prisma/schema.prisma    # مدل دیتابیس
├── public/                 # دارایی‌های ثابت (لوگو، تصاویر)
├── assets/fonts/           # فونت‌ها
├── uploads/                # فایل‌های آپلودیِ کاربران (خارج از گیت)
├── scripts/ingest-book.js  # بارگذاری متن کتاب برای دستیار هوشمند
├── proxy.js                # تمدید کوکیِ نشست (قبلاً middleware.js)
└── next.config.js          # ریدایرکت‌ها، هدرها، تنظیمات
```

---

## مدل‌های دیتابیس (خلاصه)

کاربر و کلاس: `User`, `ClassGroup`, `ClassSession`, `Attendance`, `ClassEvent`
ثبت‌نام و مالی: `Enrollment`, `Payment`, `Course`, `CourseLesson`, `CourseAccess`, `SignupRequest`
احراز هویت: `Session`, `OtpCode`
محتوا: `Post`, `SiteContent`, `GalleryItem`, `ActorResume`
پشتیبانی و اطلاع‌رسانی: `SupportConversation`, `SupportMessage`, `Notification`
فروشگاه کتاب: `Book`, `BookOrder`, `BookChunk`
سایر: `BookingRequest` (ست‌تایم بازیگران)

---

## سیستم آیکون

**در رابط کاربری از اموجی استفاده نمی‌کنیم.** هر آیکونی که کاربر می‌بیند از کامپوننت
مرکزی `components/Icon.js` می‌آید — هم در سایت عمومی، هم در داشبورد، هم در پنل مدیریت.

```jsx
import Icon from '@/components/Icon';

<Icon name="phone" size={20} />
<Icon name="clapperboard" size={14} strokeWidth={1.6} />
```

- همهٔ آیکون‌ها SVG خطی با `viewBox="0 0 24 24"` و `stroke="currentColor"` هستند؛
  یعنی رنگ را از `color`ِ والد و اندازه را از prop `size` می‌گیرند.
- هر SVG خودکار کلاس `.ico` می‌گیرد که هم‌ترازیِ عمودی با متنِ کنارش را درست می‌کند.
- برای ردیف‌های «آیکون + متن» از کلاس `.meta-ico` یا `.icon-inline` روی والد استفاده کنید.
- تیکِ فهرست‌های CSS از متغیر `--check-mask` می‌آید تا با همین خانواده هم‌شکل بماند.
- برای افزودن آیکون جدید فقط یک ورودی به شیء `PATHS` در همان فایل اضافه کنید
  (مسیرها هم‌سبک با Lucide کشیده شده‌اند).

آیکون‌های موجود:

```
phone  instagram  chat  clipboard  home  graduationCap  clapperboard
sparkles  puzzle  tent  video  close  menu  arrowUp  arrowLeft
calendar  clock  user  users  book  bookOpen  creditCard  banknote
edit  pencil  check  checkMark  xCircle  alertTriangle  settings  link
fileText  scroll  shield  trophy  masks  mic  image  lock  package
tag  mapPin  bell  megaphone  toolbox  receipt  plus  bot
```

> **استثنا:** متنِ پیامک و پیام‌های پیام‌رسان بله (`lib/*Notify.js` و بعضی روت‌های API)
> عمداً اموجی دارند؛ آن‌ها رابط کاربریِ ما نیستند و در اپلیکیشن مقصد خوانده می‌شوند.

---

## اجرا در محیط توسعه

```bash
npm install          # postinstall خودش prisma generate را می‌زند
npm run dev          # http://localhost:3000
```

متغیرهای محیطی در `.env` قرار می‌گیرند (`DATABASE_URL` و کلیدهای پیامک/پرداخت/بله).
این فایل هرگز نباید کامیت شود.

## بیلد و استقرار (پروداکشن)

بیلد **روی سرور** انجام می‌شود، نه در محیط توسعه. روال امن:

1. فایل‌های تغییریافته در یک `tar.gz` بسته می‌شوند (مسیرها نسبت به ریشهٔ همین اپ).
2. روی سرور، اسکریپت `~/deploy-bardasht.sh` آن را در محیط staging باز کرده،
   `npm run build` را آنجا (جدا از ترافیک زنده) اجرا می‌کند،
   سپس خروجی `.next/` را با `rsync` به مسیر زنده منتقل و سرویس را ری‌استارت می‌کند.
3. سرویس با `systemctl restart bardasht-nextjs.service` بالا می‌آید.

```bash
tar -czf /tmp/change.tar.gz -T changed-files.txt
scp /tmp/change.tar.gz ubuntu@<server>:/tmp/
ssh ubuntu@<server> '~/deploy-bardasht.sh /tmp/change.tar.gz'
```

پیش از هر استقرار، نقطهٔ برگشت در `~/rollbacks/` و بکاپ دیتابیس در `~/db-backups/` گرفته می‌شود.

هدرهای کش صفحات حساس (`/audition` و `/auth`) روی `no-store` تنظیم شده‌اند تا
بازدیدکننده همیشه نسخهٔ تازه را بگیرد (`next.config.js`).

## نکتهٔ مهم دربارهٔ دیتابیس

محیط زنده و آزمایشی **یک دیتابیس مشترک** دارند. هر تغییر اسکیمای Prisma بلافاصله
روی سایت زنده هم اثر می‌گذارد؛ پس تغییرها باید سازگار با کدِ در حال اجرا باشند
(مثلاً افزودن ستونِ اختیاری بی‌خطر است، اما حذف یا تغییر نوع ستون نه).
