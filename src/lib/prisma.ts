import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

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

export const prisma = globalForPrisma.prisma || createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
