import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const BASE_DIR = 'static/uploads';
const SUBDIRS = ['events', 'brands', 'communities', 'docs', 'posts', 'avatars'];
const MAX_WIDTH = 1920;
const CACHE_DIR = 'static/uploads/.cache';

async function findFile(filename: string): Promise<string | null> {
    for (const sub of SUBDIRS) {
        const candidate = path.join(BASE_DIR, sub, filename);
        try {
            await fs.access(candidate);
            return candidate;
        } catch {}
    }

    const root = path.join(BASE_DIR, filename);
    try {
        await fs.access(root);
        return root;
    } catch {}

    return null;
}

function isImage(filename: string): boolean {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext ?? '');
}

function getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'webp':
            return 'image/webp';
        case 'gif':
            return 'image/gif';
        default:
            return 'application/octet-stream';
    }
}

export const GET: RequestHandler = async ({ params, url, request }) => {
    const filename = params.file;
    const filePath = await findFile(filename);

    if (!filePath) {
        throw error(404, 'File not found');
    }

    const wParam = url.searchParams.get('w');
    const requestedWidth = wParam ? Math.min(Math.max(parseInt(wParam, 10), 16), MAX_WIDTH) : null;

    const acceptHeader = request.headers.get('accept') || '';
    const supportsWebp = acceptHeader.includes('image/webp');

    const shouldProcess = isImage(filename) && (requestedWidth || supportsWebp);

    if (!shouldProcess) {
        const file = await fs.readFile(filePath);
        return new Response(file, {
            headers: {
                'Content-Type': getMimeType(filename),
                'Cache-Control': 'public, max-age=604800, immutable',
            },
        });
    }

    // Build cache key for processed images
    const ext = filename.split('.').pop()?.toLowerCase();
    const outFormat = supportsWebp && ext !== 'gif' ? 'webp' : (ext === 'png' ? 'png' : 'jpeg');
    const cacheKey = `${filename}_w${requestedWidth || 'orig'}.${outFormat}`;
    const cachePath = path.join(CACHE_DIR, cacheKey);

    // Try serving from disk cache
    try {
        const cached = await fs.readFile(cachePath);
        return new Response(cached, {
            headers: {
                'Content-Type': outFormat === 'webp' ? 'image/webp' : getMimeType(filename),
                'Cache-Control': 'public, max-age=604800, immutable',
            },
        });
    } catch {}

    // Process image with sharp
    try {
        let pipeline = sharp(filePath);

        if (requestedWidth) {
            pipeline = pipeline.resize(requestedWidth, undefined, {
                withoutEnlargement: true,
                fit: 'inside',
            });
        }

        if (outFormat === 'webp') {
            pipeline = pipeline.webp({ quality: 80 });
        } else if (outFormat === 'jpeg') {
            pipeline = pipeline.jpeg({ quality: 82, progressive: true });
        } else if (outFormat === 'png') {
            pipeline = pipeline.png({ compressionLevel: 8 });
        }

        const buffer = await pipeline.toBuffer();

        // Write to cache in background (don't await)
        fs.mkdir(CACHE_DIR, { recursive: true })
            .then(() => fs.writeFile(cachePath, buffer))
            .catch(() => {});

        return new Response(buffer, {
            headers: {
                'Content-Type': outFormat === 'webp' ? 'image/webp' : getMimeType(filename),
                'Cache-Control': 'public, max-age=604800, immutable',
                'Vary': 'Accept',
            },
        });
    } catch {
        // Fallback: serve original file
        const file = await fs.readFile(filePath);
        return new Response(file, {
            headers: {
                'Content-Type': getMimeType(filename),
                'Cache-Control': 'public, max-age=604800, immutable',
            },
        });
    }
};
