import type { RequestEvent } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";

export const GET = async ({ cookies }: RequestEvent) => {
  try {
    const token = cookies.get("auth_token");
    if (!token) return new Response("Unauthorized", { status: 401 });

    const payload = await verifyJwt(token);
    const userId = payload?.uid;
    if (!userId) return new Response("Invalid token", { status: 401 });

    // 1) Получаем все чаты пользователя (как было)
    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              include: { info: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // ✅ NEW: одним запросом подтянуть ивенты, привязанные к этим чатам
    const chatIds = chats.map((c) => c.id);
    const events = await prisma.event.findMany({
      where: { chatId: { in: chatIds } },
      select: { id: true, title: true, photo: true, date: true, chatId: true },
    });

    const eventByChatId = new Map<string, (typeof events)[number]>();
    for (const ev of events) {
      if (ev.chatId) eventByChatId.set(ev.chatId, ev);
    }

    // 2) Single query for all unread counts (replaces N+1 pattern)
    const unreadMessages = await prisma.message.findMany({
      where: {
        chatId: { in: chatIds },
        senderId: { not: userId },
        reads: { none: { userId } },
      },
      select: { chatId: true },
    });
    const unreadCountMap = new Map<string, number>();
    for (const m of unreadMessages) {
      unreadCountMap.set(m.chatId, (unreadCountMap.get(m.chatId) ?? 0) + 1);
    }

    // 3) Формируем ответ + добавляем event
    const formatted = chats.map((chat) => {
        const lastMessage = chat.messages[0] || null;
        const unreadCount = unreadCountMap.get(chat.id) ?? 0;

        const other = chat.participants.find((p) => p.userId !== userId)?.user;

        const ev = eventByChatId.get(chat.id);

        // ✅ NEW: event (или null)
        const event = ev
          ? { id: ev.id, title: ev.title, photo: ev.photo, date: ev.date }
          : null;

        if (!other) {
          return {
            id: chat.id,
            event, // ✅ NEW
            otherUser: null,
            lastMessage: lastMessage?.content || null,
            lastMessageCreatedAt: lastMessage?.createdAt || null,
            unreadCount,
          };
        }

        return {
          id: chat.id,
          event, // ✅ NEW

          otherUser: {
            id: other.id,
            email: other.email,
            info: other.info,
            lastOnline: other.lastOnline,
          },

          lastMessage: lastMessage
            ? lastMessage.type === "transfer"
              ? lastMessage.senderId === userId
                ? `Отправили ${lastMessage.content.replace(/.*перевод/i, "").trim()}`
                : `Получили ${lastMessage.content.replace(/.*перевод/i, "").trim()}`
              : lastMessage.content
            : null,

          lastMessageCreatedAt: lastMessage?.createdAt || null,
          unreadCount,
        };
      });

    formatted.sort((a, b) => {
      if (!a.lastMessageCreatedAt) return 1;
      if (!b.lastMessageCreatedAt) return -1;
      return (
        new Date(b.lastMessageCreatedAt).getTime() -
        new Date(a.lastMessageCreatedAt).getTime()
      );
    });

    return new Response(JSON.stringify({ chats: formatted }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Chat list error:", err);
    return new Response("Internal server error", { status: 500 });
  }
};
