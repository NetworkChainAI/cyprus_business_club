import type { PageServerLoad } from "./$types";
import prisma from "$lib/prisma";

export const load: PageServerLoad = async () => {
  const [
    events,
    members,
    brands,
    communities,
    memberCount,
    eventCount,
    brandCount,
    communityCount,
  ] = await Promise.all([
    prisma.event.findMany({
      where: { date: { gte: new Date() }, isActive: true },
      select: {
        id: true,
        title: true,
        date: true,
        location: true,
        price: true,
        photo: true,
        categories: { select: { name: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: { date: "asc" },
      take: 6,
    }),
    prisma.cbcUser.findMany({
      where: { settings: { isPrivate: false } },
      select: {
        id: true,
        email: true,
        info: { select: { name: true, photo: true, status: true } },
        _count: { select: { followers: true } },
      },
      orderBy: { followers: { _count: "desc" } as any },
      take: 8,
    }),
    prisma.brand.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        type: true,
        categories: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.community.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        isPrivate: true,
        _count: { select: { members: true } },
      },
      orderBy: { members: { _count: "desc" } },
      take: 6,
    }),
    prisma.cbcUser.count(),
    prisma.event.count(),
    prisma.brand.count({ where: { status: "ACTIVE" } }),
    prisma.community.count({ where: { status: "ACTIVE" } }),
  ]);

  return {
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      location: e.location,
      price: e.price,
      photo: e.photo,
      categories: e.categories.map((c) => c.name),
      goingCount: e._count.registrations,
    })),
    members: members.map((m) => ({
      id: m.id,
      name: m.info?.name ?? m.email.split("@")[0],
      photo: m.info?.photo ?? null,
      status: m.info?.status ?? "Member",
      followers: m._count.followers,
    })),
    brands: brands.map((b) => ({
      id: b.id,
      name: b.name,
      logoUrl: b.logoUrl,
      type: b.type,
      category: b.categories[0]?.name ?? null,
    })),
    communities: communities.map((c) => ({
      id: c.id,
      name: c.name,
      logoUrl: c.logoUrl,
      isPrivate: c.isPrivate,
      memberCount: c._count.members,
    })),
    stats: {
      members: memberCount,
      events: eventCount,
      brands: brandCount,
      communities: communityCount,
    },
  };
};
