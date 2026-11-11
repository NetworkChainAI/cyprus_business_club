import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';
import fs from 'fs';
import path from 'path';

const uploadDir = path.resolve('static/uploads/posts');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

export const GET: RequestHandler = async ({ params, cookies }) => {
  const { id } = params;

  const community = await prisma.community.findUnique({
    where: { id },
    select: { id: true, isPrivate: true, owners: { select: { id: true } }, members: { select: { id: true } } },
  });
  if (!community) return json({ error: 'Not found' }, { status: 404 });

  if (community.isPrivate) {
    const token = cookies.get('auth_token');
    const payload = token ? await verifyJwt(token) : null;
    const uid = payload?.uid;
    const isMember = uid && (
      community.owners.some((o) => o.id === uid) ||
      community.members.some((m) => m.id === uid)
    );
    if (!isMember) return json({ error: 'Forbidden' }, { status: 403 });
  }

  const posts = await prisma.cbcPost.findMany({
    where: { communityId: id, published: true },
    include: {
      author: { select: { id: true, info: { select: { name: true, photo: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return json(posts.map((p) => ({
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    image: p.image,
    createdAt: p.createdAt,
    author: {
      id: p.author.id,
      name: p.author.info?.name ?? 'Unknown',
      photo: p.author.info?.photo ?? null,
    },
  })));
};

export const POST: RequestHandler = async ({ params, request, cookies }) => {
  const { id } = params;

  const token = cookies.get('auth_token');
  const payload = token ? await verifyJwt(token) : null;
  if (!payload?.uid) return json({ error: 'Unauthorized' }, { status: 401 });

  const community = await prisma.community.findUnique({
    where: { id },
    select: {
      name: true,
      owners: { select: { id: true } },
      members: { select: { id: true } },
    },
  });
  if (!community) return json({ error: 'Not found' }, { status: 404 });

  const isOwner = community.owners.some((o) => o.id === payload.uid);
  if (!isOwner) return json({ error: 'Forbidden' }, { status: 403 });

  let title: string, excerpt: string | null, content: any, imageUrl: string | null = null;

  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('multipart/form-data')) {
    const fd = await request.formData();
    title = String(fd.get('title') || '').trim();
    excerpt = String(fd.get('excerpt') || '').trim() || null;
    content = JSON.parse(String(fd.get('content') || 'null'));
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
    title = (body.title ?? '').trim();
    excerpt = body.excerpt?.trim() || null;
    content = body.content;
    imageUrl = body.image || null;
  }

  if (!title) return json({ error: 'Title is required' }, { status: 400 });
  if (!content) return json({ error: 'Content is required' }, { status: 400 });

  const post = await prisma.cbcPost.create({
    data: {
      title,
      excerpt,
      content,
      image: imageUrl,
      communityId: id,
      authorId: payload.uid,
    },
    include: {
      author: { select: { id: true, info: { select: { name: true, photo: true } } } },
    },
  });

  // Notify all members and owners (except the author)
  const recipientIds = [
    ...community.owners.map((o) => o.id),
    ...community.members.map((m) => m.id),
  ].filter((uid, idx, arr) => uid !== payload.uid && arr.indexOf(uid) === idx);

  if (recipientIds.length > 0) {
    await prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        type: 'community_post',
        textKey: `New post in "${community.name}": ${title}`,
        link: `/communities/${encodeURIComponent(community.name)}`,
        emoji: '📰',
      })),
    });
  }

  return json({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    image: post.image,
    createdAt: post.createdAt,
    author: {
      id: post.author.id,
      name: post.author.info?.name ?? 'Unknown',
      photo: post.author.info?.photo ?? null,
    },
  }, { status: 201 });
};
