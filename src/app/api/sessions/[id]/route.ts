import { NextRequest, NextResponse } from 'next/server'
import { db, dailySessions, djHistory } from '@/db'
import { eq } from 'drizzle-orm'
import { parseDateISO } from '@/lib/dates'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// GET - Récupérer une session par ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [session] = await db.select()
      .from(dailySessions)
      .where(eq(dailySessions.id, id))
      .limit(1)

    if (!session) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

// PATCH - Mettre à jour une session
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { djId, djName, status, youtubeUrl, videoId, title, artist, skipReason, date } = body

    // Vérifier que la session existe
    const [existing] = await db.select()
      .from(dailySessions)
      .where(eq(dailySessions.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    // Construire les données de mise à jour
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }

    if (djId !== undefined) updateData.djId = djId
    if (djName !== undefined) updateData.djName = djName.trim()
    if (status !== undefined) {
      if (!['pending', 'completed', 'skipped'].includes(status)) {
        return NextResponse.json({ error: 'Status invalide' }, { status: 400 })
      }
      updateData.status = status
    }
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl?.trim() || null
    if (videoId !== undefined) updateData.videoId = videoId
    if (title !== undefined) updateData.title = title?.trim() || null
    if (artist !== undefined) updateData.artist = artist?.trim() || null
    if (skipReason !== undefined) updateData.skipReason = skipReason?.trim() || null
    if (date !== undefined) updateData.date = parseDateISO(date).toISOString()

    const [session] = await db.update(dailySessions)
      .set(updateData)
      .where(eq(dailySessions.id, id))
      .returning()

    // Si la session est marquée comme complétée avec un lien YouTube,
    // créer aussi une entrée dans l'historique
    if (status === 'completed' && youtubeUrl && title && artist) {
      await db.insert(djHistory).values({
        djName: session.djName,
        title: title.trim(),
        artist: artist.trim(),
        youtubeUrl: youtubeUrl.trim(),
        videoId: videoId || null,
        playedAt: session.date
      })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

// DELETE - Supprimer une session
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier que la session existe
    const [existing] = await db.select()
      .from(dailySessions)
      .where(eq(dailySessions.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    await db.delete(dailySessions).where(eq(dailySessions.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
