import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { transactionApiSchema } from "@/lib/validations";
import { Prisma } from "@/generated/prisma/client";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const type = searchParams.get("type");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const limit = searchParams.get("limit");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");
  const search = searchParams.get("search");

  // Get user's account IDs
  const accounts = await db.account.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const accountIds = accounts.map((a) => a.id);

  if (accountIds.length === 0) {
    return NextResponse.json({ transactions: [], total: 0 });
  }

  const where: Prisma.TransactionWhereInput = {
    accountId: { in: accountIds },
  };

  if (categoryId) where.categoryId = categoryId;
  if (type === "INCOME" || type === "EXPENSE") where.type = type;
  if (search) where.description = { contains: search, mode: "insensitive" };
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) where.date.lte = new Date(dateTo + "T23:59:59.999Z");
  }

  const skip = limit ? undefined : (page - 1) * pageSize;
  const take = limit ? parseInt(limit) : pageSize;

  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      where,
      include: { account: true, category: true },
      orderBy: { date: "desc" },
      skip,
      take,
    }),
    db.transaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions,
    total,
    page: limit ? 1 : page,
    pageSize: limit ? total : pageSize,
    totalPages: limit ? 1 : Math.ceil(total / pageSize),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = transactionApiSchema.safeParse(body);

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
    return NextResponse.json(
      { error: "Account not found" },
      { status: 404 }
    );
  }

  const created = await db.transaction.create({
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
    where: { id: created.id },
    include: { account: true, category: true },
  });

  return NextResponse.json(transaction, { status: 201 });
}
