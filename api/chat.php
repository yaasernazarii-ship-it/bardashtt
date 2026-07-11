<?php
/**
 * دستیار هوشمند سینمایی — خانواده برداشت
 * سرویس: Groq API (رایگان)
 *
 * POST /api/chat.php
 * body: message=..., history=[{role,content}...]
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { echo json_encode(['ok'=>false,'msg'=>'فقط POST']); exit; }

// ─── تنظیمات ────────────────────────────────────
define('GROQ_API_KEY', 'YOUR_GROQ_API_KEY');   // از groq.com رایگان بگیر
define('GROQ_MODEL',   'llama-3.3-70b-versatile');
// ─────────────────────────────────────────────────

$body    = json_decode(file_get_contents('php://input'), true);
$message = trim($body['message'] ?? '');
$history = $body['history'] ?? [];

if (!$message) {
    echo json_encode(['ok' => false, 'msg' => 'پیام خالی است']);
    exit;
}

$systemPrompt = <<<PROMPT
تو «سینا» هستی — دستیار هوشمند تخصصی آموزشگاه بازیگری «خانواده برداشت» در ایران.

وظیفه تو: پاسخ دادن به سوالات هنرجویان درباره سینما و بازیگری.

موضوعاتی که پاسخ می‌دهی:
- تکنیک‌های بازیگری (استانیسلاوسکی، متد اکتینگ، مایزنر، برشت و...)
- تاریخ سینمای ایران و جهان
- کارگردانان و بازیگران مشهور
- فیلمنامه‌نویسی و ساختار داستان
- زبان بدن، بیان، و حضور در صحنه
- دوربین، نور، و اصطلاحات فنی سینما
- معرفی فیلم‌ها و آثار مهم سینمایی
- نقد و تحلیل فیلم
- جوایز سینمایی (اسکار، کن، برلین و...)

اگر سوال ربطی به سینما، بازیگری یا هنر هفتم نداشت، با احترام بگو:
«این سوال خارج از حوزه تخصص من (سینما و بازیگری) است. خوشحال می‌شوم سوالات سینمایی شما را پاسخ دهم! 🎬»

قوانین پاسخ:
- همیشه به فارسی پاسخ بده
- مختصر، مفید و دوستانه باش
- از ایموجی‌های مرتبط استفاده کن
- اگر نمی‌دانی صادقانه بگو
PROMPT;

// ساخت آرایه پیام‌ها
$messages = [['role' => 'system', 'content' => $systemPrompt]];

// تاریخچه مکالمه (حداکثر ۱۰ پیام قبلی)
$recentHistory = array_slice($history, -10);
foreach ($recentHistory as $h) {
    if (in_array($h['role'] ?? '', ['user', 'assistant']) && !empty($h['content'])) {
        $messages[] = ['role' => $h['role'], 'content' => $h['content']];
    }
}

$messages[] = ['role' => 'user', 'content' => $message];

$payload = json_encode([
    'model'       => GROQ_MODEL,
    'messages'    => $messages,
    'temperature' => 0.7,
    'max_tokens'  => 1024,
]);

$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . GROQ_API_KEY,
    ],
]);

$response = curl_exec($ch);
$curlErr  = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($curlErr) {
    echo json_encode(['ok' => false, 'msg' => 'خطا در اتصال به سرویس هوش مصنوعی']);
    exit;
}

$res = json_decode($response, true);

if ($httpCode === 200 && isset($res['choices'][0]['message']['content'])) {
    echo json_encode([
        'ok'      => true,
        'reply'   => $res['choices'][0]['message']['content'],
        'tokens'  => $res['usage']['total_tokens'] ?? 0,
    ]);
} else {
    $errMsg = $res['error']['message'] ?? 'خطای ناشناخته';
    error_log('[Chat] Groq error: ' . $errMsg);
    echo json_encode(['ok' => false, 'msg' => 'خطا در پردازش پیام. لطفاً دوباره تلاش کنید.']);
}
