import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()

// Load default DJs from JSON file
const defaultDJs = JSON.parse(
  readFileSync(join(__dirname, 'seed-data', 'default-djs.json'), 'utf-8')
)

// Load default history from JSON file
const defaultHistory = JSON.parse(
  readFileSync(join(__dirname, 'seed-data', 'default-history.json'), 'utf-8')
)

// Generate a simple unique ID
function generateId() {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}

async function main() {
  console.log('🎵 Seeding database...\n')

  // Seed DJs (only create if doesn't exist - never overwrite user data)
  console.log('📀 Seeding DJs...')
  let djCreated = 0
  let djSkipped = 0

  for (const dj of defaultDJs) {
    const existing = await prisma.dJ.findUnique({
      where: { name: dj.name }
    })

    if (existing) {
      djSkipped++
      console.log(`  ⏭ ${dj.name}: already exists (skipped)`)
      continue
    }

    await prisma.dJ.create({
      data: {
        name: dj.name,
        avatar: dj.avatar,
        color: dj.color,
        totalPlays: dj.totalPlays,
        lastPlayedAt: new Date(dj.lastPlayedAt),
        isActive: true,
      },
    })
    console.log(`  ✓ ${dj.name}: created with ${dj.totalPlays} passages`)
    djCreated++
  }
  console.log(`\n✅ DJs: ${djCreated} created, ${djSkipped} skipped (already exist)\n`)

  // Seed History
  console.log('🎶 Seeding history...')

  // Check existing entries to avoid duplicates
  const existingHistory = await prisma.dJHistory.findMany({
    select: { djName: true, title: true, playedAt: true }
  })

  const existingKeys = new Set(
    existingHistory.map(h => `${h.djName}-${h.title}-${h.playedAt.toISOString().split('T')[0]}`)
  )

  let created = 0
  let skipped = 0

  for (const entry of defaultHistory) {
    const key = `${entry.djName}-${entry.title}-${entry.date}`

    if (existingKeys.has(key)) {
      skipped++
      continue
    }

    await prisma.dJHistory.create({
      data: {
        id: generateId(),
        djName: entry.djName,
        artist: entry.artist,
        title: entry.title,
        youtubeUrl: entry.youtubeUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(entry.artist + ' ' + entry.title)}`,
        playedAt: new Date(entry.date),
      },
    })
    console.log(`  ✓ ${entry.date}: ${entry.djName} - ${entry.artist} - ${entry.title}`)
    created++
  }

  console.log(`\n✅ History: ${created} created, ${skipped} skipped (already exist)`)

  // Seed initial daily sessions
  console.log('\n📅 Seeding daily sessions...')

  // Check if sessions already exist
  const existingSessions = await prisma.dailySession.findMany()

  if (existingSessions.length === 0) {
    // Find A. Gautier DJ
    const gautierDj = await prisma.dJ.findUnique({
      where: { name: 'A. Gautier' }
    })

    if (gautierDj) {
      // Create today's skipped session (12/12/2025)
      const today = new Date('2025-12-12T00:00:00.000Z')
      await prisma.dailySession.create({
        data: {
          id: generateId(),
          date: today,
          djId: null,
          djName: 'A. Gautier',
          status: 'skipped',
          skipReason: 'Daily annulée'
        }
      })
      console.log('  ✓ 2025-12-12: Session skipped (Daily annulée)')

      // Create next Monday's session with A. Gautier (15/12/2025)
      const nextMonday = new Date('2025-12-15T00:00:00.000Z')
      await prisma.dailySession.create({
        data: {
          id: generateId(),
          date: nextMonday,
          djId: gautierDj.id,
          djName: gautierDj.name,
          status: 'pending'
        }
      })
      console.log('  ✓ 2025-12-15: A. Gautier assigned for next Monday')
    } else {
      console.log('  ⚠ A. Gautier DJ not found, skipping session seeding')
    }
  } else {
    console.log(`  ⏭ ${existingSessions.length} sessions already exist (skipped)`)
  }

  console.log('\n🎉 Database seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
