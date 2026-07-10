<?php
/**
 * ارسال کد یکبار مصرف (OTP) به شماره موبایل
 * سرویس: sms.ir
 *
 * POST /api/send-otp.php
 * body: phone=09...
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { echo json_encode(['ok'=>false,'msg'=>'فقط POST مجاز است']); exit; }

session_start();

// ─── تنظیمات ─────────────────────────────────────────────
define('SMSIR_API_KEY',    'uh7w6cNc203IHHBuIbUqNZzEfxhfxRrfbhfv2HLdxZTCMx7n');
define('SMSIR_TEMPLATE_ID', 267687);
define('OTP_TTL_SECONDS',   120);
// ─────────────────────────────────────────────────────────

$phone = trim($_POST['phone'] ?? '');

if (!preg_match('/^09[0-9]{9}$/', $phone)) {
    echo json_encode(['ok' => false, 'msg' => 'شماره موبایل معتبر نیست']);
    exit;
}

// جلوگیری از spam
$lockKey = 'otp_lock_' . $phone;
if (isset($_SESSION[$lockKey]) && time() < $_SESSION[$lockKey]) {
    $wait = $_SESSION[$lockKey] - time();
    echo json_encode(['ok' => false, 'msg' => "لطفاً {$wait} ثانیه صبر کنید."]);
    exit;
}

// تولید کد ۶ رقمی امن
$otp = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

// ذخیره در session
$_SESSION['otp_' . $phone] = [
    'code'    => $otp,
    'expires' => time() + OTP_TTL_SECONDS,
];
$_SESSION[$lockKey] = time() + 60;

// ارسال از طریق sms.ir
$payload = json_encode([
    'mobile'     => $phone,
    'templateId' => SMSIR_TEMPLATE_ID,
    'parameters' => [
        ['name' => 'Code', 'value' => $otp]
    ]
]);

$ch = curl_init('https://api.sms.ir/v1/send/verify');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Accept: application/json',
        'X-API-KEY: ' . SMSIR_API_KEY,
    ],
]);
$response = curl_exec($ch);
$curlErr  = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($curlErr) {
    error_log('[OTP] curl error: ' . $curlErr);
    echo json_encode(['ok' => false, 'msg' => 'خطا در اتصال به سرویس پیامک']);
    exit;
}

$res = json_decode($response, true);
if ($httpCode === 200 && isset($res['status']) && $res['status'] === 1) {
    echo json_encode(['ok' => true]);
} else {
    $errMsg = $res['message'] ?? 'خطای ناشناخته';
    error_log('[OTP] smsir error: ' . $errMsg . ' | response: ' . $response);
    echo json_encode(['ok' => false, 'msg' => 'ارسال پیامک ناموفق بود. لطفاً دوباره تلاش کنید.']);
}
