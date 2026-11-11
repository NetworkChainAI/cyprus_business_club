import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import prisma from '$lib/prisma';

export const load: PageServerLoad = async ({ params }) => {
  const id = params.id;

  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          info: {
            select: {
              name: true,
              photo: true,
              location: true,
              status: true,
              bio: true
            }
          }
        }
      },
      categories: {
        select: { id: true, name: true }
      }
    }
  });

  if (!brand) {
    throw error(404, 'Brand not found');
  }

  return { brand };
};
