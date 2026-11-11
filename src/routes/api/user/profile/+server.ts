import type { RequestHandler } from "@sveltejs/kit";
import prisma from "$lib/prisma";
import { verifyJwt } from "$lib/jwt";
import { recalcTrustScore } from "$lib/reputation";
import { validateFile, sanitizeFileName } from "$lib/server/security";
import fs from "fs";
import path from "path";

const uploadDir = path.resolve("static/uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/* =========================
   GET — OPTIONAL AUTH
   ========================= */
export const GET: RequestHandler = async ({ cookies }) => {
  try {
    const token = cookies.get("auth_token");

    // ✅ гость
    if (!token) {
      return json({ user: null, categories: [] });
    }

    const payload = await verifyJwt(token);

    // ✅ битый токен
    if (!payload?.uid) {
      return json({ user: null, categories: [] });
    }

    const [user, categories] = await Promise.all([
      prisma.cbcUser.findUnique({
        where: { id: payload.uid },
        select: {
          id: true,
          email: true,
          info: {
            select: {
              name: true,
              photo: true,
              dateOfBirth: true,
              location: true,
              phoneNumber: true,
              status: true,
              bio: true,
            },
          },
          settings: {
            select: { isPrivate: true, emailSend: true, chatBotSend: true },
          },
          interests: {
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          },
        },
      }),

      prisma.eventCategory.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);

    // ✅ пользователь не найден = гость
    if (!user) {
      return json({ user: null, categories });
    }

    return json({ user, categories });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return json({ user: null, categories: [] });
  }
};

/* =========================
   POST — PROTECTED
   ========================= */
export const POST: RequestHandler = async ({ cookies, request }) => {
  const token = cookies.get("auth_token");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const payload = await verifyJwt(token);
  if (!payload?.uid) return json({ error: "Invalid token" }, 401);

  const formData = await request.formData();

  const fullName = formData.get("fullName");
  const dob = formData.get("dob");
  const location = formData.get("location");
  const phone = formData.get("phone");
  const bio = formData.get("bio");
  const statusText = formData.get("status");
  const isPrivateRaw = formData.get("isPrivate");
  const file = formData.get("photo") as File | null;

  const categoryIdsRaw = formData.get("categoryIds") as string | null;
  let categoryIds: string[] | null = null;

  if (categoryIdsRaw) {
    try {
      const parsed = JSON.parse(categoryIdsRaw);
      if (Array.isArray(parsed)) {
        categoryIds = parsed.filter(
          (x) => typeof x === "string" && x.length > 0
        );
      }
    } catch {
      categoryIds = null;
    }
  }

  let photoUrl: string | null = null;

  if (file && file.size > 0) {
    const fileErr = validateFile(file, "image");
    if (fileErr) return json({ error: fileErr }, 400);
    const safeName = sanitizeFileName(file.name);
    const fileExt = path.extname(safeName);
    const fileName = `${payload.uid}_${Date.now()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    photoUrl = `/uploads/${fileName}`;
  }

  const infoCreateUpdate: any = {};
  if (typeof fullName === "string") infoCreateUpdate.name = fullName;
  if (typeof dob === "string")
    infoCreateUpdate.dateOfBirth = dob ? new Date(dob) : null;
  if (typeof location === "string") infoCreateUpdate.location = location;
  if (typeof phone === "string") infoCreateUpdate.phoneNumber = phone;
  if (typeof bio === "string") infoCreateUpdate.bio = bio;
  if (typeof statusText === "string") infoCreateUpdate.status = statusText;
  if (photoUrl) infoCreateUpdate.photo = photoUrl;

  const dataToUpdate: any = {};

  if (Object.keys(infoCreateUpdate).length > 0) {
    dataToUpdate.info = {
      upsert: {
        create: infoCreateUpdate,
        update: infoCreateUpdate,
      },
    };
  }

  if (typeof isPrivateRaw === "string") {
    const isPrivate = isPrivateRaw === "true";
    dataToUpdate.settings = {
      upsert: {
        create: { isPrivate },
        update: { isPrivate },
      },
    };
  }

  if (categoryIds !== null) {
    dataToUpdate.interests = {
      set: categoryIds.map((id) => ({ id })),
    };
  }

  if (Object.keys(dataToUpdate).length === 0) {
    const current = await prisma.cbcUser.findUnique({
      where: { id: payload.uid },
      select: {
        id: true,
        email: true,
        info: true,
        settings: true,
        interests: {
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
    });

    return json(current);
  }

  try {
    const updated = await prisma.cbcUser.update({
      where: { id: payload.uid },
      data: dataToUpdate,
      include: {
        info: true,
        settings: true,
        interests: {
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
    });

    // Recalc trust score (photo/phone may have changed)
    recalcTrustScore(payload.uid).catch(console.error);

    return json(updated);
  } catch (err) {
    console.error("Error updating user profile:", err);
    return json({ error: "Internal server error" }, 500);
  }
};
