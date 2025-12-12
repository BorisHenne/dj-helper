import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Chemin vers la base de données SQLite
const dbPath = path.join(process.cwd(), 'prisma', 'data', 'dj-rotation.db');

// Singleton pour le client de base de données
const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
};

const sqlite = globalForDb.sqlite ?? new Database(dbPath);

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });

// Export des schémas pour faciliter les imports
export * from './schema';
