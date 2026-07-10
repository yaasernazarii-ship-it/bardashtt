<?php
/**
 * تأیید کد OTP
 *
 * POST /api/verify-otp.php
 * body: phone=09... & code=123456
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { echo json_encode(['ok'=>false,'msg'=>'فقط POST مجاز است']); exit; }

session_start();

$phone = trim($_POST['phone'] ?? '');
$code  = trim($_POST['code']  ?? '');

if (!preg_match('/^09[0-9]{9}$/', $phone)) {
    echo json_encode(['ok' => false, 'msg' => 'شماره موبایل نامعتبر است']);
    exit;
}
if (!preg_match('/^[0-9]{6}$/', $code)) {
    echo json_encode(['ok' => false, 'msg' => 'فرمت کد نامعتبر است']);
    exit;
}

$sessionKey = 'otp_' . $phone;
$stored     = $_SESSION[$sessionKey] ?? null;

if (!$stored) {
    echo json_encode(['ok' => false, 'msg' => 'کدی برای این شماره ارسال نشده است.']);
    exit;
}

if (time() > $stored['expires']) {
    unset($_SESSION[$sessionKey]);
    echo json_encode(['ok' => false, 'msg' => 'کد منقضی شده است. دوباره درخواست کنید.', 'expired' => true]);
    exit;
}

// مقایسه با hash_equals برای جلوگیری از timing attack
if (!hash_equals($stored['code'], $code)) {
    echo json_encode(['ok' => false, 'msg' => 'کد وارد شده اشتباه است.']);
    exit;
}

// کد صحیح — حذف از session
unset($_SESSION[$sessionKey]);
unset($_SESSION['otp_lock_' . $phone]);

echo json_encode(['ok' => true]);
