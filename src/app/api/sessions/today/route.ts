import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTodayMidnight, isBusinessDay, parseDateISO } from '@/lib/dates'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// GET - Récupère la session d'aujourd'hui (si c'est un jour ouvrable)
export async function GET(request: NextRequest) {
  try {
    // Support mock date for testing
    const mockDateParam = request.nextUrl.searchParams.get('mockDate')
    const today = mockDateParam ? parseDateISO(mockDateParam) : getTodayMidnight()

    // Si ce n'est pas un jour ouvrable, retourner null
    if (!isBusinessDay(today)) {
      return NextResponse.json({
        session: null,
        isBusinessDay: false,
        message: 'Pas de session le week-end'
      })
    }

    // Chercher la session d'aujourd'hui
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    const session = await prisma.dailySession.findFirst({
      where: {
        date: {
          gte: today,
          lte: todayEnd
        }
      }
    })

    return NextResponse.json({
      session,
      isBusinessDay: true,
      date: today.toISOString()
    })
  } catch (error) {
    console.error('Error fetching today\'s session:', error)
    return NextResponse.json({ error: 'Failed to fetch today\'s session' }, { status: 500 })
  }
}
