import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';
import fs from 'fs';
import path from 'path';
import { json } from '@sveltejs/kit';

const uploadDir = path.resolve('static/uploads/communities');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export const PATCH: RequestHandler = async ({ cookies, request, params }) => {
  const token = cookies.get('auth_token');
  if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await verifyJwt(token);
  if (!payload?.uid) return json({ error: 'Invalid token' }, { status: 401 });

  const community = await prisma.community.findUnique({
    where: { id: params.id },
    include: { owners: { select: { id: true } } },
  });

  if (!community) return json({ error: 'Community not found' }, { status: 404 });

  const isOwner = community.owners.some((o) => o.id === payload.uid);
  if (!isOwner) return json({ error: 'Forbidden' }, { status: 403 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ error: 'Invalid formData' }, { status: 400 });
  }

  const name = String(formData.get('name') || '').trim();
  if (!name) return json({ error: 'Name is required' }, { status: 400 });

  // Check unique name if changed
  if (name !== community.name) {
    const existing = await prisma.community.findUnique({ where: { name } });
    if (existing) return json({ error: 'Community with this name already exists' }, { status: 400 });
  }

  const isPrivate = formData.get('isPrivate') === 'true';

  // Location (optional)
  const addressRaw = formData.get('address');
  const address = addressRaw ? JSON.parse(String(addressRaw)) : null;
  const lat = formData.get('lat') ? parseFloat(String(formData.get('lat'))) : null;
  const lng = formData.get('lng') ? parseFloat(String(formData.get('lng'))) : null;

  // Handle logo
  const file = formData.get('logo') as File | null;
  let logoUrl = community.logoUrl;

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
  } else {
    const existingLogo = formData.get('existingLogo');
    if (existingLogo) {
      logoUrl = String(existingLogo);
    }
  }

  try {
    const updated = await prisma.community.update({
      where: { id: params.id },
      data: { name, logoUrl, isPrivate, address, lat, lng },
      include: {
        owners: { select: { id: true, info: { select: { name: true, photo: true } } } },
        _count: { select: { members: true } },
      },
    });

    return json({ community: updated });
  } catch (e: any) {
    console.error('[PATCH /api/community/[id]] error:', e?.message);
    return json({ error: 'Failed to update community', details: e?.message }, { status: 500 });
  }
};
