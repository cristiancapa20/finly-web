import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: { id: true, name: true, type: true, color: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: accounts });
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, type, color } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
  }

  const validTypes = ["CASH", "BANK", "CREDIT_CARD", "OTHER"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }

  const account = await prisma.account.create({
    data: { name, type, userId: session.user.id, ...(color ? { color } : {}) },
    select: { id: true, name: true, type: true, color: true },
  });

  return NextResponse.json({ data: account }, { status: 201 });
}
