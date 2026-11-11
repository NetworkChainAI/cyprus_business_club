import type { RequestEvent } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";

export const GET = async ({ params, url, cookies }: RequestEvent) => {
  try {
    const chatId = params.chatId;

    const token = cookies.get("auth_token");
    if (!token) return new Response("Unauthorized", { status: 401 });

    const payload = await verifyJwt(token);
    const userId = payload?.uid;
    if (!userId) return new Response("Invalid token", { status: 401 });

    // Verify user is a participant of this chat
    const participant = await prisma.chatParticipant.findUnique({
      where: { userId_chatId: { userId, chatId: chatId! } },
    });
    if (!participant) return new Response("Forbidden: not a chat participant", { status: 403 });

    const after = url.searchParams.get("after");

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        createdAt: after ? { gt: new Date(after) } : undefined,
      },
      orderBy: { createdAt: "asc" },

      // ✅ добавили sender (минимальный select)
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            info: {
              select: {
                name: true,
                photo: true
              }
            }
          }
        }
      },
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      type: m.type,
      isMine: m.senderId === userId,

      // ✅ данные отправителя для аватарки
      sender: m.sender
        ? {
            id: m.sender.id,
            email: m.sender.email,
            info: {
              name: m.sender.info?.name ?? null,
              photo: m.sender.info?.photo ?? null
            }
          }
        : null
    }));

    return new Response(JSON.stringify({ messages: formatted }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Chat messages error:", err);
    return new Response("Internal server error", { status: 500 });
  }
};
