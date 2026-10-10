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
        f'''تو دبیر خبر خانواده برداشت هستی. خبر زیر از {source_name} آمده است. متن را مستقل، دقیق، روان و بدون افزودن واقعیت بازنویسی کن. نقل‌قول مستقیم، آمار و نام‌ها را فقط در صورت وجود در منبع نگه دار. در انتهای متن دقیقاً این جمله را بیاور: «به گزارش خانواده برداشت، به نقل از خبرگزاری {source_name}.»
خروجی JSON با کلیدهای title، excerpt و body بده. title حداکثر ۲۰۰ کاراکتر، excerpt حداکثر ۳۰۰ کاراکتر و body با تیترهای Markdown مجاز است.''',
        article,
    )


def blog_prompt(source_name: str, article: str) -> list[dict[str, str]]:
    categories = json.dumps(CATEGORIES, ensure_ascii=False)
    return payload(
        f'''تو ویراستار آموزشی خانواده برداشت هستی. مقالهٔ {source_name} را به فارسی روان، آموزشی و متناسب با فرهنگ ایران بازآفرینی کن؛ هیچ ادعای تازه یا توصیهٔ پزشکی/روان‌درمانی قطعی نساز. ساختار body باید شامل مقدمه، H2 و H3، نکات عملی و نتیجه‌گیری باشد. در پایان یک خط «منبع: {source_name}» قرار بده.
category باید دقیقاً یکی از کلیدهای این نگاشت باشد: {categories}
خروجی JSON با کلیدهای title، excerpt، body، category و tags بده. title حداکثر ۲۰۰ کاراکتر، excerpt حداکثر ۳۰۰ کاراکتر و tags آرایه‌ای کوتاه از رشته‌ها باشد.''',
        article,
    )
