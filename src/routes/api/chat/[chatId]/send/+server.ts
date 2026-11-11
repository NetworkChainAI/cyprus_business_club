import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { validateFile, sanitizeFileName, checkRateLimit, getClientIp } from '$lib/server/security';

export const POST = async ({ params, request, cookies }: RequestEvent) => {
  try {
    const chatId = params.chatId;
    if (!chatId) return new Response('Missing chatId', { status: 400 });

    const token = cookies.get('auth_token');
    if (!token) return new Response('Unauthorized', { status: 401 });

    const payload = await verifyJwt(token);
    const senderId = payload?.uid;
    if (!senderId) return new Response('Invalid token', { status: 401 });

    // Rate limit: 30 messages per minute per user
    const rl = checkRateLimit("chat_send", senderId, 30, 60_000);
    if (rl) return rl;

    // Verify user is a participant of this chat
    const participant = await prisma.chatParticipant.findUnique({
      where: { userId_chatId: { userId: senderId, chatId } },
    });
    if (!participant) return new Response('Forbidden: not a chat participant', { status: 403 });

    // ---- multipart/form-data ----
    const form = await request.formData();

    let content = form.get("content")?.toString() || "";
    const file = form.get("file") as File | null;

    // ---- Сохранение файла ----
    if (file && file.size > 0) {
      // Validate file type and size
      const fileError = validateFile(file, "chat");
      if (fileError) return new Response(JSON.stringify({ error: fileError }), { status: 400 });

      const bytes = Buffer.from(await file.arrayBuffer());
      const uploadDir = "static/uploads";
      await mkdir(uploadDir, { recursive: true });
      const safeName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}_${safeName}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, bytes);

      // ВАЖНО: content теперь = URL файла
      content = `/uploads/${fileName}`;
    }

    if (!content.trim()) {
      return new Response("Empty content", { status: 400 });
    }

    await prisma.message.create({
      data: {
        chatId,
        senderId,
        content
      }
    });

    return new Response(JSON.stringify({ ok: true }));

  } catch (err) {
    console.error("Message send error:", err);
    return new Response("Internal server error", { status: 500 });
  }
};
