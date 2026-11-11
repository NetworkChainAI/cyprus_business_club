// Prisma query executor for AI assistant tool calls
// Each function returns max 10 results with minimal select for speed

import prisma from "$lib/prisma";

type ToolArgs = Record<string, any>;

export async function executeToolQuery(
  toolName: string,
  args: ToolArgs
): Promise<any[]> {
  switch (toolName) {
    case "search_members":
      return searchMembers(args);
    case "search_events":
      return searchEvents(args);
    case "search_brands":
      return searchBrands(args);
    case "search_communities":
      return searchCommunities(args);
    default:
      return [];
  }
}

async function searchMembers(args: ToolArgs) {
  const { query, categoryIds, requireAllCategories, excludeCategoryIds, excludeQuery } = args;

  const where: any = { info: { isNot: null } };
  const andConditions: any[] = [];
  const orConditions: any[] = [];

  // Positive text search (OR across name/bio/interests)
  if (query) {
    orConditions.push(
      { info: { name: { contains: query, mode: "insensitive" } } },
      { info: { bio: { contains: query, mode: "insensitive" } } },
      { interests: { some: { name: { contains: query, mode: "insensitive" } } } }
    );
  }

  // Category filter — AND or OR depending on requireAllCategories
  if (categoryIds?.length) {
    if (requireAllCategories) {
      // Each category must be present
      for (const id of categoryIds) {
        andConditions.push({ interests: { some: { id } } });
      }
    } else {
      orConditions.push({ interests: { some: { id: { in: categoryIds } } } });
    }
  }

  if (orConditions.length > 0) where.OR = orConditions;
  if (andConditions.length > 0) where.AND = andConditions;

  // Exclusion by category IDs
  if (excludeCategoryIds?.length) {
    where.NOT = [
      ...(where.NOT ?? []),
      { interests: { some: { id: { in: excludeCategoryIds } } } },
    ];
  }

  // Exclusion by text keyword
  if (excludeQuery) {
    where.NOT = [
      ...(where.NOT ?? []),
      { info: { name: { contains: excludeQuery, mode: "insensitive" } } },
      { info: { bio: { contains: excludeQuery, mode: "insensitive" } } },
      { interests: { some: { name: { contains: excludeQuery, mode: "insensitive" } } } },
    ];
  }

  const members = await prisma.cbcUser.findMany({
    where,
    select: {
      id: true,
      info: {
        select: {
          name: true,
          photo: true,
          status: true,
          bio: true,
          trustScore: true,
        },
      },
      interests: { select: { id: true, name: true } },
      socialTotal: { select: { total: true, rank: true } },
      _count: { select: { followers: true } },
    },
    take: 10,
    orderBy: { socialTotal: { total: "desc" } },
  });

  return members.map((m) => ({
    id: m.id,
    name: m.info?.name,
    status: m.info?.status,
    bio: m.info?.bio,
    trustScore: m.info?.trustScore,
    socialCapital: m.socialTotal?.total ?? 0,
    rank: m.socialTotal?.rank,
    followers: m._count.followers,
    interests: m.interests.map((i) => i.name),
  }));
}

async function searchEvents(args: ToolArgs) {
  const { query, categoryIds, upcoming } = args;

  const where: any = { isActive: true };
  const conditions: any[] = [];

  if (query) {
    conditions.push({
      title: { contains: query, mode: "insensitive" },
    });
    conditions.push({
      description: { contains: query, mode: "insensitive" },
    });
    // Search by category names (fuzzy)
    conditions.push({
      categories: {
        some: { name: { contains: query, mode: "insensitive" } },
      },
    });
  }

  if (categoryIds?.length) {
    conditions.push({
      categories: { some: { id: { in: categoryIds } } },
    });
  }

  if (conditions.length > 0) {
    where.OR = conditions;
  }

  if (upcoming) {
    where.date = { gte: new Date() };
  }

  const events = await prisma.event.findMany({
    where,
    select: {
      id: true,
      title: true,
      date: true,
      location: true,
      price: true,
      categories: { select: { id: true, name: true } },
      _count: { select: { registrations: true } },
    },
    take: 10,
    orderBy: { date: "asc" },
  });

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    location: e.location,
    price: e.price,
    attendees: e._count.registrations,
    categories: e.categories.map((c) => c.name),
  }));
}

async function searchBrands(args: ToolArgs) {
  const { query, categoryIds } = args;

  const where: any = { status: "ACTIVE" };
  const conditions: any[] = [];

  if (query) {
    conditions.push({
      name: { contains: query, mode: "insensitive" },
    });
    // Search by category names (fuzzy)
    conditions.push({
      categories: {
        some: { name: { contains: query, mode: "insensitive" } },
      },
    });
  }

  if (categoryIds?.length) {
    conditions.push({
      categories: { some: { id: { in: categoryIds } } },
    });
  }

  if (conditions.length > 0) {
    where.OR = conditions;
  }

  const brands = await prisma.brand.findMany({
    where,
    select: {
      id: true,
      name: true,
      website: true,
      type: true,
      answers: true,
      categories: { select: { id: true, name: true } },
      _count: { select: { followers: true } },
    },
    take: 10,
    orderBy: { followers: { _count: "desc" } },
  });

  return brands.map((b) => ({
    id: b.id,
    name: b.name,
    website: b.website,
    type: b.type,
    categories: b.categories.map((c) => c.name),
    followers: b._count.followers,
    description: (b.answers as any)?.about?.description,
    products: (b.answers as any)?.about?.products,
  }));
}

async function searchCommunities(args: ToolArgs) {
  const { query } = args;

  // Include ACTIVE and PENDING communities (exclude only DISABLED)
  const where: any = { status: { not: "DISABLED" } };

  if (query) {
    where.name = { contains: query, mode: "insensitive" };
  }

  const communities = await prisma.community.findMany({
    where,
    select: {
      id: true,
      name: true,
      logoUrl: true,
      isPrivate: true,
      _count: { select: { members: true, events: true } },
      owners: {
        select: {
          info: { select: { name: true } },
        },
      },
    },
    take: 10,
    orderBy: { members: { _count: "desc" } },
  });

  return communities.map((c) => ({
    id: c.id,
    name: c.name,
    isPrivate: c.isPrivate,
    memberCount: c._count.members,
    eventCount: c._count.events,
    owners: c.owners.map((o) => o.info?.name).filter(Boolean),
  }));
}
