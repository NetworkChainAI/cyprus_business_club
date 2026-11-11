import type { RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/prisma';
import { verifyJwt } from '$lib/jwt';

/** Require ADMIN role — returns error Response or null if authorized */
async function requireAdmin(cookies: any): Promise<Response | null> {
  const token = cookies.get('auth_token');
  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await verifyJwt(token);
  if (!payload?.uid) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userInfo = await prisma.cbcUserInfo.findFirst({
    where: { user: { id: payload.uid } },
    select: { role: true },
  });

  if (userInfo?.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}

// GET — получить всех пользователей (ADMIN only)
export const GET: RequestHandler = async ({ cookies }) => {
  const authError = await requireAdmin(cookies);
  if (authError) return authError;

  try {
    const users = await prisma.cbcUser.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        info: true
      }
    });

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST — изменить статус пользователя (ADMIN only)
export const POST: RequestHandler = async ({ request, cookies }) => {
  const authError = await requireAdmin(cookies);
  if (authError) return authError;

  try {
    const { userId, status } = await request.json();

    if (!userId || !status) {
      return new Response(
        JSON.stringify({ error: 'userId and status are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const validStatuses = ['Member', 'Partner', 'Resident', 'Admin'];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Проверяем, что пользователь существует
    const existingUser = await prisma.cbcUser.findUnique({
      where: { id: userId },
      include: { info: true }
    });

    if (!existingUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Если инфо не существует — создаём
    if (!existingUser.info) {
      await prisma.cbcUserInfo.create({
        data: {
          user: { connect: { id: userId } },
          status
        }
      });
    } else {
      // Обновляем только статус
      await prisma.cbcUserInfo.update({
        where: { id: existingUser.info.id },
        data: { status }
      });
    }

    return new Response(
      JSON.stringify({ success: true, userId, status }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Error updating user status:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
