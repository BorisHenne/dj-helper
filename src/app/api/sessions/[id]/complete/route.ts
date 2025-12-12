import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractVideoId } from '@/lib/youtube'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// POST - Marquer une session comme complétée avec le lien YouTube
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { youtubeUrl, title, artist } = body

    // Validation
    if (!youtubeUrl?.trim()) {
      return NextResponse.json({ error: 'Le lien YouTube est requis' }, { status: 400 })
    }

    // Validation du lien YouTube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
    if (!youtubeRegex.test(youtubeUrl)) {
      return NextResponse.json({ error: 'Le lien YouTube n\'est pas valide' }, { status: 400 })
    }

    // Vérifier que la session existe
    const existing = await prisma.dailySession.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    // Extraire l'ID de la vidéo YouTube
    const videoId = extractVideoId(youtubeUrl)

    // Mettre à jour la session
    const session = await prisma.dailySession.update({
      where: { id },
      data: {
        status: 'completed',
        youtubeUrl: youtubeUrl.trim(),
        videoId: videoId || null,
        title: title?.trim() || null,
        artist: artist?.trim() || null
      }
    })

    // Créer aussi une entrée dans l'historique si on a les infos
    if (title && artist) {
      await prisma.dJHistory.create({
        data: {
          djName: session.djName,
          title: title.trim(),
          artist: artist.trim(),
          youtubeUrl: youtubeUrl.trim(),
          videoId: videoId || null,
          playedAt: session.date
        }
      })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error completing session:', error)
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 })
  }
}
