<?php
/**
 * دستیار سینمایی «سینا» — خانواده برداشت
 * Groq AI (llama-3.3-70b)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { echo json_encode(['ok'=>false,'msg'=>'فقط POST']); exit; }

define('GROQ_API_KEY', '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');
define('GROQ_MODEL',   'llama-3.3-70b-versatile');

$body    = json_decode(file_get_contents('php://input'), true);
$message = trim($body['message'] ?? '');
$history = $body['history'] ?? [];

if (!$message) { echo json_encode(['ok'=>false,'msg'=>'پیام خالی']); exit; }

$systemPrompt = <<<PROMPT
تو «سینا» هستی — دستیار هوشمند تخصصی آموزشگاه بازیگری «خانواده برداشت» در ایران.

درباره آموزشگاه:
- اولین و تنها آموزشگاه رایگان بازیگری سینما در ایران
- آموزش کاملاً رایگان است؛ هنرجوها فقط هزینه پلاتو (فضای آموزشی) + بیمه می‌پردازند
- ۵ مرحله آموزشی: مقدماتی، تکمیلی، اردو، پیشرفته، فیلمسازی
- هر مرحله با آزمون فارغ‌التحصیلی و گواهینامه ختم می‌شود
- دو شعبه: تهران و مازندران
- تلفن: 02191090934
- اینستاگرام: bardashtt@

حوزه تخصص تو:
- تکنیک‌های بازیگری (استانیسلاوسکی، متد اکتینگ، مایزنر، برشت و...)
- تاریخ سینمای ایران و جهان
- کارگردانان و بازیگران مشهور
- فیلمنامه‌نویسی و ساختار داستان
- زبان بدن، بیان، حضور در صحنه
- اصطلاحات فنی سینما (نما، تدوین، نور، صدا)
- معرفی و نقد فیلم
- جوایز سینمایی

قوانین:
- همیشه به فارسی روان و دوستانه پاسخ بده
- از ایموجی مرتبط استفاده کن
- پاسخ‌ها را ساختارمند (با bullet یا bold) بنویس
- اگر سوال خارج از سینما و بازیگری بود، مودبانه بگو خارج از حوزه‌ات است
PROMPT;

$messages = [['role' => 'system', 'content' => $systemPrompt]];
foreach (array_slice($history, -10) as $h) {
    if (in_array($h['role'] ?? '', ['user','assistant']) && !empty($h['content'])) {
        $messages[] = ['role' => $h['role'], 'content' => $h['content']];
    }
}
$messages[] = ['role' => 'user', 'content' => $message];

$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode(['model'=>GROQ_MODEL,'messages'=>$messages,'temperature'=>0.7,'max_tokens'=>1024]),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json','Authorization: Bearer '.GROQ_API_KEY],
]);

$response = curl_exec($ch);
$err      = curl_error($ch);
$code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($err) { echo json_encode(['ok'=>false,'msg'=>'خطا در اتصال']); exit; }

$res = json_decode($response, true);
if ($code === 200 && isset($res['choices'][0]['message']['content'])) {
    echo json_encode(['ok'=>true,'reply'=>$res['choices'][0]['message']['content']], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['ok'=>false,'msg'=>'خطا در پردازش پیام']);
}
