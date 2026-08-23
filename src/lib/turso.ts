import { createClient, type Client } from '@libsql/client';

let tursoClient: Client | null = null;

export function hasTursoDatabase() {
  return Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

export function getTursoClient() {
  if (!hasTursoDatabase()) return null;

  tursoClient ??= createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  return tursoClient;
}

