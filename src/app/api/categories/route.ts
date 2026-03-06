import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { OR: [{ isSystem: true }, { userId: session.user.id }] },
    select: { id: true, name: true, color: true, isSystem: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: categories });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, color } = body;

  if (!name || !color) {
    return NextResponse.json({ error: "Name and color are required" }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: { name, color, isSystem: false, userId: session.user.id },
    select: { id: true, name: true, color: true, isSystem: true },
  });

  return NextResponse.json({ data: category }, { status: 201 });
}
