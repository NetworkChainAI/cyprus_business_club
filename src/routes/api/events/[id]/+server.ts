import type { RequestHandler } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";
import { recalcTrustScore } from "$lib/reputation";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import type { Prisma } from "@prisma/client";

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
    const end = endRaw || undefined;
    const title = String(obj.title ?? "").trim();
    const descriptionRaw = obj.description == null ? "" : String(obj.description).trim();
    const description = descriptionRaw || undefined;

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

export const PATCH: RequestHandler = async ({ request, cookies, params }) => {
  const token = cookies.get("auth_token");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const payload = await verifyJwt(token);
  if (!payload?.uid) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
  }

  const eventId = params.id;
  if (!eventId) {
    return new Response(JSON.stringify({ error: "Missing event ID" }), { status: 400 });
  }

  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    select: { organizerId: true, photo: true, documentPath: true },
  });

  if (!existing) {
    return new Response(JSON.stringify({ error: "Event not found" }), { status: 404 });
  }

  if (existing.organizerId !== payload.uid) {
    return new Response(JSON.stringify({ error: "Not authorized to edit this event" }), { status: 403 });
  }

  try {
    const formData = await request.formData();

    // Check if this is a simple isActive toggle
    const isActiveField = formData.get("isActive");
    if (isActiveField !== null && formData.keys().next().value === "isActive") {
      const keys = [...formData.keys()];
      if (keys.length === 1) {
        const isActive = isActiveField === "true";
        const updated = await prisma.event.update({
          where: { id: eventId },
          data: { isActive },
          select: { id: true, isActive: true },
        });
        return new Response(JSON.stringify({ success: true, event: updated }));
      }
    }

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
        return new Response(JSON.stringify({ error: "Not an owner of this community" }), { status: 403 });
      }
    }

    if (brandId) {
      const brand = await prisma.brand.findFirst({
        where: { id: brandId, ownerId: payload.uid, status: "ACTIVE" },
        select: { id: true },
      });
      if (!brand) {
        return new Response(JSON.stringify({ error: "Not an owner of this brand" }), { status: 403 });
      }
    }

    // Parse sponsors & speakers
    let sponsorsData: Array<{ brandId?: string; name?: string; logoUrl?: string }> = [];
    let speakersData: Array<{ userId?: string; name?: string; email?: string; photoUrl?: string; title?: string }> = [];

    const sponsorsRaw = formData.get("sponsors");
    if (sponsorsRaw && String(sponsorsRaw).trim()) {
      try { sponsorsData = JSON.parse(String(sponsorsRaw)); } catch {
        return new Response(JSON.stringify({ error: "Invalid sponsors JSON" }), { status: 400 });
      }
    }

    const speakersRaw = formData.get("speakers");
    if (speakersRaw && String(speakersRaw).trim()) {
      try { speakersData = JSON.parse(String(speakersRaw)); } catch {
        return new Response(JSON.stringify({ error: "Invalid speakers JSON" }), { status: 400 });
      }
    }

    // Process sponsor logo files
    for (let i = 0; i < sponsorsData.length; i++) {
      const logoFile = formData.get(`sponsor_logo_${i}`) as File | null;
      if (logoFile && logoFile.size > 0) {
        const bytes = Buffer.from(await logoFile.arrayBuffer());
        const fileName = `${randomUUID()}-${logoFile.name}`;
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
        const bytes = Buffer.from(await photoFile.arrayBuffer());
        const fileName = `${randomUUID()}-${photoFile.name}`;
        const uploadDir = path.join(process.cwd(), "static", "uploads", "events");
        fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, fileName), bytes);
        speakersData[i].photoUrl = `/uploads/events/${fileName}`;
      }
    }

    // Process event photo
    const photoFile = formData.get("photo") as File | null;
    const existingPhoto = String(formData.get("existingPhoto") ?? "").trim() || null;
    let photoPath: string | null = existing.photo;

    if (photoFile && photoFile.size > 0) {
      const bytes = Buffer.from(await photoFile.arrayBuffer());
      const fileName = `${randomUUID()}-${photoFile.name}`;
      const uploadDir = path.join(process.cwd(), "static", "uploads", "events");
      fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, fileName), bytes);
      photoPath = `/uploads/events/${fileName}`;
    } else if (existingPhoto) {
      photoPath = existingPhoto;
    }

    // Process document
    const documentFile = formData.get("document") as File | null;
    const existingDocument = String(formData.get("existingDocument") ?? "").trim() || null;
    let documentPath: string | null = existing.documentPath;

    if (documentFile && documentFile.size > 0) {
      const bytes = Buffer.from(await documentFile.arrayBuffer());
      const fileName = `${randomUUID()}-${documentFile.name}`;
      const uploadDir = path.join(process.cwd(), "static", "uploads", "docs");
      fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, fileName), bytes);
      documentPath = `/uploads/docs/${fileName}`;
    } else if (existingDocument) {
      documentPath = existingDocument;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update event
      const event = await tx.event.update({
        where: { id: eventId },
        data: {
          title,
          description,
          date: eventDate,
          location,
          price,
          photo: photoPath,
          documentPath,
          latitude,
          longitude,
          communityId,
          brandId,
          ...(agendaJson !== undefined ? { agenda: agendaJson } : { agenda: null }),

          categories: {
            set: [],
            connect: categories.map((id) => ({ id })),
          },
        },
        include: { categories: true },
      });

      // Recreate sponsors
      await tx.eventSponsor.deleteMany({ where: { eventId } });
      if (sponsorsData.length > 0) {
        await tx.eventSponsor.createMany({
          data: sponsorsData.map((s, i) => ({
            eventId,
            brandId: s.brandId || null,
            name: s.brandId ? null : (s.name || null),
            logoUrl: s.brandId ? null : (s.logoUrl || null),
            order: i,
          })),
        });
      }

      // Recreate speakers
      await tx.eventSpeaker.deleteMany({ where: { eventId } });
      if (speakersData.length > 0) {
        await tx.eventSpeaker.createMany({
          data: speakersData.map((s, i) => ({
            eventId,
            userId: s.userId || null,
            name: s.userId ? null : (s.name || null),
            email: s.userId ? null : (s.email || null),
            photoUrl: s.userId ? null : (s.photoUrl || null),
            title: s.title || null,
            order: i,
          })),
        });
      }

      return event;
    });

    // Trust: recalc for speakers who are platform users
    const speakerUserIds = speakersData
      .map((s) => s.userId)
      .filter((id): id is string => !!id);
    for (const uid of speakerUserIds) {
      recalcTrustScore(uid).catch(console.error);
    }

    return new Response(
      JSON.stringify({ success: true, event: result }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error updating event:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
