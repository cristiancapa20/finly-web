import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { consumeRateLimit, getClientIpFromHeaders } from "@/lib/rateLimit";

const resend = new Resend(process.env.RESEND_API_KEY);
const FORGOT_PASSWORD_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "no-reply@finlycr.com";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "El correo es requerido" }, { status: 400 });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const ip = getClientIpFromHeaders(request.headers);
    const rateKey = `forgot-password:${ip}:${normalizedEmail}`;
    const rate = consumeRateLimit(rateKey, FORGOT_PASSWORD_LIMIT);
    if (!rate.allowed) {
      // Mantenemos respuesta uniforme para no filtrar existencia de cuenta.
      return NextResponse.json({ ok: true });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Siempre respondemos igual para no revelar si el email existe.
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Eliminar tokens anteriores del usuario.
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 5); // 5 minutos

    // Guardamos solo el hash del token por seguridad.
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: tokenHash, expiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.finlycr.com";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await resend.emails.send({
      from: `FinlyCR <${RESEND_FROM_EMAIL}>`,
      to: user.email,
      subject: "Restablecer tu contraseña — FinlyCR",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <div style="text-align:center;margin-bottom:24px">
            <span style="font-size:22px;font-weight:700;color:#4f46e5">FinlyCR</span>
          </div>
          <h2 style="font-size:18px;font-weight:600;color:#111827;margin-bottom:8px">
            Solicitud para restablecer contraseña
          </h2>
          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin-bottom:24px">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta
            (<strong>${user.email}</strong>). Si no fuiste tú, puedes ignorar este correo.
          </p>
          <a
            href="${resetUrl}"
            style="display:inline-block;background:#4f46e5;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;margin-bottom:24px"
          >
            Restablecer contraseña
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:24px">
            Este enlace vence en <strong>5 minutos</strong>. Si ya restableciste tu contraseña, ignora este correo.
          </p>
        </div>
      `,
    });
  } catch {
    // Respuesta uniforme para evitar enumeración por diferencias de error/tiempo.
  }

  return NextResponse.json({ ok: true });
}
