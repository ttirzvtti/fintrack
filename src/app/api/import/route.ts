import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const importRowSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().optional(),
  date: z.string(),
  categoryId: z.string(),
});

const importSchema = z.object({
  accountId: z.string().min(1),
  rows: z.array(importRowSchema).min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = importSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Verify account belongs to user
  const account = await db.account.findFirst({
    where: { id: parsed.data.accountId, userId: session.user.id },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Create transactions one by one (HTTP adapter doesn't support transactions)
  let created = 0;
  for (const row of parsed.data.rows) {
    await db.transaction.create({
      data: {
        amount: row.amount,
        type: row.type,
        description: row.description || null,
        date: new Date(row.date),
        accountId: parsed.data.accountId,
        categoryId: row.categoryId,
      },
    });
    created++;
  }

  return NextResponse.json({ created }, { status: 201 });
}

// Auto-categorize endpoint
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const descriptions: string[] = body.descriptions || [];

  // Get all categories with keywords
  const categories = await db.category.findMany({
    where: {
      OR: [{ isDefault: true }, { userId: session.user.id }],
    },
  });

  const results = descriptions.map((desc) => {
    const lower = desc.toLowerCase();
    for (const cat of categories) {
      const keywords = cat.keywords || [];
      if (keywords.length > 0 && keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
        return cat.id;
      }
    }
    return null;
  });

  return NextResponse.json({ categoryIds: results });
}
