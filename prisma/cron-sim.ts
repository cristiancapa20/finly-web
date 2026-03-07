import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env
try {
  const envContent = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const fmt = (cents: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(cents / 100);

async function main() {
  console.log("🔍 Simulando lógica de alertas...\n");

  // Fetch all active loans with due date and reminderDays
  const result = await client.execute(`
    SELECT l.id, l.contactName, l.type, l.amount, l.dueDate, l.reminderDays, l.status,
           COALESCE(SUM(p.amount), 0) as paid
    FROM Loan l
    LEFT JOIN LoanPayment p ON p.loanId = l.id
    WHERE l.status = 'ACTIVE' AND l.dueDate IS NOT NULL
    GROUP BY l.id
  `);

  if (result.rows.length === 0) {
    console.log("ℹ️  No hay préstamos activos con fecha de vencimiento.");
    client.close();
    return;
  }

  const now = new Date();
  let alertCount = 0;

  console.log(`${"─".repeat(60)}`);
  console.log(`${"Préstamo".padEnd(20)} ${"Vence".padEnd(14)} ${"Días".padEnd(8)} ${"Recordatorio".padEnd(14)} ${"¿Alerta?"}`);
  console.log(`${"─".repeat(60)}`);

  for (const row of result.rows) {
    const due = new Date(row.dueDate as string);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const reminderDays = row.reminderDays as number | null;
    const remaining = fmt((row.amount as number) - (row.paid as number));

    const isOverdue = diffDays < 0;
    const triggersAlert = isOverdue || (reminderDays !== null && diffDays <= reminderDays);

    const dueLabel = isOverdue
      ? `hace ${Math.abs(diffDays)}d`
      : `en ${diffDays}d`;

    const reminderLabel = reminderDays ? `${reminderDays}d antes` : "ninguno";
    const alertLabel = triggersAlert
      ? (isOverdue ? "🔴 VENCIDO" : "🟡 PRÓXIMO")
      : "✅ ok";

    console.log(
      `${String(row.contactName).padEnd(20)} ${dueLabel.padEnd(14)} ${String(diffDays).padEnd(8)} ${reminderLabel.padEnd(14)} ${alertLabel}   (${remaining} restante)`
    );

    if (triggersAlert) alertCount++;
  }

  console.log(`${"─".repeat(60)}`);
  console.log(`\n📊 Total préstamos activos con fecha: ${result.rows.length}`);
  console.log(`🔔 Alertas que se mostrarían en el banner: ${alertCount}`);

  if (alertCount === 0) {
    console.log("\n✅ El banner NO aparecería — ningún préstamo cumple la condición.");
  } else {
    console.log("\n⚠️  El banner SÍ aparecería con los préstamos marcados arriba.");
  }

  client.close();
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
