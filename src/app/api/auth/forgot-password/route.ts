import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "El correo es requerido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Siempre respondemos igual para no revelar si el email existe
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  // Eliminar tokens anteriores del usuario
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://www.finlycr.com";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await resend.emails.send({
    from: "FinlyCR <noreply@finlycr.com>",
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
          Este enlace vence en <strong>1 hora</strong>. Si ya restableciste tu contraseña, ignora este correo.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
