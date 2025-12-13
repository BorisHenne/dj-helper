import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { sql } from 'drizzle-orm'
import { join } from 'path'

// Chemin vers la base de données SQLite
const dbPath = join(__dirname, 'data', 'dj-rotation.db')
const sqlite = new Database(dbPath)
const db = drizzle(sqlite)

// Helper to convert a value to ISO string if it's a timestamp
function toISOString(value: unknown): string | null {
  if (value === null || value === undefined) return null

  // If it's a number (timestamp), convert to ISO
  if (typeof value === 'number') {
    return new Date(value).toISOString()
  }

  // If it's already a valid ISO string, return as-is
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (!isNaN(parsed)) {
      return value // Already valid ISO string
    }
  }

  return null
}

async function migrateDates() {
  console.log('🔄 Starting date migration and cleanup...\n')

  // Completely wipe all tables to start fresh (order matters for foreign keys)
  console.log('🧹 Cleaning up all tables for fresh start...')

  // Wipe DJHistory
  sqlite.prepare('DELETE FROM DJHistory').run()
  console.log('  ✓ DJHistory table cleared')

  // Wipe DailySession
  sqlite.prepare('DELETE FROM DailySession').run()
  console.log('  ✓ DailySession table cleared')

  // Wipe Play table
  sqlite.prepare('DELETE FROM Play').run()
  console.log('  ✓ Play table cleared')

  // Wipe DJ table to remove old/corrupted entries
  sqlite.prepare('DELETE FROM DJ').run()
  console.log('  ✓ DJ table cleared')

  console.log('\n🎉 All tables cleared! Will be reseeded with fresh data.')
}

migrateDates()
  .catch((e) => {
    console.error('❌ Error during migration:', e)
    process.exit(1)
  })
  .finally(() => {
    sqlite.close()
  })
