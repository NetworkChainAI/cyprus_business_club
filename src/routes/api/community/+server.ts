import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';
import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const uploadDir = path.resolve('static/uploads/communities');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export const POST: RequestHandler = async ({ cookies, request }) => {
  const token = cookies.get('auth_token');
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyJwt(token);
  if (!payload?.uid) return json({ error: 'Invalid token' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'Invalid formData' }, { status: 400 });
  }

  const name = String(formData.get('name') || '').trim();
  if (!name) return json({ error: 'Name is required' }, { status: 400 });

  const isPrivate = formData.get('isPrivate') === 'true';

  // Location (optional)
  const addressRaw = formData.get('address');
  const address = addressRaw ? JSON.parse(String(addressRaw)) : null;
  const lat = formData.get('lat') ? parseFloat(String(formData.get('lat'))) : null;
  const lng = formData.get('lng') ? parseFloat(String(formData.get('lng'))) : null;

  // Check unique name
  const existing = await prisma.community.findUnique({ where: { name } });
  if (existing) return json({ error: 'Community with this name already exists' }, { status: 400 });

  // Handle logo upload
  const file = formData.get('logo') as File | null;
  let logoUrl: string | null = null;

  if (file && file.size > 0) {
    if (!file.type.startsWith('image/')) {
      return json({ error: 'Logo must be an image' }, { status: 400 });
    }
    const ext = path.extname(file.name) || `.${file.type.split('/')[1] || 'png'}`;
    const fileName = `${payload.uid}_${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    logoUrl = `/uploads/communities/${fileName}`;
  }

  try {
    const community = await prisma.community.create({
      data: {
        name,
        logoUrl,
        isPrivate,
        address,
        lat,
        lng,
        owners: { connect: { id: payload.uid } },
      },
      include: {
        owners: { select: { id: true, info: { select: { name: true, photo: true } } } },
        _count: { select: { members: true } },
      },
    });

    return json({ community }, { status: 201 });
  } catch (e: any) {
    console.error('[POST /api/community] error:', e?.message);
    return json({ error: 'Failed to create community', details: e?.message }, { status: 500 });
  }
};
