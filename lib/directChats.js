import { prisma } from '@/lib/prisma';
import { notifyUsers } from '@/lib/notifications';
import { displayNameOf } from '@/lib/staffReports';

export const DIRECT_LIMITS = { message: 2000, page: 80 };

export function pairOf(firstId, secondId) {
  return firstId < secondId ? [firstId, secondId] : [secondId, firstId];
}

export async function canChatDirectly(firstId, secondId) {
  if (!firstId || !secondId || firstId === secondId) return false;
  const membership = await prisma.chatGroupMember.findFirst({
    where: {
      userId: firstId,
      group: { active: true, members: { some: { userId: secondId } } },
    },
    select: { id: true },
  });
  return !!membership;
}

export async function eligibleDirectContacts(userId) {
  const memberships = await prisma.chatGroupMember.findMany({
    where: { userId, group: { active: true } },
    select: {
      group: {
        select: {
          name: true,
          members: { where: { userId: { not: userId } }, select: { userId: true } },
        },
      },
    },
  });

  const groupsByUser = new Map();
  for (const membership of memberships) {
    for (const member of membership.group.members) {
      const names = groupsByUser.get(member.userId) || [];
      if (!names.includes(membership.group.name)) names.push(membership.group.name);
      groupsByUser.set(member.userId, names);
    }
  }

  const ids = [...groupsByUser.keys()];
  if (ids.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { id: { in: ids }, role: 'student', active: true },
    select: { id: true, displayName: true, username: true, photoUrl: true, courseTitle: true, classGroup: { select: { name: true } } },
    orderBy: [{ displayName: 'asc' }, { username: 'asc' }],
  });
  return users.map((user) => ({
    id: user.id,
    name: displayNameOf(user),
    photoUrl: user.photoUrl || null,
    subtitle: [user.courseTitle, user.classGroup?.name].filter(Boolean).join(' · ') || 'هنرجو',
    sharedGroups: groupsByUser.get(user.id) || [],
  }));
}

export async function getOrCreateDirectChat(firstId, secondId) {
  const [userAId, userBId] = pairOf(firstId, secondId);
  return prisma.directChat.upsert({
    where: { userAId_userBId: { userAId, userBId } },
    update: {},
    create: { userAId, userBId },
  });
}

export async function openDirectChat(chatId, viewerId) {
  const chat = await prisma.directChat.findUnique({ where: { id: chatId } });
  if (!chat || (chat.userAId !== viewerId && chat.userBId !== viewerId)) return null;
  return chat;
}

export async function directMessages(chatId, after = null) {
  if (after) {
    return prisma.directChatMessage.findMany({
      where: { chatId, createdAt: { gt: after } },
      orderBy: { createdAt: 'asc' },
      take: DIRECT_LIMITS.page,
    });
  }
  const rows = await prisma.directChatMessage.findMany({
    where: { chatId },
    orderBy: { createdAt: 'desc' },
    take: DIRECT_LIMITS.page,
  });
  return rows.reverse();
}

export function serializeDirectMessage(message, viewerId, canModerate = false) {
  return {
    id: message.id,
    body: message.body,
    authorId: message.authorId,
    authorName: message.authorName,
    createdAt: message.createdAt.toISOString(),
    mine: message.authorId === viewerId,
    canDelete: canModerate || message.authorId === viewerId,
  };
}

export async function markDirectRead(userId, chatId) {
  await prisma.directChatRead.upsert({
    where: { chatId_userId: { chatId, userId } },
    update: { lastReadAt: new Date() },
    create: { chatId, userId },
  });
}

export async function postDirectMessage(chat, sender, text) {
  const recipientId = chat.userAId === sender.id ? chat.userBId : chat.userAId;
  const message = await prisma.directChatMessage.create({
    data: { chatId: chat.id, authorId: sender.id, authorName: displayNameOf(sender), body: text },
  });
  await Promise.all([
    prisma.directChat.update({ where: { id: chat.id }, data: { lastMessageAt: message.createdAt } }),
    markDirectRead(sender.id, chat.id),
    notifyUsers([recipientId], {
      title: `پیام خصوصی تازه از ${displayNameOf(sender)}`,
      body: text.slice(0, 90),
      href: `/dashboard/groups?d=${chat.id}`,
      kind: 'system',
    }),
  ]);
  return message;
}

export async function directChatRows(where, viewerId = null) {
  const chats = await prisma.directChat.findMany({ where, orderBy: { lastMessageAt: 'desc' } });
  const userIds = [...new Set(chats.flatMap((chat) => [chat.userAId, chat.userBId]))];
  const users = userIds.length ? await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, displayName: true, username: true, photoUrl: true },
  }) : [];
  const userMap = new Map(users.map((user) => [user.id, user]));

  return Promise.all(chats.map(async (chat) => {
    const [last, read] = await Promise.all([
      prisma.directChatMessage.findFirst({ where: { chatId: chat.id }, orderBy: { createdAt: 'desc' } }),
      viewerId ? prisma.directChatRead.findUnique({ where: { chatId_userId: { chatId: chat.id, userId: viewerId } } }) : null,
    ]);
    const unread = viewerId ? await prisma.directChatMessage.count({
      where: { chatId: chat.id, authorId: { not: viewerId }, createdAt: { gt: read?.lastReadAt || new Date(0) } },
    }) : 0;
    const first = userMap.get(chat.userAId);
    const second = userMap.get(chat.userBId);
    const other = viewerId === chat.userAId ? second : first;
    return {
      id: chat.id,
      first: { id: chat.userAId, name: first ? displayNameOf(first) : 'کاربر حذف‌شده', photoUrl: first?.photoUrl || null },
      second: { id: chat.userBId, name: second ? displayNameOf(second) : 'کاربر حذف‌شده', photoUrl: second?.photoUrl || null },
      other: other ? { id: other.id, name: displayNameOf(other), photoUrl: other.photoUrl || null } : null,
      unread,
      lastMessageAt: chat.lastMessageAt.toISOString(),
      preview: last ? { body: last.body.slice(0, 90), authorName: last.authorName, createdAt: last.createdAt.toISOString() } : null,
    };
  }));
}
