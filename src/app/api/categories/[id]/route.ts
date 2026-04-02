/**
 * @module api/categories/[id]
 * Manejador para operaciones de eliminación en categorías individuales. Solo permite eliminar categorías personalizadas (no del sistema) que no tienen transacciones asociadas.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/categories/[id]
 * Elimina una categoría personalizada existente. No se pueden eliminar categorías del sistema ni categorías que tienen transacciones asociadas.
 * @param {NextRequest} _req - Solicitud HTTP (no se utiliza)
 * @param {Object} params - Parámetros de ruta incluyendo el ID de la categoría
 * @returns {Object} { success: true } si la eliminación fue exitosa
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {404} Si la categoría no existe
 * @throws {409} Si la categoría es del sistema o tiene transacciones asociadas
 */
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
