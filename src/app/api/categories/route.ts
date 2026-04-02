/**
 * @module api/categories
 * Manejador para operaciones CRUD en categorías. Gestiona categorías del sistema y personalizadas. Auto-crea las categorías del sistema si no existen.
 */

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SYSTEM_CATEGORIES = [
  { id: "cat-alimentacion",    name: "Alimentación",    color: "#FF6B6B", icon: "🍔", isSystem: true },
  { id: "cat-transporte",      name: "Transporte",      color: "#4ECDC4", icon: "🚗", isSystem: true },
  { id: "cat-vivienda",        name: "Vivienda",        color: "#45B7D1", icon: "🏠", isSystem: true },
  { id: "cat-salud",           name: "Salud",           color: "#96CEB4", icon: "💊", isSystem: true },
  { id: "cat-entretenimiento", name: "Entretenimiento", color: "#FFEAA7", icon: "🎮", isSystem: true },
  { id: "cat-educacion",       name: "Educación",       color: "#DDA0DD", icon: "📚", isSystem: true },
  { id: "cat-ropa",            name: "Ropa",            color: "#F0A500", icon: "👗", isSystem: true },
  { id: "cat-tecnologia",      name: "Tecnología",      color: "#6C5CE7", icon: "💻", isSystem: true },
  { id: "cat-servicios",       name: "Servicios",       color: "#A29BFE", icon: "⚡", isSystem: true },
  { id: "cat-otros",           name: "Otros",           color: "#B2BEC3", icon: "📦", isSystem: true },
];

async function ensureSystemCategories() {
  const count = await prisma.category.count({ where: { isSystem: true } });
  if (count === 0) {
    for (const cat of SYSTEM_CATEGORIES) {
      await prisma.category.upsert({
        where: { id: cat.id },
        update: { name: cat.name, color: cat.color, icon: cat.icon, isSystem: cat.isSystem },
        create: cat,
      });
    }
  }
}

/**
 * GET /api/categories
 * Obtiene todas las categorías disponibles para el usuario: categorías del sistema y categorías personalizadas del usuario. Auto-crea las categorías del sistema en la primera llamada.
 * @returns {Array} Array de categorías con id, name, color, icon, isSystem
 * @throws {401} Si no hay sesión de usuario autenticada
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Auto-create system categories if they don't exist yet
  await ensureSystemCategories();

  const categories = await prisma.category.findMany({
    where: { OR: [{ isSystem: true }, { userId: session.user.id }] },
    select: { id: true, name: true, color: true, icon: true, isSystem: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: categories });
}

/**
 * POST /api/categories
 * Crea una nueva categoría personalizada para el usuario. Requiere nombre y color.
 * @param {NextRequest} req - Solicitud HTTP con body: { name, color }
 * @returns {Object} Categoría creada con id, name, color, icon, isSystem (HTTP 201)
 * @throws {401} Si no hay sesión de usuario autenticada
 * @throws {400} Si faltan campos requeridos
 */
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
    select: { id: true, name: true, color: true, icon: true, isSystem: true },
  });

  return NextResponse.json({ data: category }, { status: 201 });
}
