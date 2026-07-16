// منطق سمت سرور فرایند ثبت‌نام: تحلیل هوش مصنوعی تیپ بازیگری.
import { chat, isAiConfigured } from './ai';
import { QUESTIONS, ACTOR_TYPES } from './enrollmentData';

export { COURSES, QUESTIONS, ACTOR_TYPES, VIDEO_FORM_URL, courseByKey, validateAnswers } from './enrollmentData';

// تشخیص محلی (پشتیبان) بر پایه‌ی مجموع گزینه‌ها، در صورت در دسترس نبودن هوش مصنوعی.
function fallbackType(answers) {
  const counts = [0, 0, 0, 0];
  for (const a of answers) counts[a % 4]++;
  const max = Math.max(...counts);
  return ACTOR_TYPES[counts.indexOf(max)];
}

// تحلیل پاسخ‌های تست با هوش مصنوعی و تعیین تیپ بازیگری.
export async function analyzeActorType(fullName, answers) {
  const qa = QUESTIONS.map((item, i) => `${i + 1}. ${item.q}\n   پاسخ: ${item.options[answers[i]]}`).join('\n');

  if (!isAiConfigured()) {
    const type = fallbackType(answers);
    return { actorType: type, analysis: `بر اساس پاسخ‌های شما، تیپ بازیگری «${type}» تشخیص داده شد.` };
  }

  const system = [
    'تو یک مربی و تحلیل‌گر بازیگری در آموزشگاه «خانواده برداشت» هستی.',
    'بر اساس پاسخ‌های تست هنرجو، تیپ بازیگری او را از میان این چهار گزینه انتخاب کن:',
    ACTOR_TYPES.join(' | '),
    'خروجی را دقیقاً به‌صورت JSON و فقط JSON بده، بدون هیچ توضیح اضافه، با این ساختار:',
    '{"actorType":"یکی از چهار گزینه","analysis":"دو تا سه جمله فارسی، محترمانه و دلگرم‌کننده درباره‌ی ویژگی‌های بازیگری این فرد"}',
  ].join('\n');

  const userMsg = `نام هنرجو: ${fullName}\nپاسخ‌های تست:\n${qa}`;

  try {
    const raw = await chat(
      [
        { role: 'system', content: system },
        { role: 'user', content: userMsg },
      ],
      { temperature: 0.4, maxTokens: 400 },
    );
    const jsonText = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonText);
    const actorType = ACTOR_TYPES.includes(parsed.actorType) ? parsed.actorType : fallbackType(answers);
    const analysis = String(parsed.analysis || '').slice(0, 600) || `تیپ بازیگری شما «${actorType}» است.`;
    return { actorType, analysis };
  } catch {
    const type = fallbackType(answers);
    return { actorType: type, analysis: `بر اساس پاسخ‌های شما، تیپ بازیگری «${type}» تشخیص داده شد.` };
  }
}
