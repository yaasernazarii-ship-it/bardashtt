// تولید ماتریس QR بدون هیچ وابستگیِ بیرونی؛ فقط همان اندازه که برای گواهی لازم است:
// حالت «بایت»، سطح تصحیح خطای M و نسخه‌های ۱ تا ۶ (تا ۱۰۶ بایت داده).
// نشانیِ استعلام گواهی حدود ۴۶ بایت است، پس نسخه‌های بالاتر — که به «اطلاعات نسخه»
// هم نیاز دارند — عمداً پیاده نشده‌اند تا این فایل کوچک و قابل‌بازبینی بماند.
// خروجی یک آرایهٔ دوبعدی از ۰/۱ است که در PDF به‌صورت مربع‌های کوچک کشیده می‌شود.

// ── حساب در میدان گالوا GF(256) برای کدگذاری رید–سالومون ──────────
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // چندجمله‌ای اولیهٔ استاندارد QR
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const gfMul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function rsGenerator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    // ضرب در (x + α^i)؛ ضریب‌ها از بالاترین توان به پایین‌ترین چیده می‌شوند
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data, ecLen) {
  const gen = rsGenerator(ecLen);
  const res = new Uint8Array(ecLen);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.copyWithin(0, 1);
    res[ecLen - 1] = 0;
    for (let i = 0; i < ecLen; i++) res[i] ^= gfMul(gen[i + 1], factor);
  }
  return res;
}

// ── جدول‌های استاندارد برای سطح تصحیح خطای M ────────────────────
// [تعداد کدواژهٔ تصحیح خطا در هر بلوک، بلوک‌های گروه ۱، دادهٔ هر بلوک گروه ۱، بلوک‌های گروه ۲، دادهٔ هر بلوک گروه ۲]
const EC_M = {
  1: [10, 1, 16, 0, 0],
  2: [16, 1, 28, 0, 0],
  3: [26, 1, 44, 0, 0],
  4: [18, 2, 32, 0, 0],
  5: [24, 2, 43, 0, 0],
  6: [16, 4, 27, 0, 0],
};

const ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34] };

// بیت‌های باقی‌مانده پس از داده، طبق استاندارد
const REMAINDER = { 1: 0, 2: 7, 3: 7, 4: 7, 5: 7, 6: 7 };

const HEADER_BITS = 12; // ۴ بیت نشانگر حالت + ۸ بیت طول (برای نسخه‌های ۱ تا ۹)

const dataCapacity = (v) => {
  const [, b1, d1, b2, d2] = EC_M[v];
  return b1 * d1 + b2 * d2;
};

// ── ساخت جریان بیت داده ─────────────────────────────────────────
class Bits {
  constructor() { this.bits = []; }
  push(value, length) {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >> i) & 1);
  }
  get length() { return this.bits.length; }
}

function buildCodewords(bytes, version) {
  const capacity = dataCapacity(version) * 8;
  const bits = new Bits();
  bits.push(0b0100, 4); // حالت بایت
  bits.push(bytes.length, 8);
  for (const b of bytes) bits.push(b, 8);
  bits.push(0, Math.min(4, capacity - bits.length)); // پایان‌بخش
  while (bits.length % 8) bits.bits.push(0);

  const out = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits.bits[i + j];
    out.push(byte);
  }
  const pads = [0xec, 0x11];
  for (let i = 0; out.length < capacity / 8; i++) out.push(pads[i % 2]);
  return out;
}

// چیدنِ بلوک‌ها به‌صورت درهم‌بافته، همان‌طور که استاندارد می‌خواهد
function interleave(codewords, version) {
  const [ecLen, b1, d1, b2, d2] = EC_M[version];
  const blocks = [];
  let at = 0;
  for (let i = 0; i < b1; i++) { blocks.push(codewords.slice(at, at + d1)); at += d1; }
  for (let i = 0; i < b2; i++) { blocks.push(codewords.slice(at, at + d2)); at += d2; }
  const ecBlocks = blocks.map((b) => rsEncode(b, ecLen));

  const result = [];
  const maxData = Math.max(d1, d2);
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) if (i < b.length) result.push(b[i]);
  }
  for (let i = 0; i < ecLen; i++) {
    for (const b of ecBlocks) result.push(b[i]);
  }
  return result;
}

// ── ساخت ماتریس ────────────────────────────────────────────────
function newMatrix(size) {
  return Array.from({ length: size }, () => new Int8Array(size).fill(-1));
}

function placeFinder(m, row, col) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || cc < 0 || rr >= m.length || cc >= m.length) continue;
      const inner = r >= 0 && r <= 6 && c >= 0 && c <= 6;
      const dark = inner && (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
      m[rr][cc] = dark ? 1 : 0;
    }
  }
}

function placeFunctionPatterns(m, version) {
  const size = m.length;
  placeFinder(m, 0, 0);
  placeFinder(m, 0, size - 7);
  placeFinder(m, size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    const dark = i % 2 === 0 ? 1 : 0;
    m[6][i] = dark;
    m[i][6] = dark;
  }

  const centers = ALIGN[version];
  for (const r of centers) {
    for (const c of centers) {
      const nearFinder = (r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8);
      if (nearFinder) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const ring = Math.max(Math.abs(dr), Math.abs(dc));
          m[r + dr][c + dc] = ring === 1 ? 0 : 1;
        }
      }
    }
  }

  m[size - 8][8] = 1; // ماژول تیرهٔ ثابت

  // جای اطلاعات قالب رزرو می‌شود تا داده روی آن ننشیند
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === -1) m[8][i] = 0;
    if (m[i][8] === -1) m[i][8] = 0;
  }
  for (let i = 0; i < 8; i++) {
    if (m[8][size - 1 - i] === -1) m[8][size - 1 - i] = 0;
    if (m[size - 1 - i][8] === -1) m[size - 1 - i][8] = 0;
  }
}

function isFunction(version, size, row, col) {
  if (row === 6 || col === 6) return true;
  if (row < 9 && col < 9) return true;
  if (row < 9 && col >= size - 8) return true;
  if (row >= size - 8 && col < 9) return true;
  const centers = ALIGN[version];
  for (const r of centers) {
    for (const c of centers) {
      const nearFinder = (r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8);
      if (nearFinder) continue;
      if (Math.abs(row - r) <= 2 && Math.abs(col - c) <= 2) return true;
    }
  }
  return false;
}

function placeData(m, version, codewords, remainderBits) {
  const size = m.length;
  const bits = [];
  for (const b of codewords) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  for (let i = 0; i < remainderBits; i++) bits.push(0);

  let idx = 0;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // ستون زمان‌بندی نادیده گرفته می‌شود
    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step;
      for (const col of [right, right - 1]) {
        if (isFunction(version, size, row, col)) continue;
        m[row][col] = idx < bits.length ? bits[idx] : 0;
        idx++;
      }
    }
    upward = !upward;
  }
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function penalty(m) {
  const size = m.length;
  let score = 0;

  const runScore = (line) => {
    let total = 0;
    let run = 1;
    for (let i = 1; i < line.length; i++) {
      if (line[i] === line[i - 1]) {
        run++;
      } else {
        if (run >= 5) total += 3 + (run - 5);
        run = 1;
      }
    }
    if (run >= 5) total += 3 + (run - 5);
    return total;
  };

  for (let r = 0; r < size; r++) score += runScore(m[r]);
  for (let c = 0; c < size; c++) score += runScore(m.map((row) => row[c]));

  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
    }
  }

  const pattern = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const reversed = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const hasAt = (line, start, pat) => pat.every((v, i) => line[start + i] === v);
  const scanLine = (line) => {
    let total = 0;
    for (let i = 0; i + 11 <= line.length; i++) {
      if (hasAt(line, i, pattern) || hasAt(line, i, reversed)) total += 40;
    }
    return total;
  };
  for (let r = 0; r < size; r++) score += scanLine(m[r]);
  for (let c = 0; c < size; c++) score += scanLine(m.map((row) => row[c]));

  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) dark += m[r][c];
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;
  return score;
}

function formatBits(mask) {
  const data = (0b00 << 3) | mask; // سطح M
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem >> i) & 1) rem ^= 0b10100110111 << (i - 10);
  }
  return ((data << 10) | rem) ^ 0b101010000010010;
}

// اطلاعات قالب ۱۵ بیتی است و از پرارزش‌ترین بیت (f14) چیده می‌شود؛ دو نسخه از آن
// روی کد نوشته می‌شود تا با آسیب‌دیدنِ یک گوشه هم خوانده شود.
function placeFormat(m, mask) {
  const size = m.length;
  const bits = formatBits(mask);
  const f = (i) => (bits >> i) & 1; // f(14) پرارزش‌ترین

  // نسخهٔ اول: کنار نشانگر بالا-چپ
  for (let j = 0; j <= 5; j++) m[8][j] = f(14 - j);
  m[8][7] = f(8);
  m[8][8] = f(7);
  m[7][8] = f(6);
  for (let j = 9; j <= 14; j++) m[14 - j][8] = f(14 - j);

  // نسخهٔ دوم: ستون پایین-چپ و سطر بالا-راست
  for (let j = 0; j <= 6; j++) m[size - 1 - j][8] = f(14 - j);
  for (let j = 0; j <= 7; j++) m[8][size - 8 + j] = f(7 - j);

  m[size - 8][8] = 1; // ماژول تیرهٔ ثابت
}

/**
 * ماتریس QR متن داده‌شده را می‌سازد.
 * @param {string} text متن یا نشانیِ کوتاه
 * @returns {number[][]} ماتریس ۰/۱
 */
export function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(String(text ?? '')));
  const needBits = HEADER_BITS + bytes.length * 8;
  const version = Object.keys(EC_M)
    .map(Number)
    .find((v) => dataCapacity(v) * 8 >= needBits);
  if (!version) throw new Error('qr_payload_too_long');

  const codewords = interleave(buildCodewords(bytes, version), version);
  const size = 17 + 4 * version;

  const base = newMatrix(size);
  placeFunctionPatterns(base, version);
  placeData(base, version, codewords, REMAINDER[version]);

  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const candidate = base.map((row) => Int8Array.from(row));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (isFunction(version, size, r, c)) continue;
        if (MASKS[mask](r, c)) candidate[r][c] ^= 1;
      }
    }
    placeFormat(candidate, mask);
    const score = penalty(candidate);
    if (!best || score < best.score) best = { score, matrix: candidate };
  }

  return best.matrix.map((row) => Array.from(row));
}
