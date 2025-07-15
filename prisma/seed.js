import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.pet.createMany({
    data: [
      {
        id: "1",
        name: "Kedi",
        species: "Cat",
        breed: "Tekir",
        image: null,
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
