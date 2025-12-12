import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq, isNull, or } from 'drizzle-orm'
import { djHistory } from '../src/db/schema'
import { join } from 'path'

// Path to SQLite database
const dbPath = join(__dirname, 'data', 'dj-rotation.db')
const sqlite = new Database(dbPath)
const db = drizzle(sqlite)

// Configuration
const DELAY_MS = 2000 // Delay between requests to avoid rate limiting
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 5000

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface YtsrVideo {
  type: string
  id: string
  title: string
  duration?: string
  views?: number
}

interface YtsrResult {
  items: YtsrVideo[]
}

async function searchYouTube(query: string, retries = 0): Promise<string | null> {
  try {
    // Dynamic import ytsr (CommonJS module)
    const ytsr = (await import('ytsr')).default

    console.log(`    Searching: "${query}"`)

    const searchResults = await ytsr(query, {
      limit: 5, // Get top 5 results for better matching
      safeSearch: false,
    }) as YtsrResult

    // Find the first video result (skip playlists, channels, etc.)
    const videos = searchResults.items.filter((item) => item.type === 'video')

    if (videos.length > 0) {
      const video = videos[0]
      console.log(`    ✓ Found: ${video.title} (${video.id})`)
      return video.id
    }

    console.log(`    ✗ No video found`)
    return null
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)

    // Retry on network errors
    if (retries < MAX_RETRIES && (errorMsg.includes('ENOTFOUND') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('EAI_AGAIN'))) {
      console.log(`    ⚠ Network error, retrying in ${RETRY_DELAY_MS / 1000}s... (${retries + 1}/${MAX_RETRIES})`)
      await delay(RETRY_DELAY_MS)
      return searchYouTube(query, retries + 1)
    }

    console.error(`    ✗ Search failed: ${errorMsg}`)
    return null
  }
}

async function main() {
  console.log('🎬 Fetching YouTube video IDs for history entries...')
  console.log('   Using ytsr library (no API key required)\n')

  // Get all history entries without videoId or with search URLs
  const entries = await db.select()
    .from(djHistory)
    .where(
      or(
        isNull(djHistory.videoId),
        eq(djHistory.videoId, '')
      )
    )

  const entriesNeedingUpdate = entries.filter(e =>
    !e.videoId && e.youtubeUrl?.includes('search_query')
  )

  console.log(`Found ${entriesNeedingUpdate.length} entries needing video IDs\n`)

  if (entriesNeedingUpdate.length === 0) {
    console.log('✅ All entries already have video IDs!')
    return
  }

  let updated = 0
  let failed = 0
  const failedEntries: string[] = []

  for (let i = 0; i < entriesNeedingUpdate.length; i++) {
    const entry = entriesNeedingUpdate[i]
    const progress = `[${i + 1}/${entriesNeedingUpdate.length}]`
    console.log(`${progress} ${entry.djName} - ${entry.artist} - ${entry.title}`)

    // Create search query
    const query = `${entry.artist} ${entry.title}`.trim()
    const videoId = await searchYouTube(query)

    if (videoId) {
      // Update database with videoId and proper YouTube URL
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`
      await db.update(djHistory)
        .set({
          videoId,
          youtubeUrl,
          updatedAt: new Date().toISOString()
        })
        .where(eq(djHistory.id, entry.id))
      updated++
      console.log(`    💾 Saved to database\n`)
    } else {
      failed++
      failedEntries.push(`${entry.artist} - ${entry.title}`)
      console.log('')
    }

    // Wait between requests to avoid rate limiting
    if (i < entriesNeedingUpdate.length - 1) {
      await delay(DELAY_MS)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 Done!')
  console.log(`  ✓ Updated: ${updated}`)
  console.log(`  ✗ Failed: ${failed}`)

  if (failedEntries.length > 0) {
    console.log('\n⚠️  Failed entries (manual search needed):')
    failedEntries.forEach(e => console.log(`   - ${e}`))
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(() => {
    sqlite.close()
  })
