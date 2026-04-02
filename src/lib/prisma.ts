/**
 * @module prisma
 * Instancia singleton de PrismaClient para la aplicación.
 * Soporta SQLite local en desarrollo y Turso (LibSQL) en producción.
 * Usa el patrón global para evitar múltiples instancias en hot-reload de Next.js.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Crea una instancia de PrismaClient con el adaptador apropiado.
 * Si `TURSO_DATABASE_URL` está configurada (y estamos en producción o `USE_TURSO_IN_DEV=true`),
 * usa el adaptador LibSQL para conectar a Turso. De lo contrario, usa SQLite local.
 * @internal
 */
function createPrisma() {
  const useTursoInDev = process.env.USE_TURSO_IN_DEV === "true";
  const useTursoInProd =
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.TURSO_DATABASE_URL);
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const useTurso = (useTursoInProd || useTursoInDev) && Boolean(tursoUrl);

  if (useTurso && tursoUrl) {
    const client = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(client);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
}

/**
 * Instancia singleton de PrismaClient.
 * Reutiliza la instancia global en desarrollo para evitar agotar conexiones durante hot-reload.
 */
export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
