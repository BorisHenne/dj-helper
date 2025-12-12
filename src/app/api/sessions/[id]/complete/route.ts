import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractVideoId, fetchYouTubeInfo } from '@/lib/youtube'

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
    const { youtubeUrl } = body
    let { title, artist } = body

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

    // Si title ou artist manquent, essayer de récupérer les infos YouTube
    if ((!title || !artist) && videoId) {
      try {
        const videoInfo = await fetchYouTubeInfo(youtubeUrl)
        if (videoInfo) {
          title = title || videoInfo.title
          artist = artist || videoInfo.artist
        }
      } catch (e) {
        console.error('Failed to fetch video info:', e)
      }
    }

    // Fallback values
    const finalTitle = title?.trim() || 'Blindtest'
    const finalArtist = artist?.trim() || existing.djName

    // Mettre à jour la session
    const session = await prisma.dailySession.update({
      where: { id },
      data: {
        status: 'completed',
        youtubeUrl: youtubeUrl.trim(),
        videoId: videoId || null,
        title: finalTitle,
        artist: finalArtist
      }
    })

    // Toujours créer une entrée dans l'historique
    await prisma.dJHistory.create({
      data: {
        djName: session.djName,
        title: finalTitle,
        artist: finalArtist,
        youtubeUrl: youtubeUrl.trim(),
        videoId: videoId || null,
        playedAt: session.date
      }
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error completing session:', error)
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 })
  }
}
