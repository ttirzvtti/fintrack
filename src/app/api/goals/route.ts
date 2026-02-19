import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.coerce.number().positive("Target must be positive"),
  currency: z.enum(["RON", "EUR", "USD", "GBP"]).default("RON"),
  deadline: z.coerce.date().nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goals = await db.savingsGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    goals.map((g) => ({
      ...g,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = goalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const goal = await db.savingsGoal.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      targetAmount: parsed.data.targetAmount,
      currency: parsed.data.currency,
      deadline: parsed.data.deadline || null,
    },
  });

  return NextResponse.json(
    { ...goal, targetAmount: Number(goal.targetAmount), currentAmount: Number(goal.currentAmount) },
    { status: 201 }
  );
}
