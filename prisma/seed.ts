import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

// Load default DJs from JSON file
const defaultDJs = JSON.parse(
  readFileSync(join(__dirname, 'data', 'default-djs.json'), 'utf-8')
) as Array<{
  name: string
  totalPlays: number
  lastPlayedAt: string
  avatar: string
  color: string
}>

async function main() {
  console.log('Seeding database with default DJ statistics...')

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

    console.log(`  ✓ ${dj.name}: ${dj.totalPlays} passages, dernier: ${dj.lastPlayedAt}`)
  }

  console.log(`\nSeeded ${defaultDJs.length} DJs successfully!`)
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
