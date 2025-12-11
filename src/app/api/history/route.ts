import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Génère un CUID simple
function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}

// GET - Liste tout l'historique (ordonné par date décroissante)
export async function GET() {
  try {
    const history = await prisma.dJHistory.findMany({
      orderBy: { playedAt: 'desc' },
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching DJ history:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}

// POST - Créer une nouvelle entrée d'historique
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { djName, title, artist, youtubeUrl, playedAt } = body

    // Validation
    if (!djName?.trim()) {
      return NextResponse.json({ error: 'Le nom du DJ est requis' }, { status: 400 })
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })
    }
    if (!artist?.trim()) {
      return NextResponse.json({ error: "L'artiste est requis" }, { status: 400 })
    }
    if (!youtubeUrl?.trim()) {
      return NextResponse.json({ error: 'Le lien YouTube est requis' }, { status: 400 })
    }

    // Validation du lien YouTube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    if (!youtubeRegex.test(youtubeUrl)) {
      return NextResponse.json({ error: 'Le lien YouTube n\'est pas valide' }, { status: 400 })
    }

    const entry = await prisma.dJHistory.create({
      data: {
        id: generateCuid(),
        djName: djName.trim(),
        title: title.trim(),
        artist: artist.trim(),
        youtubeUrl: youtubeUrl.trim(),
        playedAt: playedAt ? new Date(playedAt) : new Date(),
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating history entry:', error)
    return NextResponse.json({ error: 'Failed to create history entry' }, { status: 500 })
  }
}
