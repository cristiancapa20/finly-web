/**
 * Aplica migraciones Prisma pendientes en Turso (libSQL remoto).
 * `npx prisma migrate deploy` solo usa DATABASE_URL (SQLite local); con USE_TURSO_IN_DEV
 * la app habla con Turso, así que hay que sincronizar el esquema remoto con este script.
 */
import { createHash, randomUUID } from "node:crypto";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@libsql/client";

const ROOT = process.cwd();
const MIGRATIONS_DIR = join(ROOT, "prisma", "migrations");

function loadEnvFile(rel: string) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function checksumMigration(sql: string): string {
  return createHash("sha256").update(sql, "utf8").digest("hex");
}

function listMigrationDirs(): string[] {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => d.name)
    .sort();
}

async function hasPrismaMigrationsTable(client: ReturnType<typeof createClient>): Promise<boolean> {
  const r = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'`
  );
  return r.rows.length > 0;
}

async function getAppliedMigrations(
  client: ReturnType<typeof createClient>
): Promise<Set<string>> {
  const r = await client.execute(
    `SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL`
  );
  return new Set(r.rows.map((row) => String(row.migration_name)));
}

async function transactionHasIsDeleted(client: ReturnType<typeof createClient>): Promise<boolean> {
  const r = await client.execute(`PRAGMA table_info('Transaction')`);
  return r.rows.some((row) => String(row.name) === "isDeleted");
}

async function userHasCurrency(client: ReturnType<typeof createClient>): Promise<boolean> {
  const r = await client.execute(`PRAGMA table_info('User')`);
  return r.rows.some((row) => String(row.name) === "currency");
}

async function applySoftDeleteOnly(client: ReturnType<typeof createClient>) {
  const dir = "20260325103000_add_soft_delete_to_transaction";
  const sqlPath = join(MIGRATIONS_DIR, dir, "migration.sql");
  const sql = readFileSync(sqlPath, "utf8");
  console.log(`Aplicando solo ${dir} (sin tabla _prisma_migrations en Turso)...`);
  await client.executeMultiple(sql);
  console.log("Listo: columnas isDeleted / deletedAt en Transaction.");
}

async function applyCurrencyOnly(client: ReturnType<typeof createClient>) {
  const dir = "20260325230401_add_currency_to_user";
  const sqlPath = join(MIGRATIONS_DIR, dir, "migration.sql");
  const sql = readFileSync(sqlPath, "utf8");
  console.log(`Aplicando solo ${dir} (sin tabla _prisma_migrations en Turso)...`);
  await client.executeMultiple(sql);
  console.log("Listo: columna currency en User.");
}

async function main() {
  loadEnvFile(".env");
  loadEnvFile(".env.local");

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) {
    console.error("Faltan TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en .env o .env.local.");
    process.exit(1);
  }

  const client = createClient({ url, authToken });

  try {
    const hasTable = await hasPrismaMigrationsTable(client);

    if (!hasTable) {
      const hasIsDeleted = await transactionHasIsDeleted(client);
      if (!hasIsDeleted) {
        await applySoftDeleteOnly(client);
      }

      const hasCurrency = await userHasCurrency(client);
      if (!hasCurrency) {
        await applyCurrencyOnly(client);
      }

      if (hasIsDeleted && hasCurrency) {
        console.log(
          "Turso no tiene _prisma_migrations pero ya tiene todas las columnas. No se aplicó nada."
        );
      } else {
        console.log(
          "Si más adelante creás _prisma_migrations en Turso, podés usar de nuevo `npm run db:turso:migrate` para alinear el historial."
        );
      }
      return;
    }

    const applied = await getAppliedMigrations(client);
    const dirs = listMigrationDirs();
    let ran = 0;

    for (const dir of dirs) {
      if (applied.has(dir)) continue;

      const sqlPath = join(MIGRATIONS_DIR, dir, "migration.sql");
      const sql = readFileSync(sqlPath, "utf8");
      const checksum = checksumMigration(sql);
      const id = randomUUID();

      console.log(`Aplicando ${dir}...`);

      const tx = await client.transaction("write");
      try {
        await tx.executeMultiple(sql);
        await tx.execute({
          sql: `INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
                VALUES (?, ?, datetime('now'), ?, NULL, NULL, datetime('now'), 1)`,
          args: [id, checksum, dir],
        });
        await tx.commit();
      } catch (e) {
        await tx.rollback();
        throw e;
      } finally {
        tx.close();
      }

      ran++;
      console.log(`  OK ${dir}`);
    }

    if (ran === 0) {
      console.log("Turso ya tenía todas las migraciones registradas.");
    } else {
      console.log(`Listo: ${ran} migración(es) aplicada(s) en Turso.`);
    }
  } finally {
    client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
