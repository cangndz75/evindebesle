// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const petTypes = [
    'Köpek',
    'Kedi',
    'Kuş',
    'Balık',
    'Küçük Hayvan',
    'Sürüngen',
    'Çiftlik Hayvanı',
  ];

  for (const name of petTypes) {
    await prisma.pet.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('✅ Pet türleri eklendi');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
