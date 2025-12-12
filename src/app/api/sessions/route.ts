import { NextRequest, NextResponse } from 'next/server'
import { db, dailySessions } from '@/db'
import { eq, desc, and, gte, lt } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import { getNextBusinessDay, parseDateISO } from '@/lib/dates'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// GET - Liste toutes les sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')

    let query = db.select().from(dailySessions)

    if (status) {
      query = query.where(eq(dailySessions.status, status)) as typeof query
    }

    const sessions = await query
      .orderBy(desc(dailySessions.date))
      .limit(limit ? parseInt(limit) : 1000)

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

// POST - Créer une nouvelle session (pour le prochain jour ouvrable)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { djId, djName, date } = body

    // Validation
    if (!djName?.trim()) {
      return NextResponse.json({ error: 'Le nom du DJ est requis' }, { status: 400 })
    }

    // Date de la session (par défaut: prochain jour ouvrable)
    const sessionDate = date
      ? parseDateISO(date)
      : getNextBusinessDay()

    // Vérifier qu'une session n'existe pas déjà pour cette date
    const startOfDay = new Date(sessionDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(sessionDate)
    endOfDay.setHours(23, 59, 59, 999)

    const [existing] = await db.select()
      .from(dailySessions)
      .where(and(
        gte(dailySessions.date, startOfDay),
        lt(dailySessions.date, endOfDay)
      ))
      .limit(1)

    if (existing) {
      return NextResponse.json(
        { error: 'Une session existe déjà pour cette date', session: existing },
        { status: 409 }
      )
    }

    // Créer la session
    const [session] = await db.insert(dailySessions).values({
      id: createId(),
      date: sessionDate,
      djId: djId || null,
      djName: djName.trim(),
      status: 'pending',
    }).returning()

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
