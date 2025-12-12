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
  console.log('🔄 Starting date migration...\n')

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

  // Migrate DJHistory table
  console.log('🎶 Migrating DJHistory dates...')
  const historyRows = sqlite.prepare('SELECT id, playedAt, createdAt, updatedAt FROM DJHistory').all() as Array<{
    id: string
    playedAt: number | string
    createdAt: number | string
    updatedAt: number | string
  }>

  let historyUpdated = 0
  for (const row of historyRows) {
    if (typeof row.playedAt === 'number' || typeof row.createdAt === 'number' || typeof row.updatedAt === 'number') {
      const newPlayedAt = toISOString(row.playedAt) || new Date().toISOString()
      const newCreatedAt = toISOString(row.createdAt) || new Date().toISOString()
      const newUpdatedAt = toISOString(row.updatedAt) || new Date().toISOString()

      sqlite.prepare('UPDATE DJHistory SET playedAt = ?, createdAt = ?, updatedAt = ? WHERE id = ?')
        .run(newPlayedAt, newCreatedAt, newUpdatedAt, row.id)
      historyUpdated++
    }
  }
  console.log(`  ✓ ${historyUpdated}/${historyRows.length} History entries updated\n`)

  // Migrate DailySession table
  console.log('📅 Migrating DailySession dates...')
  const sessionRows = sqlite.prepare('SELECT id, date, createdAt, updatedAt FROM DailySession').all() as Array<{
    id: string
    date: number | string
    createdAt: number | string
    updatedAt: number | string
  }>

  let sessionUpdated = 0
  for (const row of sessionRows) {
    if (typeof row.date === 'number' || typeof row.createdAt === 'number' || typeof row.updatedAt === 'number') {
      const newDate = toISOString(row.date) || new Date().toISOString()
      const newCreatedAt = toISOString(row.createdAt) || new Date().toISOString()
      const newUpdatedAt = toISOString(row.updatedAt) || new Date().toISOString()

      sqlite.prepare('UPDATE DailySession SET date = ?, createdAt = ?, updatedAt = ? WHERE id = ?')
        .run(newDate, newCreatedAt, newUpdatedAt, row.id)
      sessionUpdated++
    }
  }
  console.log(`  ✓ ${sessionUpdated}/${sessionRows.length} Sessions updated\n`)

  // Remove duplicates from DJHistory (keep the first entry for each djName+title+date combination)
  console.log('🧹 Removing duplicate history entries...')
  const duplicateCheck = sqlite.prepare(`
    SELECT id, djName, title, playedAt,
           ROW_NUMBER() OVER (PARTITION BY djName, title, substr(playedAt, 1, 10) ORDER BY id) as rn
    FROM DJHistory
  `).all() as Array<{ id: string; djName: string; title: string; playedAt: string; rn: number }>

  const duplicateIds = duplicateCheck.filter(r => r.rn > 1).map(r => r.id)
  if (duplicateIds.length > 0) {
    const placeholders = duplicateIds.map(() => '?').join(',')
    sqlite.prepare(`DELETE FROM DJHistory WHERE id IN (${placeholders})`).run(...duplicateIds)
    console.log(`  ✓ ${duplicateIds.length} duplicate entries removed\n`)
  } else {
    console.log(`  ✓ No duplicates found\n`)
  }

  console.log('🎉 Date migration complete!')
}

migrateDates()
  .catch((e) => {
    console.error('❌ Error during migration:', e)
    process.exit(1)
  })
  .finally(() => {
    sqlite.close()
  })
