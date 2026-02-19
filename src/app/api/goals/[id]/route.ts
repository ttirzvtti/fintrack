import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

async function verifyOwnership(goalId: string, userId: string) {
  const goal = await db.savingsGoal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== userId) return null;
  return goal;
}

// Update amount (deposit/withdraw)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await verifyOwnership(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  // If it's a deposit/withdraw operation
  if (body.operation === "deposit" || body.operation === "withdraw") {
    const amountSchema = z.coerce.number().positive();
    const parsed = amountSchema.safeParse(body.amount);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const current = Number(existing.currentAmount);
    const newAmount = body.operation === "deposit"
      ? current + parsed.data
      : Math.max(0, current - parsed.data);

    await db.savingsGoal.update({
      where: { id },
      data: { currentAmount: newAmount },
    });

    const updated = await db.savingsGoal.findUnique({ where: { id } });
    if (!updated) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...updated,
      targetAmount: Number(updated.targetAmount),
      currentAmount: Number(updated.currentAmount),
    });
  }

  // Otherwise it's a full update
  const goalSchema = z.object({
    name: z.string().min(1).optional(),
    targetAmount: z.coerce.number().positive().optional(),
    deadline: z.coerce.date().nullable().optional(),
  });

  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  await db.savingsGoal.update({
    where: { id },
    data: parsed.data,
  });

  const updated = await db.savingsGoal.findUnique({ where: { id } });
  if (!updated) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }
  return NextResponse.json({
    ...updated,
    targetAmount: Number(updated.targetAmount),
    currentAmount: Number(updated.currentAmount),
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await verifyOwnership(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.savingsGoal.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
