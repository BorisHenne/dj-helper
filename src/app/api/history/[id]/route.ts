import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupérer une entrée spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const entry = await prisma.dJHistory.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entrée non trouvée' }, { status: 404 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error fetching history entry:', error)
    return NextResponse.json({ error: 'Failed to fetch history entry' }, { status: 500 })
  }
}

// PATCH - Mettre à jour une entrée
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { djName, title, artist, youtubeUrl, playedAt } = body

    // Vérifier que l'entrée existe
    const existing = await prisma.dJHistory.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Entrée non trouvée' }, { status: 404 })
    }

    // Validation du lien YouTube si fourni
    if (youtubeUrl) {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
      if (!youtubeRegex.test(youtubeUrl)) {
        return NextResponse.json({ error: 'Le lien YouTube n\'est pas valide' }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (djName !== undefined) updateData.djName = djName.trim()
    if (title !== undefined) updateData.title = title.trim()
    if (artist !== undefined) updateData.artist = artist.trim()
    if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl.trim()
    if (playedAt !== undefined) updateData.playedAt = new Date(playedAt)

    const entry = await prisma.dJHistory.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error updating history entry:', error)
    return NextResponse.json({ error: 'Failed to update history entry' }, { status: 500 })
  }
}

// DELETE - Supprimer une entrée
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier que l'entrée existe
    const existing = await prisma.dJHistory.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Entrée non trouvée' }, { status: 404 })
    }

    await prisma.dJHistory.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Entrée supprimée avec succès' })
  } catch (error) {
    console.error('Error deleting history entry:', error)
    return NextResponse.json({ error: 'Failed to delete history entry' }, { status: 500 })
  }
}
