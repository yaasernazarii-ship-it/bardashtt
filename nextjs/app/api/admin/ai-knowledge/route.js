import { prisma } from '@/lib/prisma';
import { getSessionUser, isManager } from '@/lib/auth';
import { logAction } from '@/lib/audit';
import { aiErrorMessage, chat, isAiConfigured } from '@/lib/ai';
import { extractKnowledgeText, chunkKnowledgeText, embedKnowledgeChunks } from '@/lib/aiKnowledge';

function managerName(user) {
  return user.displayName || user.username || user.phone || null;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });

  const items = await prisma.aiKnowledgeDocument.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return Response.json({
    ok: true,
    aiConfigured: isAiConfigured(),
    items: items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  });
}

export async function PUT() {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });
  if (!isAiConfigured()) return Response.json({ ok: false, error: 'کلید اتصال گپ‌جی‌پی‌تی تنظیم نشده است.' }, { status: 503 });

  try {
    await chat([{ role: 'user', content: 'فقط بنویس: آماده' }], { temperature: 0, maxTokens: 5 });
    return Response.json({ ok: true, message: 'اتصال گپ‌جی‌پی‌تی فعال است و دستیار آمادهٔ پاسخ‌گویی است.' });
  } catch (error) {
    return Response.json({ ok: false, error: aiErrorMessage(error) }, { status: 503 });
  }
}

export async function POST(request) {
  const user = await getSessionUser();
  if (!user) return Response.json({ ok: false, error: 'ابتدا وارد شوید.' }, { status: 401 });
  if (!isManager(user)) return Response.json({ ok: false, error: 'دسترسی ندارید.' }, { status: 403 });
  if (!isAiConfigured()) return Response.json({ ok: false, error: 'کلید اتصال گپ‌جی‌پی‌تی تنظیم نشده است.' }, { status: 503 });

  try {
    const form = await request.formData();
    const file = form.get('file');
    const pastedText = String(form.get('text') || '');
    const rawTitle = String(form.get('title') || '').trim();
    const fileName = file && typeof file.name === 'string' ? file.name.slice(0, 190) : null;
    const title = (rawTitle || fileName?.replace(/\.[^.]+$/, '') || '').slice(0, 190);
    if (title.length < 2) {
      return Response.json({ ok: false, error: 'عنوان منبع را وارد کنید.' }, { status: 400 });
    }

    const text = await extractKnowledgeText(file, pastedText);
    const chunks = chunkKnowledgeText(text);
    const vectors = await embedKnowledgeChunks(chunks);
    if (vectors.length !== chunks.length) throw new Error('knowledge_embedding_count');

    const item = await prisma.aiKnowledgeDocument.create({
      data: {
        title,
        fileName,
        mimeType: file && typeof file.type === 'string' ? file.type.slice(0, 100) : null,
        chunkCount: chunks.length,
        createdByName: managerName(user),
        chunks: {
          create: chunks.map((content, idx) => ({ content, idx, embedding: vectors[idx] })),
        },
      },
    });

    await logAction(user, {
      action: 'ai-knowledge.create',
      targetType: 'ai-knowledge',
      targetId: item.id,
      summary: `منبع «${title}» با ${chunks.length} بخش به هوش مصنوعی افزوده شد.`,
    });
    return Response.json({ ok: true, item: { ...item, createdAt: item.createdAt.toISOString() } });
  } catch (error) {
    const known = {
      knowledge_content_required: 'فایل یا متن جزوه را وارد کنید.',
      knowledge_file_too_large: 'حجم فایل نباید بیشتر از ۱۰ مگابایت باشد.',
      knowledge_file_type: 'فقط فایل PDF، TXT یا Markdown قابل بارگذاری است.',
      knowledge_text_too_short: 'متن استخراج‌شده برای ثبت در هوش مصنوعی کافی نیست.',
      knowledge_text_too_long: 'حجم متن این منبع بیش از حد مجاز است؛ آن را به چند منبع تقسیم کنید.',
    };
    const message = known[error?.message] || aiErrorMessage(error);
    const status = error?.name === 'AiServiceError' ? 503 : 400;
    return Response.json({ ok: false, error: message }, { status });
  }
}
