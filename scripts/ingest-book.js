/* eslint-disable */
// اسکریپت بارگذاری کتاب: متن را می‌خواند، تکه می‌کند، embedding می‌سازد و در دیتابیس ذخیره می‌کند.
// اجرا روی سرور:  node scripts/ingest-book.js /path/to/book.txt
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// بارگذاری ساده‌ی .env
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
loadEnv();

const BASE_URL = (process.env.AI_BASE_URL || 'https://api.gapgpt.app/v1').replace(/\/$/, '');
const EMBED_MODEL = process.env.AI_EMBED_MODEL || 'text-embedding-3-small';

function clean(text) {
  return text
    .replace(/[\u202A-\u202E\u2066-\u2069\u200E\u200F]/g, '') // حذف نویسه‌های جهت‌دهی
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function chunkText(text, size = 900, overlap = 150) {
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let buf = '';
  for (const p of paras) {
    if ((buf + '\n\n' + p).length > size && buf) {
      chunks.push(buf.trim());
      buf = buf.slice(Math.max(0, buf.length - overlap)) + '\n\n' + p;
    } else {
      buf = buf ? buf + '\n\n' + p : p;
    }
    while (buf.length > size * 1.6) {
      chunks.push(buf.slice(0, size).trim());
      buf = buf.slice(size - overlap);
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.filter((c) => c.length > 40);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function embedBatch(inputs, attempt = 1) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000); // fail fast, then retry
  try {
    const res = await fetch(`${BASE_URL}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.AI_API_KEY}` },
      body: JSON.stringify({ model: EMBED_MODEL, input: inputs }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`embed ${res.status}: ${(await res.text()).slice(0, 160)}`);
    const data = await res.json();
    return data.data.map((d) => d.embedding);
  } catch (e) {
    if (attempt >= 8) throw e;
    await sleep(1500 * attempt);
    return embedBatch(inputs, attempt + 1);
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error('usage: node scripts/ingest-book.js <textfile>');
  if (!process.env.AI_API_KEY) throw new Error('AI_API_KEY missing in .env');

  const raw = fs.readFileSync(file, 'utf8');
  const chunks = chunkText(clean(raw));
  console.log(`chunks: ${chunks.length}`);

  const prisma = new PrismaClient();
  await prisma.bookChunk.deleteMany({});

  const BATCH = 16;
  let idx = 0;
  for (let i = 0; i < chunks.length; i += BATCH) {
    const slice = chunks.slice(i, i + BATCH);
    const vectors = await embedBatch(slice);
    await prisma.bookChunk.createMany({
      data: slice.map((content, j) => ({ idx: idx + j, content, embedding: vectors[j] })),
    });
    idx += slice.length;
    console.log(`embedded ${idx}/${chunks.length}`);
  }

  const total = await prisma.bookChunk.count();
  console.log(`DONE. stored ${total} chunks.`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error('INGEST_ERROR', e.message); process.exit(1); });
