import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Emojis for DJs
const EMOJIS = ['🎵', '🎤', '🎧', '🎸', '🎹', '🥁', '🎺', '🎻', '🎷', '🪗', '🎼', '🎶', '🔊', '🎙️', '🪘', '💿']

// Colors for DJs (matching the gradient colors from the image)
const COLORS = [
  '#22c55e', // green
  '#84cc16', // lime
  '#eab308', // yellow
  '#f97316', // orange
  '#ef4444', // red
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
]

// Default DJ statistics from the provided data
const defaultDJs = [
  { name: 'I. Digumber', totalPlays: 1, lastPlayedAt: '2025-10-02' },
  { name: 'O. Ngabi', totalPlays: 3, lastPlayedAt: '2025-10-31' },
  { name: 'A. Gautier', totalPlays: 2, lastPlayedAt: '2025-11-04' },
  { name: 'C. Hubert', totalPlays: 2, lastPlayedAt: '2025-11-07' },
  { name: 'T. Marrot', totalPlays: 2, lastPlayedAt: '2025-11-13' },
  { name: 'H. Faria', totalPlays: 3, lastPlayedAt: '2025-11-19' },
  { name: 'V. Tomasso', totalPlays: 1, lastPlayedAt: '2025-11-25' },
  { name: 'A. Cenita', totalPlays: 2, lastPlayedAt: '2025-11-26' },
  { name: 'T. Maurel', totalPlays: 3, lastPlayedAt: '2025-11-27' },
  { name: 'N. Whewell', totalPlays: 5, lastPlayedAt: '2025-11-28' },
  { name: 'S. Mooken', totalPlays: 4, lastPlayedAt: '2025-12-02' },
  { name: 'B. Henne', totalPlays: 5, lastPlayedAt: '2025-12-01' },
  { name: 'G. Luchmun', totalPlays: 5, lastPlayedAt: '2025-12-04' },
  { name: 'T. Rhyman', totalPlays: 5, lastPlayedAt: '2025-12-09' },
  { name: 'K. Tang Sak Yuk', totalPlays: 3, lastPlayedAt: '2025-12-11' },
  { name: 'V. Ordinario', totalPlays: 8, lastPlayedAt: '2025-12-10' },
]

async function main() {
  console.log('Seeding database with default DJ statistics...')

  for (let i = 0; i < defaultDJs.length; i++) {
    const dj = defaultDJs[i]
    const emoji = EMOJIS[i % EMOJIS.length]
    const color = COLORS[i % COLORS.length]

    await prisma.dJ.upsert({
      where: { name: dj.name },
      update: {
        totalPlays: dj.totalPlays,
        lastPlayedAt: new Date(dj.lastPlayedAt),
      },
      create: {
        name: dj.name,
        avatar: emoji,
        color: color,
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
