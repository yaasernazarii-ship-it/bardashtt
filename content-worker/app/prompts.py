import json

CATEGORIES = {
    'bazigari': 'بازیگری', 'amoozesh-bazigari': 'آموزش بازیگری', 'test-bazigari': 'تست بازیگری',
    'kargardani': 'کارگردانی', 'filmnamenevisi': 'فیلمنامه‌نویسی', 'cinema': 'سینما',
    'ravanshenasi': 'روان‌شناسی', 'khanevade': 'خانواده', 'etemad-be-nafs': 'اعتمادبه‌نفس',
    'ezzat-nafs': 'عزت نفس', 'hoosh-hayejani': 'هوش هیجانی', 'koodak': 'کودک',
    'nojavan': 'نوجوان', 'movaffaghiat': 'موفقیت', 'shakhsiat-shenasi': 'شخصیت‌شناسی',
    'zaban-badan': 'زبان بدن', 'ertebat-moaser': 'ارتباط مؤثر', 'fan-bayan': 'فن بیان',
    'tose-fardi': 'توسعه فردی', 'projehaye-farhangi': 'پروژه‌های فرهنگی',
}


def payload(instructions: str, article: str) -> list[dict[str, str]]:
    return [
        {'role': 'system', 'content': 'فقط JSON معتبر و بدون Markdown برگردان.'},
        {'role': 'user', 'content': f'{instructions}\n\nمقالهٔ منبع:\n{article}'},
    ]


def news_prompt(source_name: str, article: str) -> list[dict[str, str]]:
    return payload(
        f'''تو دبیر خبر خانواده برداشت هستی. خبر زیر از {source_name} آمده است. متن را مستقل، دقیق، روان و بدون افزودن واقعیت بازنویسی کن. ترجمهٔ خط‌به‌خط ممنوع است. نقل‌قول مستقیم، آمار و نام‌ها را فقط در صورت وجود در منبع نگه دار.
body باید با یک پاراگراف ۲ تا ۳ جمله‌ای «خلاصه کلیدی و پاسخ سریع» آغاز شود، سپس فقط H2 و H3 Markdown داشته باشد (هرگز H1 نده). یک بخش «نکته اختصاصی و کاربردی خانه برداشت» با ارزش آموزشی واقعی اضافه کن و در پایان دقیقاً این جمله را بیاور: «به گزارش خانواده برداشت، به نقل از خبرگزاری {source_name}.»
خروجی JSON با کلیدهای title، slug، meta_title، meta_description، excerpt، image_alt، faq و body بده. meta_title حداکثر ۴۰ کاراکتر، meta_description بین ۱۳۰ تا ۱۶۰ کاراکتر، faq دقیقاً آرایهٔ سه شیء با q و a کوتاه باشد.''',
        article,
    )


def blog_prompt(source_name: str, article: str) -> list[dict[str, str]]:
    categories = json.dumps(CATEGORIES, ensure_ascii=False)
    return payload(
        f'''تو ویراستار آموزشی خانواده برداشت هستی. مقالهٔ {source_name} را به فارسی روان، تحلیلی، آموزشی و متناسب با فرهنگ ایران بازآفرینی کن؛ ترجمهٔ خط‌به‌خط ممنوع است و هیچ ادعای تازه یا توصیهٔ پزشکی/روان‌درمانی قطعی نساز. body با یک پاراگراف ۲ تا ۳ جمله‌ای «خلاصه کلیدی و پاسخ سریع» آغاز می‌شود، سپس فقط H2 و H3 Markdown دارد (هرگز H1 نده). بخش «نکته اختصاصی و کاربردی خانه برداشت» و نتیجه‌گیری را اضافه کن و در پایان یک خط «منبع: {source_name}» قرار بده.
category باید دقیقاً یکی از کلیدهای این نگاشت باشد: {categories}
خروجی JSON با کلیدهای title، slug، meta_title، meta_description، excerpt، image_alt، body، category، tags و faq بده. meta_title حداکثر ۴۰ کاراکتر، meta_description بین ۱۳۰ تا ۱۶۰ کاراکتر، tags آرایه‌ای کوتاه و faq دقیقاً آرایهٔ سه شیء با q و a کوتاه باشد.''',
        article,
    )
