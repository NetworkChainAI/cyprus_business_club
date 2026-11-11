import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';
import fs from 'fs';
import path from 'path';

const uploadDir = path.resolve('static/uploads/posts');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
  const { id, postId } = params;

  const token = cookies.get('auth_token');
  const payload = token ? await verifyJwt(token) : null;
  if (!payload?.uid) return json({ error: 'Unauthorized' }, { status: 401 });

  const post = await prisma.cbcPost.findUnique({
    where: { id: postId },
    include: { community: { select: { owners: { select: { id: true } } } } },
  });
  if (!post || post.communityId !== id) return json({ error: 'Not found' }, { status: 404 });

  const isOwner = post.community?.owners.some((o) => o.id === payload.uid);
  if (!isOwner) return json({ error: 'Forbidden' }, { status: 403 });

  let title: string | undefined, excerpt: string | null | undefined, content: any, imageUrl: string | null | undefined;

  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('multipart/form-data')) {
    const fd = await request.formData();
    title = String(fd.get('title') || '').trim() || undefined;
    const excerptRaw = fd.get('excerpt');
    excerpt = excerptRaw !== null ? (String(excerptRaw).trim() || null) : undefined;
    const contentRaw = fd.get('content');
    content = contentRaw ? JSON.parse(String(contentRaw)) : undefined;
    const file = fd.get('image') as File | null;
    if (file && file.size > 0) {
      if (!file.type.startsWith('image/')) return json({ error: 'Image must be an image file' }, { status: 400 });
      const ext = path.extname(file.name) || `.${file.type.split('/')[1] || 'jpg'}`;
      const fileName = `${payload.uid}_${Date.now()}${ext}`;
      fs.writeFileSync(path.join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));
      imageUrl = `/uploads/posts/${fileName}`;
    }
  } else {
    const body = await request.json();
    title = body.title;
    excerpt = body.excerpt;
    content = body.content;
    imageUrl = body.image;
  }

  const updated = await prisma.cbcPost.update({
    where: { id: postId },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(excerpt !== undefined && { excerpt: excerpt?.trim() || null }),
      ...(content !== undefined && { content }),
      ...(imageUrl !== undefined && { image: imageUrl || null }),
    },
    include: {
      author: { select: { id: true, info: { select: { name: true, photo: true } } } },
    },
  });

  return json({
    id: updated.id,
    title: updated.title,
    excerpt: updated.excerpt,
    content: updated.content,
    image: updated.image,
    createdAt: updated.createdAt,
    author: {
      id: updated.author.id,
      name: updated.author.info?.name ?? 'Unknown',
      photo: updated.author.info?.photo ?? null,
    },
  });
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
  const { id, postId } = params;

  const token = cookies.get('auth_token');
  const payload = token ? await verifyJwt(token) : null;
  if (!payload?.uid) return json({ error: 'Unauthorized' }, { status: 401 });

  const post = await prisma.cbcPost.findUnique({
    where: { id: postId },
    include: { community: { select: { owners: { select: { id: true } } } } },
  });
  if (!post || post.communityId !== id) return json({ error: 'Not found' }, { status: 404 });

  const isOwner = post.community?.owners.some((o) => o.id === payload.uid);
  if (!isOwner) return json({ error: 'Forbidden' }, { status: 403 });

  await prisma.cbcPost.delete({ where: { id: postId } });
  return json({ ok: true });
};
