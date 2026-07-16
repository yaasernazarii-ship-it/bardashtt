import { prisma } from './prisma';
import { embedOne, chat, cosineSim, isAiConfigured } from './ai';

export { isAiConfigured };

export async function isBookReady() {
  const count = await prisma.bookChunk.count();
  return count > 0;
}

const SYSTEM_PROMPT = `تو دستیار هوشمند کتاب «متد پنج سوال طلایی» نوشته‌ی یاسر نظری هستی.
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
