BEGIN;

-- فاصلهٔ اضافه در ابتدا/انتهای عنوان دوره‌ها
UPDATE "SiteContent" SET value = btrim(value)
 WHERE key IN ('course.c1.title','course.c2.title');

-- «سینمای» ناقص → «سینمایی» و جملهٔ نیمه‌تمام «خواهد ش» → «خواهد شد.»
UPDATE "SiteContent"
   SET value = replace(
                 replace(value, 'پروژه‌های سینمای' || chr(10), 'پروژه‌های سینمایی' || chr(10)),
                 'وارد پروژه‌های عملی و حرفه‌ای خواهد ش',
                 'وارد پروژه‌های عملی و حرفه‌ای خواهد شد.')
 WHERE key = 'course.c3.items';

-- افتادن «آ» در ابتدای «آنچه» و فاصلهٔ دوتایی پیش از «هنرجو»
UPDATE "SiteContent"
   SET value = replace(
                 replace(value, 'نچه در این دوره خواهید آموخت', 'آنچه در این دوره خواهید آموخت'),
                 'بخشی از رزومه  هنرجو باشد',
                 'بخشی از رزومهٔ هنرجو باشد')
 WHERE key = 'course.c5.items';

-- نقطهٔ پایانی جاافتاده در انتهای پاراگراف‌ها
UPDATE "SiteContent"
   SET value = replace(value, 'آماده می‌کند' || chr(10), 'آماده می‌کند.' || chr(10))
 WHERE key = 'course.c3.desc';

UPDATE "SiteContent"
   SET value = replace(value, 'ایفای نقش کنید' || chr(10), 'ایفای نقش کنید.' || chr(10))
 WHERE key = 'course.c4.desc';

UPDATE "SiteContent"
   SET value = value || '.'
 WHERE key = 'course.c4.items' AND right(value, 1) <> '.';

UPDATE "SiteContent"
   SET value = replace(value, 'را کسب می‌کنند' || chr(10), 'را کسب می‌کنند.' || chr(10))
 WHERE key = 'course.c5.desc';

-- یکدست‌سازی «سوال» با «سؤال» که در بقیهٔ سایت به کار رفته است
UPDATE "SiteContent" SET value = replace(value, 'سوال', 'سؤال')
 WHERE key IN ('faq.title','faq.subtitle','faq.side.text');

COMMIT;
