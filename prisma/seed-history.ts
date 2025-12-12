import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Génère un CUID simple
function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}

// Génère une URL de recherche YouTube
function generateYoutubeUrl(artist: string, title: string): string {
  const query = encodeURIComponent(`${artist} ${title}`)
  return `https://www.youtube.com/results?search_query=${query}`
}

// Données de l'historique DJ
const historyData = [
  { date: '2025-09-16', dj: 'T. Rhyman', artist: 'Silky Roads', title: 'How It Feels' },
  { date: '2025-09-17', dj: 'H. Faria', artist: 'The Score', title: 'Unstoppable' },
  { date: '2025-09-18', dj: 'V. Ordinario', artist: 'Lit', title: 'My Own Worst Enemy' },
  { date: '2025-09-19', dj: 'G. Luchmun', artist: 'Slipknot', title: 'Duality' },
  { date: '2025-09-25', dj: 'N. Whewell', artist: 'Jimmy Hendrix', title: 'Foxy Lady' },
  { date: '2025-09-26', dj: 'T. Maurel', artist: 'Bleu Jeans Bleu', title: 'Petit Pudding, avec le Parasukov Quartet' },
  { date: '2025-09-29', dj: 'M.Ladit', artist: 'Chuck berry', title: 'You can never tell' },
  { date: '2025-09-30', dj: 'A. Gautier', artist: 'Five Finger Death Punch', title: 'Jekyll and Hyde' },
  { date: '2025-10-01', dj: 'B. Henne', artist: 'Jon Lord', title: 'Bach Onto This' },
  { date: '2025-10-02', dj: 'I. Digumber', artist: 'King Julian', title: 'I like to move it' },
  { date: '2025-10-03', dj: 'C. Hubert', artist: 'The Dramatics', title: 'Whatcha See Is Whatcha Get' },
  { date: '2025-10-06', dj: 'T. Rhyman', artist: '(510) Apocalypse', title: 'Cigarettes After Sex' },
  { date: '2025-10-07', dj: 'O. Ngabi', artist: 'x', title: 'One Piece' },
  { date: '2025-10-08', dj: 'T. Maurel', artist: 'Beastie Boys', title: 'Fight for Your Right' },
  { date: '2025-10-09', dj: 'S. Mooken', artist: 'Toto', title: 'Hold the Line' },
  { date: '2025-10-10', dj: 'V. Ordinario', artist: 'Ednaswap', title: 'Torn' },
  { date: '2025-10-13', dj: 'V. Ordinario', artist: 'Shaggy', title: 'Angel' },
  { date: '2025-10-14', dj: 'N. Whewell', artist: 'Otis Redding', title: 'Hard To Handle' },
  { date: '2025-10-15', dj: 'B. Henne', artist: 'Sword Art Online', title: 'Swordland' },
  { date: '2025-10-16', dj: 'O. Ngabi', artist: 'Omah Lay', title: 'soso' },
  { date: '2025-10-17', dj: 'V. Ordinario', artist: 'Third Eye Blind', title: "How's It Going To Be" },
  { date: '2025-10-20', dj: 'M.Ladit', artist: 'Simon and Garfunke', title: 'The Concert Central Park' },
  { date: '2025-10-21', dj: 'S. Mooken', artist: 'Stardust', title: 'Music Sounds Better With You' },
  { date: '2025-10-22', dj: 'G. Luchmun', artist: 'skillet', title: 'Hero' },
  { date: '2025-10-27', dj: 'T. Rhyman', artist: 'Smallpool', title: 'Dreaming' },
  { date: '2025-10-28', dj: 'T. Marrot', artist: 'Nina Hagen Band', title: 'Naturträne' },
  { date: '2025-10-29', dj: 'K. Tang Sak Yuk', artist: 'Peggy Lee', title: 'Fever' },
  { date: '2025-10-30', dj: 'G. Luchmun', artist: 'Shinedown', title: 'MONSTERS' },
  { date: '2025-10-31', dj: 'O. Ngabi', artist: 'anjabi MC', title: 'Mundian To Bach Ke (Beware Of The Boys)' },
  { date: '2025-11-03', dj: 'H. Faria', artist: 'Strange Talk', title: 'Young Hearts' },
  { date: '2025-11-04', dj: 'A. Gautier', artist: 'Falling in reverse', title: 'Voices in my head' },
  { date: '2025-11-05', dj: 'N. Whewell', artist: 'Pink Floyd', title: 'Money' },
  { date: '2025-11-06', dj: 'G. Luchmun', artist: 'Architects', title: 'Animals' },
  { date: '2025-11-07', dj: 'C. Hubert', artist: 'France Joli', title: '"Come To Me" 1979' },
  { date: '2025-11-10', dj: 'B. Henne', artist: 'Marilyn Manson', title: 'The Fight Song' },
  { date: '2025-11-12', dj: 'S. Mooken', artist: 'Linkin Park', title: 'Faint' },
  { date: '2025-11-13', dj: 'T. Marrot', artist: 'Mahito Yokota', title: 'Gusty Garden (theme from Super Mario Galaxy)' },
  { date: '2025-11-14', dj: 'V. Ordinario', artist: 'The Tokens', title: 'The Lion Sleeps Tonight (Wimoweh)' },
  { date: '2025-11-17', dj: 'A. Cenita', artist: 'Lithium', title: 'Evanescence' },
  { date: '2025-11-18', dj: 'T. Rhyman', artist: 'The Neighbourhood', title: 'Sweater Weather' },
  { date: '2025-11-19', dj: 'H. Faria', artist: 'The Script', title: "the man who can't be moved" },
  { date: '2025-11-20', dj: 'B. Henne', artist: 'Pink floyd', title: 'Echoes by Vkgoeswild' },
  { date: '2025-11-21', dj: 'K. Tang Sak Yuk', artist: 'Rammstein', title: 'Ohne Dich' },
  { date: '2025-11-24', dj: 'N. Whewell', artist: 'Joe JACKSON', title: "Steppin' Out" },
  { date: '2025-11-25', dj: 'V. Tomasso', artist: 'Charlie Parker', title: 'Moose The Mooche' },
  { date: '2025-11-26', dj: 'A. Cenita', artist: 'Somnus', title: 'Yoko Shimomura (Final Fantasy 15)' },
  { date: '2025-11-27', dj: 'T. Maurel', artist: 'Nada Surf', title: 'Popular' },
  { date: '2025-11-28', dj: 'N. Whewell', artist: 'Killing Joke', title: 'Love Like Blood' },
  { date: '2025-12-01', dj: 'B. Henne', artist: 'Nina Simone', title: 'Feeling Good (Official Video)' },
  { date: '2025-12-02', dj: 'S. Mooken', artist: 'Scorpions', title: 'Wind Of Change (Official Music Video)' },
  { date: '2025-12-03', dj: 'V. Ordinario', artist: 'Oasis', title: 'Wonderwall' },
  { date: '2025-12-04', dj: 'G. Luchmun', artist: 'Julien Lamassonne', title: 'Un monde sans danger' },
  { date: '2025-12-05', dj: 'V. Ordinario', artist: 'Nathan Evans', title: 'Wellerman (Sea Shanty)' },
  { date: '2025-12-08', dj: 'A. Gautier', artist: 'Marina Kaye', title: 'Homeless' },
  { date: '2025-12-09', dj: 'T. Rhyman', artist: 'Татьяна Куртукова', title: 'Матушка Земля, белая берёзонька' },
  { date: '2025-12-10', dj: 'V. Ordinario', artist: 'P.O.D', title: 'Youth of the Nation' },
  { date: '2025-12-11', dj: 'K. Tang Sak Yuk', artist: 'André Cavalcante', title: 'Oceans' },
]

async function main() {
  console.log('🎵 Début du seeding de l\'historique DJ...')

  // Vérifier les entrées existantes
  const existingCount = await prisma.dJHistory.count()
  console.log(`📊 Entrées existantes dans la base: ${existingCount}`)

  let created = 0
  let skipped = 0

  for (const entry of historyData) {
    // Vérifier si l'entrée existe déjà (même date et même DJ)
    const existing = await prisma.dJHistory.findFirst({
      where: {
        djName: entry.dj,
        playedAt: new Date(entry.date),
      },
    })

    if (existing) {
      console.log(`⏭️  Skip: ${entry.date} - ${entry.dj} (existe déjà)`)
      skipped++
      continue
    }

    await prisma.dJHistory.create({
      data: {
        id: generateCuid(),
        djName: entry.dj,
        title: entry.title,
        artist: entry.artist,
        youtubeUrl: generateYoutubeUrl(entry.artist, entry.title),
        playedAt: new Date(entry.date),
      },
    })

    console.log(`✅ Créé: ${entry.date} - ${entry.dj} - ${entry.artist} - ${entry.title}`)
    created++
  }

  console.log('\n📈 Résumé:')
  console.log(`   - Entrées créées: ${created}`)
  console.log(`   - Entrées ignorées: ${skipped}`)
  console.log(`   - Total dans la base: ${await prisma.dJHistory.count()}`)
  console.log('\n🎉 Seeding terminé!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
