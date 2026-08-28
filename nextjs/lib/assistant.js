import { prisma } from './prisma';
import { embedOne, chat, cosineSim, isAiConfigured } from './ai';

export { isAiConfigured };

export async function isBookReady() {
  const count = await prisma.bookChunk.count();
  return count > 0;
}

export async function isAssistantReady() {
  const [bookCount, knowledgeCount] = await Promise.all([
    prisma.bookChunk.count(),
    prisma.aiKnowledgeChunk.count(),
  ]);
  return bookCount + knowledgeCount > 0;
}

const SYSTEM_PROMPT = `تو دستیار هوشمند کتاب «متد پنج سؤال طلایی» نوشته‌ی یاسر نظری هستی.
فقط و فقط بر اساس بخش‌هایی از کتاب که در ادامه به تو داده می‌شود پاسخ بده.
اگر پاسخ پرسش در متن داده‌شده نبود، صادقانه بگو که این موضوع در بخش‌های در دسترس از کتاب یافت نشد و چیزی از خودت نساز.
پاسخ را به فارسی روان، دقیق و کوتاه بده.`;

export async function answerFromBook(question, { topK = 6 } = {}) {
  const qVec = await embedOne(question);
  const chunks = await prisma.bookChunk.findMany({ select: { content: true, embedding: true } });

  const scored = chunks
    .map((c) => ({ content: c.content, score: cosineSim(qVec, c.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const context = scored.map((s, i) => `[بخش ${i + 1}]\n${s.content}`).join('\n\n');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `بخش‌هایی از کتاب:\n\n${context}\n\n---\nپرسش: ${question}` },
  ];

  return chat(messages);
}

const KNOWLEDGE_PROMPT = `تو دستیار هوشمند مجموعه آموزشی برداشت هستی.
فقط بر اساس منابعی که در ادامه به تو داده می‌شود پاسخ بده. این منابع شامل کتاب «متد پنج سؤال طلایی» و مطالب یا جزوه‌های تأییدشدهٔ مدیریت هستند.
اگر پاسخ در منابع داده‌شده نبود، صادقانه بگو که در منابع در دسترس یافت نشد و چیزی از خودت نساز.
اگر بین منابع تعارضی بود، موضوع را شفاف بیان کن. پاسخ را به فارسی روان، دقیق و کوتاه بده.`;

export async function answerFromSources(question, { topK = 8 } = {}) {
  const qVec = await embedOne(question);
  const [bookChunks, knowledgeChunks] = await Promise.all([
    prisma.bookChunk.findMany({ select: { content: true, embedding: true } }),
    prisma.aiKnowledgeChunk.findMany({
      select: { content: true, embedding: true, document: { select: { title: true } } },
    }),
  ]);

  const candidates = [
    ...bookChunks.map((item) => ({ ...item, source: 'کتاب متد پنج سؤال طلایی' })),
    ...knowledgeChunks.map((item) => ({ ...item, source: item.document.title })),
  ];
  const scored = candidates
    .map((item) => ({ ...item, score: cosineSim(qVec, item.embedding) }))
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const context = scored
    .map((item, index) => `[منبع ${index + 1}: ${item.source}]\n${item.content}`)
    .join('\n\n');
  const messages = [
    { role: 'system', content: KNOWLEDGE_PROMPT },
    { role: 'user', content: `منابع مرتبط:\n\n${context}\n\n---\nپرسش: ${question}` },
  ];

  return chat(messages);
}
