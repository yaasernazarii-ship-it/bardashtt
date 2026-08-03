# خانواده برداشت — وب‌اپلیکیشن

سایت رسمی آموزشگاه رایگان بازیگری سینما «خانواده برداشت» (`bardashtt.com`).
یک اپلیکیشن یکپارچهٔ **Next.js** (App Router) که هم سایت عمومی و هم داشبورد هنرجو/مدیریت را سرو می‌کند.

> این پروژه کاملاً روی Next.js اجرا می‌شود. هیچ فایل HTML/PHP استاتیکِ جداگانه‌ای در پروداکشن سرو نمی‌شود؛ آدرس‌های قدیمیِ `*.html` صرفاً برای حفظ سئو با ریدایرکت دائمی به مسیرهای تمیز هدایت می‌شوند (`next.config.js`).

---

## پشتهٔ فناوری

| لایه | فناوری |
|---|---|
| فریم‌ورک | Next.js 16 (App Router) + React 19 |
| پایگاه‌داده | PostgreSQL از طریق Prisma ORM |
| احراز هویت | نشست کوکی‌محور + کد یک‌بارمصرف پیامکی (OTP) |
| تولید PDF | pdfkit (گواهی/رزومه) |
| پردازش تصویر | sharp |
| استقرار | systemd (`bardasht-nextjs.service`) پشت nginx |

---

## ساختار پوشه‌ها

```
nextjs/
├── app/                    # مسیرها (App Router) — هر پوشه یک صفحه
│   ├── page.js             # صفحهٔ اصلی
│   ├── layout.js           # لایهٔ ریشه (فونت، RTL، متادیتای پایه)
│   ├── globals.css         # استایل سراسری
│   ├── home.css            # استایل صفحهٔ اصلی
│   ├── courses/            # معرفی مسیر آموزشی دوره‌ها
│   ├── audition/           # فرم ثبت‌نام دوره  ← بخش کلیدی
│   ├── auth/               # ورود / ثبت‌نام حساب
│   ├── dashboard/          # داشبورد هنرجو و پنل مدیریت (admin/*)
│   ├── actors/ blog/ news/ gallery/ faq/ ...   # صفحات محتوایی
│   └── api/                # روت‌های سمت سرور (REST)
│       ├── enrollment/     # ثبت‌نام و تحلیل
│       ├── login/ logout/ signup/ me/          # احراز هویت
│       ├── send-otp/ verify-otp/               # کد پیامکی
│       ├── payment/        # درگاه پرداخت (زیبال)
│       ├── support-chat/   # چت پشتیبانی زنده
│       └── admin/ ...      # عملیات مدیریتی
│
├── components/             # کامپوننت‌های React
│   ├── Icon.js             # مجموعهٔ آیکون خطیِ SVG (جایگزین اموجی)
│   ├── Nav.js  Footer.js  SiteHeader.js  MobileBottomNav.js
│   ├── DashboardSidebar.js
│   ├── CoursesExplorer.js  SupportChat.js  ...
│   └── Admin*.js           # پنل‌های مدیریتی
│
├── lib/                    # منطق سمت سرور و داده
│   ├── prisma.js           # کلاینت Prisma
│   ├── auth.js  password.js  sms.js            # احراز هویت
│   ├── enrollment*.js  registrationPdf.js      # ثبت‌نام
│   ├── zibal.js            # درگاه پرداخت
│   ├── siteContent.js      # متن قابل‌ویرایشِ صفحات (از پنل)
│   └── ...
│
├── prisma/schema.prisma    # مدل دیتابیس
├── public/                 # دارایی‌های ثابت (لوگو، تصاویر)
├── assets/fonts/           # فونت‌ها
├── uploads/                # فایل‌های آپلودیِ کاربران (خارج از گیت)
├── scripts/                # اسکریپت‌های کمکی (مثلاً ingest کتاب)
├── middleware.js           # محافظت مسیرهای داشبورد
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

به‌جای اموجی، از کامپوننت مرکزی `components/Icon.js` استفاده می‌شود:

```jsx
import Icon from '@/components/Icon';

<Icon name="phone" size={20} />
```

- همهٔ آیکون‌ها SVG خطی با `viewBox="0 0 24 24"` و `stroke="currentColor"` هستند؛
  یعنی رنگ را از `color`ِ والد و اندازه را از prop `size` می‌گیرند.
- برای افزودن آیکون جدید، فقط یک ورودی به شیء `PATHS` در همان فایل اضافه کنید.
- آیکون‌های موجود: `phone, instagram, chat, clipboard, home, graduationCap,
  clapperboard, sparkles, puzzle, tent, video, close, menu, arrowUp,
  calendar, user, book, creditCard, edit, check, settings, link, fileText`.

---

## اجرا در محیط توسعه

```bash
npm install          # postinstall خودش prisma generate را می‌زند
npm run dev          # http://localhost:3000
```

متغیرهای محیطی در `.env` قرار می‌گیرند (نمونه‌های لازم: `DATABASE_URL` و کلیدهای پیامک/پرداخت).
این فایل هرگز نباید کامیت شود.

## بیلد و استقرار (پروداکشن)

بیلد **روی سرور** انجام می‌شود (نه داخل کانتینر توسعه). روال امن:

1. فایل‌های تغییریافته در یک `tar.gz` بسته می‌شوند (مسیرها نسبت به ریشهٔ همین اپ).
2. روی سرور، اسکریپت `~/deploy-bardasht.sh` آن را در محیط staging باز کرده،
   `npm run build` را آنجا (جدا از ترافیک زنده) اجرا می‌کند،
   سپس خروجی `.next/` را با `rsync` به مسیر زنده منتقل و سرویس را ری‌استارت می‌کند.
3. سرویس با `systemctl restart bardasht-nextjs.service` بالا می‌آید.

هدرهای کش صفحات حساس (`/audition` و `/auth`) روی `no-store` تنظیم شده‌اند تا
بازدیدکننده همیشه نسخهٔ تازه را بگیرد (`next.config.js`).
