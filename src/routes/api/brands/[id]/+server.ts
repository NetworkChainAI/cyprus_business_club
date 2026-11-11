import type { RequestEvent, RequestHandler } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";
import fs from "fs";
import path from "path";
import { brandAnswersTemplateV1 } from "$lib/utils/brandAnswersTemplateV1";

const uploadDir = path.resolve("static/uploads/brands");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

function deepMerge(t: any, d: any) {
  if (d === undefined) return t;
  if (t === null || typeof t !== "object") return d;
  if (Array.isArray(t)) return Array.isArray(d) ? d : t;

  const out: any = { ...t };
  for (const k of Object.keys(t)) out[k] = deepMerge(t[k], d?.[k]);
  for (const k of Object.keys(d || {})) if (!(k in out)) out[k] = d[k];
  return out;
}

export const PATCH: RequestHandler = async ({ cookies, request, params }: RequestEvent) => {
  const token = cookies.get("auth_token");
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const payload = await verifyJwt(token);
  if (!payload?.uid) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
  }

  const brand = await prisma.brand.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true },
  });

  if (!brand) {
    return new Response(JSON.stringify({ error: "Brand not found" }), { status: 404 });
  }

  if (brand.ownerId !== payload.uid) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid formData" }), { status: 400 });
  }

  const name = String(formData.get("name") || "").trim();
  const website = String(formData.get("website") || "").trim() || null;

  const typeRaw = String(formData.get("type") || "").trim().toUpperCase();
  if (typeRaw !== "PERSONAL" && typeRaw !== "COMPANY") {
    return new Response(JSON.stringify({ error: "Invalid brand type" }), { status: 400 });
  }

  if (!name) {
    return new Response(JSON.stringify({ error: "Name is required" }), { status: 400 });
  }

  let categoryIds: string[] = [];
  let tagIds: string[] = [];
  let incomingAnswers: any = {};

  try {
    const raw = formData.get("categoryIds");
    categoryIds = raw ? JSON.parse(String(raw)) : [];
    if (!Array.isArray(categoryIds)) categoryIds = [];
    categoryIds = categoryIds.filter((x) => typeof x === "string" && x.trim().length > 0);
  } catch {
    return new Response(JSON.stringify({ error: "categoryIds must be valid JSON array" }), { status: 400 });
  }

  try {
    const raw = formData.get("answers");
    incomingAnswers = raw ? JSON.parse(String(raw)) : {};
    if (incomingAnswers === null || typeof incomingAnswers !== "object") incomingAnswers = {};
  } catch {
    return new Response(JSON.stringify({ error: "answers must be valid JSON object" }), { status: 400 });
  }

  try {
    const raw = formData.get("tagIds");
    tagIds = raw ? JSON.parse(String(raw)) : [];
    if (!Array.isArray(tagIds)) tagIds = [];
    tagIds = tagIds.filter((x) => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
    tagIds = Array.from(new Set(tagIds));
  } catch {
    return new Response(JSON.stringify({ error: "tagIds must be valid JSON array" }), { status: 400 });
  }

  // Handle logo
  const file = formData.get("logo") as File | null;
  const existingLogo = String(formData.get("existingLogo") || "").trim() || null;
  let logoUrl: string | null = existingLogo;

  if (file && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return new Response(JSON.stringify({ error: "Logo must be an image" }), { status: 400 });
    }

    const fileExt = path.extname(file.name) || `.${file.type.split("/")[1] || "png"}`;
    const fileName = `${payload.uid}_${Date.now()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    logoUrl = `/uploads/brands/${fileName}`;
  }

  const answers = deepMerge(brandAnswersTemplateV1, incomingAnswers);

  try {
    // Update categories: disconnect all, then connect new
    await prisma.brand.update({
      where: { id: params.id },
      data: { categories: { set: [] } },
    });

    // Delete old tags, create new
    await prisma.brandTagOnBrand.deleteMany({
      where: { brandId: params.id },
    });

    const updated = await prisma.brand.update({
      where: { id: params.id },
      data: {
        name,
        website,
        type: typeRaw as any,
        logoUrl,
        answers,
        categories: categoryIds.length ? { connect: categoryIds.map((id) => ({ id })) } : undefined,
        tags: tagIds.length
          ? {
              createMany: {
                data: tagIds.map((id) => ({ tagId: id })),
                skipDuplicates: true,
              },
            }
          : undefined,
      },
      include: {
        categories: true,
        tags: { include: { tag: true } },
      },
    });

    return new Response(JSON.stringify({ brand: updated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[PATCH /api/brands/:id] DB error:", e?.message);
    return new Response(JSON.stringify({ error: "Failed to update brand", details: e?.message }), {
      status: 500,
    });
  }
};
