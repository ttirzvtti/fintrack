import "dotenv/config";
import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  { name: "Food", icon: "🍔", keywords: ["restaurant", "food", "grocery", "supermarket", "cafe", "coffee", "pizza", "burger", "lunch", "dinner", "mcdonalds", "kfc", "lidl", "kaufland", "mega image", "carrefour", "auchan", "profi", "penny", "glovo", "tazz", "bolt food", "uber eats"] },
  { name: "Transport", icon: "🚗", keywords: ["uber", "bolt", "taxi", "fuel", "gas", "petrol", "parking", "metro", "bus", "train", "omv", "petrom", "mol", "lukoil", "rompetol"] },
  { name: "Rent", icon: "🏠", keywords: ["rent", "chirie", "mortgage", "landlord"] },
  { name: "Utilities", icon: "💡", keywords: ["electric", "electricity", "water", "gas", "internet", "phone", "enel", "digi", "vodafone", "orange", "telekom", "engie"] },
  { name: "Entertainment", icon: "🎬", keywords: ["netflix", "spotify", "cinema", "movie", "game", "steam", "playstation", "hbo", "disney", "youtube", "subscription"] },
  { name: "Shopping", icon: "🛍️", keywords: ["amazon", "emag", "altex", "zara", "h&m", "ikea", "decathlon", "fashion", "clothes", "shoes"] },
  { name: "Health", icon: "🏥", keywords: ["pharmacy", "doctor", "hospital", "medical", "dentist", "gym", "fitness", "farmacia", "catena", "sensiblu"] },
  { name: "Education", icon: "📚", keywords: ["school", "university", "course", "udemy", "book", "tuition", "training"] },
  { name: "Salary", icon: "💰", keywords: ["salary", "salariu", "wage", "payroll", "income"] },
  { name: "Freelance", icon: "💻", keywords: ["freelance", "consulting", "contract", "project", "client payment"] },
  { name: "Other", icon: "📦", keywords: [] },
];

async function main() {
  console.log("Seeding default categories...");

  for (const category of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, isDefault: true },
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { keywords: category.keywords },
      });
    } else {
      await prisma.category.create({
        data: {
          name: category.name,
          icon: category.icon,
          isDefault: true,
          userId: null,
          keywords: category.keywords,
        },
      });
    }
  }

  console.log(`Seeded ${defaultCategories.length} default categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
