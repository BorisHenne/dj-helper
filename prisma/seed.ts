import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import { djs, djHistory, dailySessions } from '../src/db/schema'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createId } from '@paralleldrive/cuid2'

// Chemin vers la base de données SQLite
const dbPath = join(__dirname, 'data', 'dj-rotation.db')
const sqlite = new Database(dbPath)
const db = drizzle(sqlite)

// Load default DJs from JSON file
const defaultDJs = JSON.parse(
  readFileSync(join(__dirname, 'seed-data', 'default-djs.json'), 'utf-8')
) as Array<{
  name: string
  totalPlays: number
  lastPlayedAt: string
  avatar: string
  color: string
}>

// Load default history from JSON file
const defaultHistory = JSON.parse(
  readFileSync(join(__dirname, 'seed-data', 'default-history.json'), 'utf-8')
) as Array<{
  date: string
  djName: string
  artist: string
  title: string
  youtubeUrl?: string
}>

async function main() {
  console.log('🎵 Seeding database...\n')

  // Seed DJs
  console.log('📀 Seeding DJs...')
  for (const dj of defaultDJs) {
    // Check if DJ exists
    const [existing] = await db.select()
      .from(djs)
      .where(eq(djs.name, dj.name))
      .limit(1)

    if (existing) {
      // Update existing DJ
      await db.update(djs)
        .set({
          totalPlays: dj.totalPlays,
          lastPlayedAt: new Date(dj.lastPlayedAt).toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(djs.name, dj.name))
    } else {
      // Create new DJ
      await db.insert(djs).values({
        id: createId(),
        name: dj.name,
        avatar: dj.avatar,
        color: dj.color,
        totalPlays: dj.totalPlays,
        lastPlayedAt: new Date(dj.lastPlayedAt).toISOString(),
        isActive: true,
      })
    }
    console.log(`  ✓ ${dj.name}: ${dj.totalPlays} passages`)
  }
  console.log(`\n✅ ${defaultDJs.length} DJs seeded!\n`)

  // Seed History
  console.log('🎶 Seeding history...')

  // Check existing entries to avoid duplicates
  const existingHistory = await db.select({
    djName: djHistory.djName,
    title: djHistory.title,
    playedAt: djHistory.playedAt,
  }).from(djHistory)

  const existingKeys = new Set(
    existingHistory.map(h => {
      // Handle different date formats: ISO string, timestamp number, or invalid
      let dateStr: string
      try {
        if (typeof h.playedAt === 'number') {
          // Timestamp format (from old integer mode)
          dateStr = new Date(h.playedAt).toISOString().split('T')[0]
        } else if (h.playedAt && !isNaN(Date.parse(h.playedAt))) {
          // Valid ISO string
          dateStr = new Date(h.playedAt).toISOString().split('T')[0]
        } else {
          // Invalid or unknown format - use a placeholder
          dateStr = 'unknown'
        }
      } catch {
        dateStr = 'unknown'
      }
      return `${h.djName}-${h.title}-${dateStr}`
    })
  )

  let created = 0
  let skipped = 0

  for (const entry of defaultHistory) {
    const key = `${entry.djName}-${entry.title}-${entry.date}`

    if (existingKeys.has(key)) {
      skipped++
      continue
    }

    await db.insert(djHistory).values({
      id: createId(),
      djName: entry.djName,
      artist: entry.artist,
      title: entry.title,
      youtubeUrl: entry.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(entry.artist + ' ' + entry.title)}`,
      playedAt: new Date(entry.date).toISOString(),
    })
    console.log(`  ✓ ${entry.date}: ${entry.djName} - ${entry.artist} - ${entry.title}`)
    created++
  }

  console.log(`\n✅ History: ${created} created, ${skipped} skipped (already exist)`)

  // Seed next DailySession (A. Gautier on 2025-12-15)
  console.log('\n📅 Seeding next session...')

  // Find A. Gautier DJ
  const [gautierDj] = await db.select()
    .from(djs)
    .where(eq(djs.name, 'A. Gautier'))
    .limit(1)

  if (gautierDj) {
    // Check if session already exists
    const [existingSession] = await db.select()
      .from(dailySessions)
      .where(eq(dailySessions.date, '2025-12-15T00:00:00.000Z'))
      .limit(1)

    if (!existingSession) {
      await db.insert(dailySessions).values({
        id: createId(),
        date: '2025-12-15T00:00:00.000Z',
        djId: gautierDj.id,
        djName: gautierDj.name,
        status: 'pending',
      })
      console.log('  ✓ Session 2025-12-15: A. Gautier (pending)')
    } else {
      console.log('  ⏭️  Session 2025-12-15 already exists')
    }
  } else {
    console.log('  ⚠️  A. Gautier not found, skipping session creation')
  }

  console.log('\n🎉 Database seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(() => {
    sqlite.close()
  })
