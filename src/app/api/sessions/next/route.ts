import { NextRequest, NextResponse } from 'next/server'
import { db, dailySessions } from '@/db'
import { and, gte, lte, eq, asc } from 'drizzle-orm'
import { getNextBusinessDay, getTodayMidnight, isBusinessDay, parseDateISO } from '@/lib/dates'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// GET - Récupère la prochaine session planifiée
export async function GET(request: NextRequest) {
  try {
    // Support mock date for testing
    const mockDateParam = request.nextUrl.searchParams.get('mockDate')
    const today = mockDateParam ? parseDateISO(mockDateParam) : getTodayMidnight()
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    // D'abord vérifier s'il y a une session aujourd'hui en pending (pas completed, pas skipped)
    const [todaySession] = await db.select()
      .from(dailySessions)
      .where(and(
        gte(dailySessions.date, today.toISOString()),
        lte(dailySessions.date, todayEnd.toISOString()),
        eq(dailySessions.status, 'pending')
      ))
      .limit(1)

    // Toujours calculer le prochain jour ouvrable (après aujourd'hui)
    const nextBusinessDay = getNextBusinessDay(today, true)

    if (todaySession && isBusinessDay(today)) {
      return NextResponse.json({
        session: todaySession,
        isToday: true,
        nextBusinessDay: nextBusinessDay.toISOString()  // Toujours le PROCHAIN jour ouvrable
      })
    }

    // Sinon chercher la prochaine session à venir (demain ou après)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [nextSession] = await db.select()
      .from(dailySessions)
      .where(and(
        gte(dailySessions.date, tomorrow.toISOString()),
        eq(dailySessions.status, 'pending')
      ))
      .orderBy(asc(dailySessions.date))
      .limit(1)

    return NextResponse.json({
      session: nextSession || null,
      isToday: false,
      nextBusinessDay: nextBusinessDay.toISOString()
    })
  } catch (error) {
    console.error('Error fetching next session:', error)
    return NextResponse.json({ error: 'Failed to fetch next session' }, { status: 500 })
  }
}
