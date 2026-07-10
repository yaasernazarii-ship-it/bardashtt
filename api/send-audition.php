<?php
/**
 * دریافت فرم تست بازیگری + ویدیو و ارسال به تلگرام
 * گزارش به صورت فایل HTML + پیام خلاصه + ویدیو
 *
 * POST /api/send-audition.php
 * fields: name, phone, actor_type, q0..q9, video (file)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// ─── تنظیمات تلگرام ─────────────────────────────
define('TG_BOT_TOKEN', 'YOUR_BOT_TOKEN');   // توکن ربات تلگرام
define('TG_CHAT_ID',   'YOUR_CHAT_ID');     // آی‌دی چت شما
// ─────────────────────────────────────────────────

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['ok' => false, 'msg' => 'فقط POST مجاز است']);
    exit;
}

$name       = trim($_POST['name']       ?? '');
$phone      = trim($_POST['phone']      ?? '');
$actor_type = trim($_POST['actor_type'] ?? '');

if (!$name || !$phone) {
    echo json_encode(['ok' => false, 'msg' => 'اطلاعات ناقص است']);
    exit;
}

$now = (new DateTime('now', new DateTimeZone('Asia/Tehran')))->format('Y/m/d — H:i');

$questions = [
    'وقتی برای اولین بار یک نقش را می‌خوانید، چه اتفاقی می‌افتد؟',
    'در بهترین لحظه بازیگری‌تان چه اتفاقی افتاد؟',
    'هنگام استرس روی صحنه، اولین کاری که می‌کنید چیست؟',
    'کدام نوع صحنه بیشتر جذبتان می‌کند؟',
    'هنگام تماشای فیلم، بیشتر به چه توجه می‌کنید؟',
    'دیگران شما را بیشتر چطور توصیف می‌کنند؟',
    'در تمرین، کدام روش را ترجیح می‌دهید؟',
    'با کدام جمله بیشتر موافقید؟',
    'وقتی با کارگردان اختلاف نظر دارید، چطور آن را بیان می‌کنید؟',
    'هدف اصلی‌تان از بازیگری چیست؟',
];

// ── ساخت گزارش HTML ──────────────────────────────
$qRows = '';
for ($i = 0; $i < 10; $i++) {
    $ans = htmlspecialchars(trim($_POST['q' . $i] ?? '—'));
    $q   = htmlspecialchars($questions[$i]);
    $num = $i + 1;
    $qRows .= "
    <tr>
      <td class=\"num\">{$num}</td>
      <td class=\"question\">{$q}</td>
      <td class=\"answer\">{$ans}</td>
    </tr>";
}

$html = <<<HTML
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8"/>
<title>گزارش تست بازیگری — {$name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Vazirmatn', Tahoma, sans-serif; background: #f5f5f5; color: #1a1a1a; direction: rtl; }
  .page { max-width: 860px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: #1a1a1a; padding: 36px 40px; display: flex; justify-content: space-between; align-items: center; }
  .header h1 { color: #fff; font-size: 1.4rem; font-weight: 900; }
  .header .logo { color: #D4AF37; font-size: 1rem; font-weight: 700; }
  .meta { background: #FFFBF0; border-bottom: 2px solid #F5E6B8; padding: 24px 40px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  .meta-item label { font-size: 0.72rem; font-weight: 700; color: #92400E; letter-spacing: 0.06em; display: block; margin-bottom: 4px; }
  .meta-item span { font-size: 1rem; font-weight: 700; color: #1a1a1a; }
  .actor-badge { background: #1a1a1a; color: #D4AF37; padding: 32px 40px; text-align: center; }
  .actor-badge .icon { font-size: 3rem; margin-bottom: 8px; display: block; }
  .actor-badge .label { font-size: 0.75rem; color: rgba(255,255,255,0.5); letter-spacing: 0.1em; margin-bottom: 6px; }
  .actor-badge .type { font-size: 1.6rem; font-weight: 900; color: #D4AF37; }
  .section { padding: 32px 40px; }
  .section h2 { font-size: 1rem; font-weight: 900; color: #1a1a1a; border-bottom: 2px solid #F5E6B8; padding-bottom: 10px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f9f9f9; font-size: 0.78rem; font-weight: 700; color: #666; padding: 10px 14px; text-align: right; border-bottom: 1.5px solid #eee; }
  td { padding: 13px 14px; border-bottom: 1px solid #f0f0f0; vertical-align: top; font-size: 0.88rem; line-height: 1.7; }
  td.num { font-weight: 900; color: #D4AF37; width: 36px; text-align: center; }
  td.question { color: #333; font-weight: 600; width: 45%; }
  td.answer { color: #1a1a1a; }
  tr:last-child td { border-bottom: none; }
  .footer { background: #f9f9f9; padding: 20px 40px; text-align: center; font-size: 0.78rem; color: #999; border-top: 1px solid #eee; }
  @media print {
    body { background: #fff; }
    .page { box-shadow: none; margin: 0; border-radius: 0; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>🎬 گزارش تست آنلاین بازیگری</h1>
    <div class="logo">خانواده برداشت</div>
  </div>

  <div class="meta">
    <div class="meta-item">
      <label>نام متقاضی</label>
      <span>{$name}</span>
    </div>
    <div class="meta-item">
      <label>شماره موبایل</label>
      <span>{$phone}</span>
    </div>
    <div class="meta-item">
      <label>تاریخ و ساعت</label>
      <span>{$now}</span>
    </div>
  </div>

  <div class="actor-badge">
    <span class="icon">🎭</span>
    <div class="label">تیپ بازیگری</div>
    <div class="type">{$actor_type}</div>
  </div>

  <div class="section">
    <h2>📋 پاسخ‌های فرم روان‌شناسی</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>سوال</th>
          <th>پاسخ انتخابی</th>
        </tr>
      </thead>
      <tbody>
        {$qRows}
      </tbody>
    </table>
  </div>

  <div class="footer">
    خانواده برداشت — اولین آموزشگاه رایگان بازیگری سینما در ایران | این گزارش به صورت خودکار تولید شده است
  </div>
</div>
</body>
</html>
HTML;

// ── ارسال به تلگرام ──────────────────────────────
function tg_request(string $method, array $data): array {
    $ch = curl_init('https://api.telegram.org/bot' . TG_BOT_TOKEN . '/' . $method);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $data,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true) ?: ['ok' => false];
}

// ۱. پیام خلاصه
$summary  = "🎬 *تست آنلاین بازیگری — خانواده برداشت*\n\n";
$summary .= "👤 *نام:* {$name}\n";
$summary .= "📞 *موبایل:* {$phone}\n";
$summary .= "🎭 *تیپ بازیگری:* {$actor_type}\n";
$summary .= "🕐 *تاریخ:* {$now}\n\n";
$summary .= "📄 گزارش کامل و ویدیو در پیام‌های بعدی ارسال می‌شود.";

$msgRes = tg_request('sendMessage', [
    'chat_id'    => TG_CHAT_ID,
    'text'       => $summary,
    'parse_mode' => 'Markdown',
]);

// ۲. گزارش HTML به عنوان فایل (قابل پرینت/ذخیره به PDF)
$safeName   = preg_replace('/[^a-zA-Z0-9\-_]/', '_', $name);
$reportPath = sys_get_temp_dir() . "/bardasht_report_{$safeName}_" . time() . '.html';
file_put_contents($reportPath, $html);

tg_request('sendDocument', [
    'chat_id'  => TG_CHAT_ID,
    'document' => new CURLFile($reportPath, 'text/html', "گزارش_تست_{$safeName}.html"),
    'caption'  => "📄 گزارش کامل تست روان‌شناسی بازیگری\n👤 {$name} — 🎭 {$actor_type}",
]);

@unlink($reportPath);

// ۳. ویدیو
$videoSent = false;
if (isset($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
    $videoRes = tg_request('sendVideo', [
        'chat_id' => TG_CHAT_ID,
        'video'   => new CURLFile($_FILES['video']['tmp_name'], $_FILES['video']['type'], $_FILES['video']['name']),
        'caption' => "🎥 ویدیوی تست بازیگری\n👤 {$name} | 📞 {$phone}\n🎭 {$actor_type}",
    ]);
    $videoSent = !empty($videoRes['ok']);
}

// ── پاسخ ─────────────────────────────────────────
if (!empty($msgRes['ok'])) {
    echo json_encode(['ok' => true, 'video' => $videoSent]);
} else {
    error_log('[Audition] Telegram error: ' . json_encode($msgRes));
    echo json_encode(['ok' => false, 'msg' => 'خطا در ارسال به تلگرام']);
}
