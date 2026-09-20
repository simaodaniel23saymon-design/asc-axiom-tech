import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

type AppDbClient = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __ascAxiomDb: AppDbClient | undefined;
}

export const db: AppDbClient | null = (() => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return null;
  }

  if (!globalThis.__ascAxiomDb) {
    const sql = neon(databaseUrl);

    globalThis.__ascAxiomDb = drizzle(sql, { schema });
  }

  return globalThis.__ascAxiomDb;
})();

export function getDb(): AppDbClient {
  if (!db) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return db;
}
