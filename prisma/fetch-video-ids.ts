import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq, isNull } from 'drizzle-orm'
import { djHistory } from '../src/db/schema'
import { join } from 'path'

// Path to SQLite database
const dbPath = join(__dirname, 'data', 'dj-rotation.db')
const sqlite = new Database(dbPath)
const db = drizzle(sqlite)

// Delay between requests to avoid rate limiting
const DELAY_MS = 1500

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function searchYouTube(artist: string, title: string): Promise<string | null> {
  try {
    // Dynamic import ytsr (CommonJS module)
    const ytsr = (await import('ytsr')).default

    const query = `${artist} ${title}`.trim()
    console.log(`    Searching: "${query}"`)

    const searchResults = await ytsr(query, {
      limit: 1,
      safeSearch: false,
    })

    // Find the first video result
    const video = searchResults.items.find((item: { type: string }) => item.type === 'video') as {
      type: string
      id: string
      title: string
    } | undefined

    if (video) {
      console.log(`    ✓ Found: ${video.title} (${video.id})`)
      return video.id
    }

    console.log(`    ✗ No video found`)
    return null
  } catch (error) {
    console.error(`    ✗ Search failed:`, error instanceof Error ? error.message : error)
    return null
  }
}

async function main() {
  console.log('🎬 Fetching YouTube video IDs for history entries...\n')

  // Get all history entries without videoId
  const entries = await db.select()
    .from(djHistory)
    .where(isNull(djHistory.videoId))

  console.log(`Found ${entries.length} entries without videoId\n`)

  let updated = 0
  let failed = 0

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    console.log(`[${i + 1}/${entries.length}] ${entry.djName} - ${entry.artist} - ${entry.title}`)

    const videoId = await searchYouTube(entry.artist, entry.title)

    if (videoId) {
      // Update database with videoId
      await db.update(djHistory)
        .set({
          videoId,
          updatedAt: new Date().toISOString()
        })
        .where(eq(djHistory.id, entry.id))
      updated++
    } else {
      failed++
    }

    // Wait between requests to avoid rate limiting
    if (i < entries.length - 1) {
      await delay(DELAY_MS)
    }
  }

  console.log(`\n🎉 Done!`)
  console.log(`  ✓ Updated: ${updated}`)
  console.log(`  ✗ Failed: ${failed}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(() => {
    sqlite.close()
  })
