import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, color, initialBalance } = body;

  const account = await prisma.account.update({
    where: { id, userId: session.user.id },
    data: {
      ...(name ? { name } : {}),
      ...(color ? { color } : {}),
      ...(initialBalance !== undefined && initialBalance !== "" ? { initialBalance: parseFloat(initialBalance) } : {}),
    },
    select: { id: true, name: true, type: true, color: true, initialBalance: true },
  });

  return NextResponse.json({ data: account });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const txCount = await prisma.transaction.count({ where: { accountId: id, userId: session.user.id } });
  if (txCount > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar una cuenta con transacciones asociadas" },
      { status: 409 }
    );
  }

  await prisma.account.delete({ where: { id, userId: session.user.id } });

  return NextResponse.json({ success: true });
}
