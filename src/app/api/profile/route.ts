import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, username: true, displayName: true, avatar: true, createdAt: true },
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { displayName, avatar } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(displayName !== undefined ? { displayName: displayName || null } : {}),
        ...(avatar !== undefined ? { avatar: avatar || null } : {}),
      },
      select: { id: true, username: true, displayName: true, avatar: true },
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
