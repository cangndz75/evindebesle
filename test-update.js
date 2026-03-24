const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const category = await prisma.category.findFirst();
    if (!category) {
      console.log("No category found");
      return;
    }
    console.log("Found category:", category.id);
    
    // Try to update it with the fields that might be failing
    const updated = await prisma.category.update({
      where: { id: category.id },
      data: {
        showOnMen: !category.showOnMen
      }
    });
    console.log("Successfully updated showOnMen");
    
    const updated2 = await prisma.category.update({
      where: { id: category.id },
      data: {
        showOnWomen: !category.showOnWomen
      }
    });
    console.log("Successfully updated showOnWomen");
    
  } catch (error) {
    console.error("PRISMA ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
