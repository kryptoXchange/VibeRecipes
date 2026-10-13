import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const user = await db.user.upsert({
    where: { email: "dev@cooking.local" },
    update: {},
    create: { email: "dev@cooking.local", name: "Dev Cook" },
  });
  if ((await db.recipe.count()) > 0) return;
  await db.recipe.create({
    data: {
      title: "Garlic Butter Pasta",
      description: "Fast weeknight pasta.",
      ingredients: ["200g spaghetti", "4 cloves garlic", "3 tbsp butter", "parsley"].map((name) => ({ name })),
      authorId: user.id,
      steps: {
        create: [
          "Boil spaghetti in salted water until al dente.",
          "Mince the garlic.",
          "Melt butter in a pan and sauté garlic for 1 minute.",
          "Toss pasta in the garlic butter and top with parsley.",
        ].map((text, i) => ({ position: i + 1, text })),
      },
    },
  });
}

main().finally(() => db.$disconnect());
