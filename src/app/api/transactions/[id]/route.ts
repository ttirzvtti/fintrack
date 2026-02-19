import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactionApiSchema } from "@/lib/validations";

async function verifyOwnership(transactionId: string, userId: string) {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: { account: true },
  });

  if (!transaction || transaction.account.userId !== userId) {
    return null;
  }

  return transaction;
}

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
  const parsed = transactionApiSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Verify new account also belongs to user
  if (parsed.data.accountId !== existing.accountId) {
    const account = await db.account.findFirst({
      where: { id: parsed.data.accountId, userId: session.user.id },
    });
    if (!account) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }
  }

  await db.transaction.update({
    where: { id },
    data: {
      amount: parsed.data.amount,
      type: parsed.data.type,
      description: parsed.data.description,
      date: parsed.data.date,
      accountId: parsed.data.accountId,
      categoryId: parsed.data.categoryId,
    },
  });

  const transaction = await db.transaction.findUnique({
    where: { id },
    include: { account: true, category: true },
  });

  return NextResponse.json(transaction);
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

  await db.transaction.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
