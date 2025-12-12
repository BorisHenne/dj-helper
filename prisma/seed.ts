import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import { djs, djHistory } from '../src/db/schema'
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
          lastPlayedAt: new Date(dj.lastPlayedAt),
          updatedAt: new Date(),
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
        lastPlayedAt: new Date(dj.lastPlayedAt),
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
      const dateStr = h.playedAt instanceof Date
        ? h.playedAt.toISOString().split('T')[0]
        : new Date(h.playedAt).toISOString().split('T')[0]
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
      playedAt: new Date(entry.date),
    })
    console.log(`  ✓ ${entry.date}: ${entry.djName} - ${entry.artist} - ${entry.title}`)
    created++
  }

  console.log(`\n✅ History: ${created} created, ${skipped} skipped (already exist)`)
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
