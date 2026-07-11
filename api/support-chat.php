<?php
/**
 * چت پشتیبانی — ارسال به تلگرام
 *
 * POST /api/support-chat.php
 * body: name=..., phone=..., message=..., history=...
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { echo json_encode(['ok'=>false,'msg'=>'فقط POST']); exit; }

// ─── تنظیمات ───────────────────────────────────
define('TG_BOT_TOKEN', 'YOUR_BOT_TOKEN');   // توکن ربات تلگرام
define('TG_CHAT_ID',   'YOUR_CHAT_ID');     // آیدی چت یا گروه ادمین
// ────────────────────────────────────────────────

$name    = trim($_POST['name']    ?? 'ناشناس');
$phone   = trim($_POST['phone']   ?? '—');
$message = trim($_POST['message'] ?? '');

if (!$message) {
    echo json_encode(['ok' => false, 'msg' => 'پیام خالی است']);
    exit;
}

// ساخت متن تلگرام
$date = date('Y-m-d H:i', time() + 3.5 * 3600); // تهران UTC+3:30
$text = "💬 *پیام پشتیبانی سایت*\n\n"
      . "👤 نام: {$name}\n"
      . "📱 موبایل: {$phone}\n"
      . "🕐 زمان: {$date}\n\n"
      . "📝 پیام:\n{$message}";

$payload = json_encode([
    'chat_id'    => TG_CHAT_ID,
    'text'       => $text,
    'parse_mode' => 'Markdown',
]);

$ch = curl_init('https://api.telegram.org/bot' . TG_BOT_TOKEN . '/sendMessage');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
]);

$res     = curl_exec($ch);
$curlErr = curl_error($ch);
curl_close($ch);

if ($curlErr) {
    echo json_encode(['ok' => false, 'msg' => 'خطا در ارسال']);
    exit;
}

$json = json_decode($res, true);
echo json_encode(['ok' => $json['ok'] ?? false]);
