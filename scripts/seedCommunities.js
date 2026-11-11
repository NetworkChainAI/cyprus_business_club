import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get first user as owner
  const owner = await prisma.cbcUser.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!owner) {
    console.error('No CbcUser found. Create a user first.');
    process.exit(1);
  }

  // Get a couple more users for members
  const otherUsers = await prisma.cbcUser.findMany({
    where: { id: { not: owner.id } },
    take: 3,
    orderBy: { createdAt: 'asc' },
  });

  const communities = [
    { name: 'Cyprus Tech Hub', isPrivate: false },
    { name: 'Limassol Entrepreneurs', isPrivate: false },
    { name: 'Digital Nomads Cyprus', isPrivate: false },
    { name: 'Founders Circle', isPrivate: true },
    { name: 'Investors Club', isPrivate: true },
  ];

  for (const c of communities) {
    const existing = await prisma.community.findUnique({ where: { name: c.name } });
    if (existing) {
      console.log(`  skip "${c.name}" (exists)`);
      continue;
    }

    const created = await prisma.community.create({
      data: {
        name: c.name,
        isPrivate: c.isPrivate,
        owners: { connect: { id: owner.id } },
        members: {
          connect: otherUsers.slice(0, c.isPrivate ? 1 : 2).map((u) => ({ id: u.id })),
        },
      },
    });

    console.log(`  created "${created.name}" (${c.isPrivate ? 'private' : 'public'})`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
