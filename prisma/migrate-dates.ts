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

  // First, completely wipe the DJHistory table to remove corrupted data
  console.log('🧹 Cleaning up corrupted DJHistory table...')
  sqlite.prepare('DELETE FROM DJHistory').run()
  console.log('  ✓ DJHistory table cleared (will be reseeded)\n')

  // Wipe DailySession table to remove corrupted sessions
  console.log('🧹 Cleaning up DailySession table...')
  sqlite.prepare('DELETE FROM DailySession').run()
  console.log('  ✓ DailySession table cleared (will be reseeded)\n')

  // Migrate DJ table
  console.log('📀 Migrating DJ dates...')
  const djRows = sqlite.prepare('SELECT id, lastPlayedAt, createdAt, updatedAt FROM DJ').all() as Array<{
    id: string
    lastPlayedAt: number | string | null
    createdAt: number | string
    updatedAt: number | string
  }>

  let djUpdated = 0
  for (const row of djRows) {
    const newLastPlayedAt = toISOString(row.lastPlayedAt)
    const newCreatedAt = toISOString(row.createdAt) || new Date().toISOString()
    const newUpdatedAt = toISOString(row.updatedAt) || new Date().toISOString()

    // Check if any conversion is needed
    if (typeof row.lastPlayedAt === 'number' || typeof row.createdAt === 'number' || typeof row.updatedAt === 'number') {
      sqlite.prepare('UPDATE DJ SET lastPlayedAt = ?, createdAt = ?, updatedAt = ? WHERE id = ?')
        .run(newLastPlayedAt, newCreatedAt, newUpdatedAt, row.id)
      djUpdated++
    }
  }
  console.log(`  ✓ ${djUpdated}/${djRows.length} DJs updated\n`)

  // Migrate Play table
  console.log('🎵 Migrating Play dates...')
  const playRows = sqlite.prepare('SELECT id, playedAt FROM Play').all() as Array<{
    id: string
    playedAt: number | string
  }>

  let playUpdated = 0
  for (const row of playRows) {
    if (typeof row.playedAt === 'number') {
      const newPlayedAt = toISOString(row.playedAt)
      sqlite.prepare('UPDATE Play SET playedAt = ? WHERE id = ?')
        .run(newPlayedAt, row.id)
      playUpdated++
    }
  }
  console.log(`  ✓ ${playUpdated}/${playRows.length} Plays updated\n`)

  console.log('🎉 Date migration complete! History and Sessions will be reseeded.')
}

migrateDates()
  .catch((e) => {
    console.error('❌ Error during migration:', e)
    process.exit(1)
  })
  .finally(() => {
    sqlite.close()
  })
