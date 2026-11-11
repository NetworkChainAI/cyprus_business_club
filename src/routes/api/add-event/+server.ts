import type { RequestHandler } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";
import { awardSocialCapital, recalcTrustScore } from "$lib/reputation";
import { createNotification } from "$lib/services/notifications";

import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import type { Prisma } from "@prisma/client";
import { validateFile, sanitizeFileName } from "$lib/server/security";

type AgendaItem = {
  index: number;
  start: string;
  end?: string;
  title: string;
  description?: string;
};

function isValidTimeHHMM(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizeAgenda(raw: unknown): AgendaItem[] {
  if (!Array.isArray(raw)) throw new Error("agenda must be an array");

  const items: AgendaItem[] = raw.map((x, i) => {
    if (typeof x !== "object" || x === null) throw new Error(`agenda[${i}] invalid`);

    const obj = x as Record<string, unknown>;

    const index =
      typeof obj.index === "number" && Number.isFinite(obj.index) ? obj.index : i + 1;

    const start = String(obj.start ?? "").trim();
    const endRaw = obj.end == null ? "" : String(obj.end).trim();
    const end = endRaw ? endRaw : undefined;

    const title = String(obj.title ?? "").trim();
    const descriptionRaw = obj.description == null ? "" : String(obj.description).trim();
    const description = descriptionRaw ? descriptionRaw : undefined;

    if (!isValidTimeHHMM(start)) throw new Error(`agenda[${i}].start invalid`);
    if (end && !isValidTimeHHMM(end)) throw new Error(`agenda[${i}].end invalid`);
    if (!title) throw new Error(`agenda[${i}].title invalid`);

    return { index, start, end, title, description };
  });

  items.sort((a, b) => a.index - b.index);
  return items.map((it, idx) => ({ ...it, index: idx + 1 }));
}

function safeFloat(value: FormDataEntryValue | null): number | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s) return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = cookies.get("auth_token");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const payload = await verifyJwt(token);
  if (!payload || !payload.uid) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
  }

  try {
    const formData = await request.formData();

    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const dateStr = String(formData.get("date") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();

    const price = safeFloat(formData.get("price"));
    const latitude = safeFloat(formData.get("latitude"));
    const longitude = safeFloat(formData.get("longitude"));

    const categories = formData.getAll("categories").map(String).filter(Boolean);

    const communityId = String(formData.get("communityId") ?? "").trim() || null;
    const brandId = String(formData.get("brandId") ?? "").trim() || null;

    let agendaJson: Prisma.InputJsonValue | undefined = undefined;
    const agendaRaw = formData.get("agenda");
    if (agendaRaw != null && String(agendaRaw).trim()) {
      try {
        const parsed = JSON.parse(String(agendaRaw));
        const normalized = normalizeAgenda(parsed);
        agendaJson = normalized as unknown as Prisma.InputJsonValue;
      } catch {
        return new Response(JSON.stringify({ error: "Invalid agenda JSON" }), { status: 400 });
      }
    }

    if (!title || !description || !dateStr || !location || categories.length === 0) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    const eventDate = new Date(dateStr);
    if (Number.isNaN(eventDate.getTime())) {
      return new Response(JSON.stringify({ error: "Invalid date" }), { status: 400 });
    }

    // Validate ownership of community/brand
    if (communityId) {
      const community = await prisma.community.findFirst({
        where: { id: communityId, owners: { some: { id: payload.uid } } },
        select: { id: true },
      });
      if (!community) {
        return new Response(JSON.stringify({ error: "You are not an owner of this community" }), { status: 403 });
      }
    }

    if (brandId) {
      const brand = await prisma.brand.findFirst({
        where: { id: brandId, ownerId: payload.uid, status: "ACTIVE" },
        select: { id: true },
      });
      if (!brand) {
        return new Response(JSON.stringify({ error: "You are not an owner of this brand" }), { status: 403 });
      }
    }

    // Parse sponsors & speakers JSON
    let sponsorsData: Array<{ brandId?: string; name?: string; logoUrl?: string; hasLogo?: boolean }> = [];
    let speakersData: Array<{ userId?: string; name?: string; email?: string; photoUrl?: string; title?: string; hasPhoto?: boolean }> = [];

    const sponsorsRaw = formData.get("sponsors");
    if (sponsorsRaw && String(sponsorsRaw).trim()) {
      try {
        sponsorsData = JSON.parse(String(sponsorsRaw));
      } catch {
        return new Response(JSON.stringify({ error: "Invalid sponsors JSON" }), { status: 400 });
      }
    }

    const speakersRaw = formData.get("speakers");
    if (speakersRaw && String(speakersRaw).trim()) {
      try {
        speakersData = JSON.parse(String(speakersRaw));
      } catch {
        return new Response(JSON.stringify({ error: "Invalid speakers JSON" }), { status: 400 });
      }
    }

    // Process sponsor logo files
    for (let i = 0; i < sponsorsData.length; i++) {
      const logoFile = formData.get(`sponsor_logo_${i}`) as File | null;
      if (logoFile && logoFile.size > 0) {
        const fileErr = validateFile(logoFile, "image");
        if (fileErr) return new Response(JSON.stringify({ error: `Sponsor logo: ${fileErr}` }), { status: 400 });
        const bytes = Buffer.from(await logoFile.arrayBuffer());
        const safeName = sanitizeFileName(logoFile.name);
        const fileName = `${randomUUID()}-${safeName}`;
        const uploadDir = path.join(process.cwd(), "static", "uploads", "brands");
        fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, fileName), bytes);
        sponsorsData[i].logoUrl = `/uploads/brands/${fileName}`;
      }
    }

    // Process speaker photo files
    for (let i = 0; i < speakersData.length; i++) {
      const photoFile = formData.get(`speaker_photo_${i}`) as File | null;
      if (photoFile && photoFile.size > 0) {
        const fileErr = validateFile(photoFile, "image");
        if (fileErr) return new Response(JSON.stringify({ error: `Speaker photo: ${fileErr}` }), { status: 400 });
        const bytes = Buffer.from(await photoFile.arrayBuffer());
        const safeName = sanitizeFileName(photoFile.name);
        const fileName = `${randomUUID()}-${safeName}`;
        const uploadDir = path.join(process.cwd(), "static", "uploads", "events");
        fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, fileName), bytes);
        speakersData[i].photoUrl = `/uploads/events/${fileName}`;
      }
    }

    const photoFile = formData.get("photo") as File | null;
    const documentFile = formData.get("document") as File | null;

    let photoPath: string | null = null;
    let documentPath: string | null = null;

    if (photoFile && photoFile.size > 0) {
      const fileErr = validateFile(photoFile, "image");
      if (fileErr) return new Response(JSON.stringify({ error: `Event photo: ${fileErr}` }), { status: 400 });
      const bytes = Buffer.from(await photoFile.arrayBuffer());
      const safeName = sanitizeFileName(photoFile.name);
      const fileName = `${randomUUID()}-${safeName}`;
      const uploadDir = path.join(process.cwd(), "static", "uploads", "events");
      fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, fileName), bytes);
      photoPath = `/uploads/events/${fileName}`;
    }

    if (documentFile && documentFile.size > 0) {
      const fileErr = validateFile(documentFile, "document");
      if (fileErr) return new Response(JSON.stringify({ error: `Document: ${fileErr}` }), { status: 400 });
      const bytes = Buffer.from(await documentFile.arrayBuffer());
      const safeName = sanitizeFileName(documentFile.name);
      const fileName = `${randomUUID()}-${safeName}`;
      const uploadDir = path.join(process.cwd(), "static", "uploads", "docs");
      fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, fileName), bytes);
      documentPath = `/uploads/docs/${fileName}`;
    }

    // ✅ Создаём чат + ивент + добавляем организатора в чат в одной транзакции
    const result = await prisma.$transaction(async (tx) => {
      const chat = await tx.chat.create({
        data: {}
      });

      const event = await tx.event.create({
        data: {
          title,
          description,
          date: eventDate,
          location,
          price,
          photo: photoPath,
          documentPath,
          organizerId: payload.uid,
          latitude,
          longitude,
          communityId,
          brandId,

          chatId: chat.id,

          ...(agendaJson !== undefined ? { agenda: agendaJson } : {}),

          categories: {
            connect: categories.map((id) => ({ id }))
          }
        },
        include: { categories: true }
      });

      // ✅ организатор сразу участник чата (admin)
      await tx.chatParticipant.create({
        data: {
          chatId: chat.id,
          userId: payload.uid,
          role: "admin"
        }
      });

      // Create sponsors
      if (sponsorsData.length > 0) {
        await tx.eventSponsor.createMany({
          data: sponsorsData.map((s, i) => ({
            eventId: event.id,
            brandId: s.brandId || null,
            name: s.brandId ? null : (s.name || null),
            logoUrl: s.brandId ? null : (s.logoUrl || null),
            order: i
          }))
        });
      }

      // Create speakers
      if (speakersData.length > 0) {
        await tx.eventSpeaker.createMany({
          data: speakersData.map((s, i) => ({
            eventId: event.id,
            userId: s.userId || null,
            name: s.userId ? null : (s.name || null),
            email: s.userId ? null : (s.email || null),
            photoUrl: s.userId ? null : (s.photoUrl || null),
            title: s.title || null,
            order: i
          }))
        });
      }

      return { chat, event };
    });

    // Notify creator
    createNotification({
      userId: payload.uid,
      emoji: "🎉",
      textKey: `Your event "${result.event.title}" has been created successfully!`,
      link: `/events/${result.event.id}`,
      type: "event_created",
    }).catch(console.error);

    // Reputation: event created (+30 SC)
    awardSocialCapital(payload.uid, "EVENT_CREATED", {
      refId: result.event.id,
      refType: "EVENT",
    }).catch(console.error);

    // Trust: recalc for speakers who are platform users (speaker = +15 trust)
    const speakerUserIds = speakersData
      .map((s) => s.userId)
      .filter((id): id is string => !!id);
    for (const uid of speakerUserIds) {
      recalcTrustScore(uid).catch(console.error);
    }

    return new Response(
      JSON.stringify({ success: true, event: result.event, chatId: result.chat.id }),
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating event:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
