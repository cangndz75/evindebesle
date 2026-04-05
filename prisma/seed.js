import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.category.createMany({
    data: [
      {
        id: "1",
        name: "Yeni Sezon",
        slug: "yeni-sezon",
      },
    ],
  });
}

main()
  .then(() => console.log("Seed atıldı ✅"))
  .catch((e) => {
    console.error("Seed hatası ❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
