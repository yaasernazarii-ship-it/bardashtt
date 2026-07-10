<?php
/**
 * ارسال کد یکبار مصرف (OTP) به شماره موبایل
 * سرویس: کاوه‌نگار (kavenegar.com)
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
const KAVENEGAR_API_KEY = 'YOUR_KAVENEGAR_API_KEY';   // کلید API از پنل کاوه‌نگار
const KAVENEGAR_TEMPLATE = 'verify';                  // نام قالب OTP در پنل کاوه‌نگار
const OTP_TTL_SECONDS    = 120;                       // مدت اعتبار کد (ثانیه)
// ─────────────────────────────────────────────────────────

$phone = trim($_POST['phone'] ?? '');

// اعتبارسنجی شماره ایرانی
if (!preg_match('/^09[0-9]{9}$/', $phone)) {
    echo json_encode(['ok' => false, 'msg' => 'شماره موبایل معتبر نیست']);
    exit;
}

// جلوگیری از spam: بررسی ارسال زودهنگام
$lockKey = 'otp_lock_' . $phone;
if (isset($_SESSION[$lockKey]) && time() < $_SESSION[$lockKey]) {
    $wait = $_SESSION[$lockKey] - time();
    echo json_encode(['ok' => false, 'msg' => "لطفاً {$wait} ثانیه صبر کنید و دوباره تلاش کنید."]);
    exit;
}

// تولید کد ۶ رقمی امن
$otp = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

// ذخیره در session
$_SESSION['otp_' . $phone] = [
    'code'    => $otp,
    'expires' => time() + OTP_TTL_SECONDS,
];
$_SESSION[$lockKey] = time() + 60; // قفل ۶۰ ثانیه‌ای بین ارسال‌ها

// ارسال از طریق کاوه‌نگار
$url  = 'https://api.kavenegar.com/v1/' . urlencode(KAVENEGAR_API_KEY) . '/verify/lookup.json';
$data = http_build_query([
    'receptor' => $phone,
    'token'    => $otp,
    'template' => KAVENEGAR_TEMPLATE,
]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $data,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_SSL_VERIFYPEER => true,
]);
$response = curl_exec($ch);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr) {
    error_log('[OTP] curl error: ' . $curlErr);
    echo json_encode(['ok' => false, 'msg' => 'خطا در اتصال به سرویس پیامک']);
    exit;
}

$res = json_decode($response, true);
if (isset($res['return']['status']) && $res['return']['status'] === 200) {
    echo json_encode(['ok' => true]);
} else {
    $errMsg = $res['return']['message'] ?? 'خطای ناشناخته';
    error_log('[OTP] kavenegar error: ' . $errMsg . ' | response: ' . $response);
    echo json_encode(['ok' => false, 'msg' => 'ارسال پیامک ناموفق بود. لطفاً دوباره تلاش کنید.']);
}
