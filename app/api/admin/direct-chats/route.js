import { requireManager } from '@/lib/chatGroups';
import { directChatRows } from '@/lib/directChats';

export async function GET() {
  const { error } = await requireManager();
  if (error) return error;
  const chats = await directChatRows({});
  return Response.json({ ok: true, chats });
}
