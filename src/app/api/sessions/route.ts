import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getNextBusinessDay, formatDateISO, parseDateISO } from '@/lib/dates'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// Génère un CUID simple
function generateCuid(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${randomPart}`
}

// GET - Liste toutes les sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')

    const where = status ? { status } : {}

    const sessions = await prisma.dailySession.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit) : undefined,
    })

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
    const existing = await prisma.dailySession.findFirst({
      where: {
        date: {
          gte: new Date(sessionDate.setHours(0, 0, 0, 0)),
          lt: new Date(sessionDate.setHours(23, 59, 59, 999))
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Une session existe déjà pour cette date', session: existing },
        { status: 409 }
      )
    }

    // Créer la session
    const session = await prisma.dailySession.create({
      data: {
        id: generateCuid(),
        date: sessionDate,
        djId: djId || null,
        djName: djName.trim(),
        status: 'pending',
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
