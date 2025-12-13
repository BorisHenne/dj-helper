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

// Configuration
const FETCH_VIDEO_IDS = process.env.FETCH_VIDEOS === 'true' // Only fetch if explicitly enabled
const DELAY_MS = 2000 // 2 seconds between YouTube searches

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Search YouTube for video ID using ytsr
async function searchYouTubeVideoId(artist: string, title: string): Promise<string | null> {
  try {
    const ytsr = (await import('ytsr')).default
    const query = `${artist} ${title}`.trim()

    const searchResults = await ytsr(query, {
      limit: 5,
      safeSearch: false,
    }) as { items: Array<{ type: string; id: string; title: string }> }

    const video = searchResults.items.find(item => item.type === 'video')
    if (video) {
      return video.id
    }
    return null
  } catch (error) {
    // Silently fail - network might not be available
    return null
  }
}

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
  videoId?: string
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
  if (FETCH_VIDEO_IDS) {
    console.log('   (Fetching YouTube video IDs - this may take a while...)\n')
  }

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
  let videosFound = 0

  for (let i = 0; i < defaultHistory.length; i++) {
    const entry = defaultHistory[i]
    const key = `${entry.djName}-${entry.title}-${entry.date}`

    if (existingKeys.has(key)) {
      skipped++
      continue
    }

    let videoId = entry.videoId || null
    let youtubeUrl = entry.youtubeUrl

    // Try to fetch video ID if not provided and fetching is enabled
    if (!videoId && FETCH_VIDEO_IDS) {
      process.stdout.write(`  [${i + 1}/${defaultHistory.length}] ${entry.artist} - ${entry.title}... `)
      videoId = await searchYouTubeVideoId(entry.artist, entry.title)
      if (videoId) {
        console.log(`✓ (${videoId})`)
        videosFound++
      } else {
        console.log('✗ (not found)')
      }

      // Wait between requests to avoid rate limiting
      if (i < defaultHistory.length - 1) {
        await delay(DELAY_MS)
      }
    }

    // Generate YouTube URL
    if (videoId) {
      youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`
    } else if (!youtubeUrl) {
      youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(entry.artist + ' ' + entry.title)}`
    }

    await db.insert(djHistory).values({
      id: createId(),
      djName: entry.djName,
      artist: entry.artist,
      title: entry.title,
      youtubeUrl,
      videoId,
      playedAt: new Date(entry.date).toISOString(),
    })

    if (!FETCH_VIDEO_IDS) {
      console.log(`  ✓ ${entry.date}: ${entry.djName} - ${entry.artist} - ${entry.title}`)
    }
    created++
  }

  console.log(`\n✅ History: ${created} created, ${skipped} skipped`)
  if (FETCH_VIDEO_IDS) {
    console.log(`   📺 YouTube videos found: ${videosFound}/${created}`)
  }

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
