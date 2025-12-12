import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getNextBusinessDay, getTodayMidnight, isBusinessDay } from '@/lib/dates'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// GET - Récupère la prochaine session planifiée
export async function GET() {
  try {
    const today = getTodayMidnight()
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    // D'abord vérifier s'il y a une session aujourd'hui non complétée
    const todaySession = await prisma.dailySession.findFirst({
      where: {
        date: {
          gte: today,
          lte: todayEnd
        },
        status: { not: 'completed' }
      }
    })

    if (todaySession && isBusinessDay(today)) {
      return NextResponse.json({
        session: todaySession,
        isToday: true,
        nextBusinessDay: today.toISOString()
      })
    }

    // Sinon chercher la prochaine session à venir
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const nextSession = await prisma.dailySession.findFirst({
      where: {
        date: {
          gte: tomorrow
        },
        status: { not: 'skipped' }
      },
      orderBy: { date: 'asc' }
    })

    const nextBusinessDay = getNextBusinessDay(today, true)

    return NextResponse.json({
      session: nextSession,
      isToday: false,
      nextBusinessDay: nextBusinessDay.toISOString()
    })
  } catch (error) {
    console.error('Error fetching next session:', error)
    return NextResponse.json({ error: 'Failed to fetch next session' }, { status: 500 })
  }
}
