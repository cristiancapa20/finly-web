import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (category.isSystem || category.userId !== session.user.id) {
    return NextResponse.json(
      { error: "No se puede eliminar esta categoría" },
      { status: 409 }
    );
  }

  const txCount = await prisma.transaction.count({ where: { categoryId: id, userId: session.user.id } });
  if (txCount > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar una categoría con transacciones asociadas" },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
