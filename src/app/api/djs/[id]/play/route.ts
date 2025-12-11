import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Enregistre qu'un DJ a joué
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { notes } = body

    // Vérifier que le DJ existe
    const dj = await prisma.dJ.findUnique({
      where: { id },
    })

    if (!dj) {
      return NextResponse.json({ error: 'DJ not found' }, { status: 404 })
    }

    const now = new Date()

    // Créer le play et mettre à jour le DJ en une transaction
    const [play, updatedDj] = await prisma.$transaction([
      prisma.play.create({
        data: {
          djId: id,
          playedAt: now,
          notes: notes || null,
        },
      }),
      prisma.dJ.update({
        where: { id },
        data: {
          totalPlays: { increment: 1 },
          lastPlayedAt: now,
        },
      }),
    ])

    // Mettre à jour les settings avec le dernier DJ sélectionné
    await prisma.settings.upsert({
      where: { id: 'default' },
      update: { lastSelectedDjId: id },
      create: { id: 'default', lastSelectedDjId: id },
    })

    return NextResponse.json({ play, dj: updatedDj })
  } catch (error) {
    console.error('Error recording play:', error)
    return NextResponse.json({ error: 'Failed to record play' }, { status: 500 })
  }
}
