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

  // Seed DJs
  console.log('📀 Seeding DJs...')
  for (const dj of defaultDJs) {
    await prisma.dJ.upsert({
      where: { name: dj.name },
      update: {
        totalPlays: dj.totalPlays,
        lastPlayedAt: new Date(dj.lastPlayedAt),
      },
      create: {
        name: dj.name,
        avatar: dj.avatar,
        color: dj.color,
        totalPlays: dj.totalPlays,
        lastPlayedAt: new Date(dj.lastPlayedAt),
        isActive: true,
      },
    })
    console.log(`  ✓ ${dj.name}: ${dj.totalPlays} passages`)
  }
  console.log(`\n✅ ${defaultDJs.length} DJs seeded!\n`)

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
