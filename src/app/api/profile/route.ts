/**
 * @module api/profile
 * Manejador para operaciones de perfil de usuario. Permite obtener y actualizar información de perfil (nombre, avatar, moneda).
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/profile
 * Obtiene los datos del perfil del usuario autenticado incluyendo email, nombre, avatar, moneda y fecha de creación.
 * @returns {Object} Usuario con id, email, displayName, avatar, currency, createdAt
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {404} Si el usuario no existe
 * @throws {500} Error interno del servidor
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, displayName: true, avatar: true, currency: true, createdAt: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/profile
 * Actualiza los datos del perfil del usuario autenticado (nombre, avatar, moneda).
 * @param {NextRequest} req - Solicitud HTTP con body: { displayName?, avatar?, currency? }
 * @returns {Object} Usuario actualizado con id, email, displayName, avatar, currency
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {404} Si el usuario no existe
 * @throws {500} Error interno del servidor
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify the user exists before attempting update
    const existing = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { displayName, avatar, currency } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(displayName !== undefined ? { displayName: displayName || null } : {}),
        ...(avatar !== undefined ? { avatar: avatar || null } : {}),
        ...(currency !== undefined ? { currency } : {}),
      },
      select: { id: true, email: true, displayName: true, avatar: true, currency: true },
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
