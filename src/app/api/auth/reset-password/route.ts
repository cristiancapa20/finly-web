/**
 * @module api/auth/reset-password
 * Manejador para el restablecimiento de contraseña con token. Valida el token, verifica que no haya expirado, actualiza la contraseña con bcrypt y elimina el token después del uso.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/rateLimit";

const RESET_PASSWORD_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña del usuario con un token válido. Valida que la contraseña tenga al menos 8 caracteres, verifica el token, aplica rate limiting y actualiza la contraseña con bcrypt.
 * @param {NextRequest} request - Solicitud HTTP con body: { token, password }
 * @returns {Object} { ok: true } si el restablecimiento fue exitoso (HTTP 200)
 * @throws {400} Si el token es inválido, ha expirado o falta información requerida
 * @throws {429} Si se agota el rate limit con header 'Retry-After'
 */
export async function POST(request: NextRequest) {
  const { token, password } = await request.json();

  if (typeof token !== "string" || typeof password !== "string" || !token || !password) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }

  const ip = getClientIpFromHeaders(request.headers);
  const rateKey = `reset-password:${ip}:${token}`;
  const rate = consumeRateLimit(rateKey, RESET_PASSWORD_LIMIT);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      }
    );
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({ where: { token: tokenHash } });

  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "El enlace no es válido o ya expiró" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.delete({ where: { token: tokenHash } });

  return NextResponse.json({ ok: true });
}
