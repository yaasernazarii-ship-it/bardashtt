import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { embed } from './ai';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 500_000;
const CHUNK_SIZE = 1_600;
const CHUNK_OVERLAP = 220;
const MAX_CHUNKS = 320;
const EMBED_BATCH_SIZE = 32;

const TEXT_TYPES = new Set(['text/plain', 'text/markdown', 'text/x-markdown']);

function normalizeText(value) {
  return String(value || '')
    .replace(/\0/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function extractKnowledgeText(file, pastedText = '') {
  const directText = normalizeText(pastedText);
  if (directText) return directText.slice(0, MAX_TEXT_LENGTH);
  if (!file || file.size === 0) throw new Error('knowledge_content_required');
  if (file.size > MAX_FILE_BYTES) throw new Error('knowledge_file_too_large');

  const fileName = String(file.name || '').toLowerCase();
  const bytes = Buffer.from(await file.arrayBuffer());
  let text = '';

  if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
    const parsed = await pdfParse(bytes);
    text = parsed.text;
  } else if (TEXT_TYPES.has(file.type) || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    text = bytes.toString('utf8');
  } else {
    throw new Error('knowledge_file_type');
  }

  return normalizeText(text).slice(0, MAX_TEXT_LENGTH);
}

export function chunkKnowledgeText(text) {
  const clean = normalizeText(text);
  if (clean.length < 30) throw new Error('knowledge_text_too_short');

  const chunks = [];
  let start = 0;
  while (start < clean.length && chunks.length < MAX_CHUNKS) {
    let end = Math.min(start + CHUNK_SIZE, clean.length);
    if (end < clean.length) {
      const paragraphBreak = clean.lastIndexOf('\n\n', end);
      const sentenceBreak = Math.max(clean.lastIndexOf('. ', end), clean.lastIndexOf('؟ ', end));
      const preferred = Math.max(paragraphBreak, sentenceBreak);
      if (preferred > start + Math.floor(CHUNK_SIZE * 0.55)) end = preferred + 1;
    }

    const chunk = clean.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= clean.length) {
      start = clean.length;
      break;
    }
    start = Math.max(start + 1, end - CHUNK_OVERLAP);
  }

  if (start < clean.length) throw new Error('knowledge_text_too_long');
  return chunks;
}

export async function embedKnowledgeChunks(chunks) {
  const vectors = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    vectors.push(...await embed(chunks.slice(i, i + EMBED_BATCH_SIZE)));
  }
  return vectors;
}
