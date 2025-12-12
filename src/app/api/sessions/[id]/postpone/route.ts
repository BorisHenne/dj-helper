import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getNextBusinessDay, parseDateISO } from '@/lib/dates'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// POST - Reporter une session au prochain jour ouvrable
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Support mock date for testing
    let mockDate: Date | null = null
    try {
      const body = await request.json()
      if (body.mockDate) {
        mockDate = parseDateISO(body.mockDate)
      }
    } catch {
      // No body or invalid JSON - that's fine
    }

    // Vérifier que la session existe
    const existing = await prisma.dailySession.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    if (existing.status !== 'pending') {
      return NextResponse.json({ error: 'Seule une session en attente peut être reportée' }, { status: 400 })
    }

    // Calculer le prochain jour ouvrable
    const baseDate = mockDate || existing.date
    const nextBusinessDay = getNextBusinessDay(baseDate, true)

    // Marquer la session actuelle comme skipped
    await prisma.dailySession.update({
      where: { id },
      data: {
        status: 'skipped',
        skipReason: 'Reporté'
      }
    })

    // Vérifier s'il existe déjà une session pour le prochain jour ouvrable
    const nextDayStart = new Date(nextBusinessDay)
    nextDayStart.setHours(0, 0, 0, 0)
    const nextDayEnd = new Date(nextBusinessDay)
    nextDayEnd.setHours(23, 59, 59, 999)

    const existingNextSession = await prisma.dailySession.findFirst({
      where: {
        date: {
          gte: nextDayStart,
          lte: nextDayEnd
        }
      }
    })

    let newSession
    if (existingNextSession) {
      // Mettre à jour la session existante avec le DJ reporté
      newSession = await prisma.dailySession.update({
        where: { id: existingNextSession.id },
        data: {
          djId: existing.djId,
          djName: existing.djName,
          status: 'pending'
        }
      })
    } else {
      // Créer une nouvelle session pour le prochain jour ouvrable avec le même DJ
      newSession = await prisma.dailySession.create({
        data: {
          date: nextBusinessDay,
          djId: existing.djId,
          djName: existing.djName,
          status: 'pending'
        }
      })
    }

    return NextResponse.json({
      postponedSession: existing,
      newSession: newSession,
      nextBusinessDay: nextBusinessDay.toISOString()
    })
  } catch (error) {
    console.error('Error postponing session:', error)
    return NextResponse.json({ error: 'Failed to postpone session' }, { status: 500 })
  }
}
