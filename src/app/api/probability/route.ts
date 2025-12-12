import { NextRequest, NextResponse } from 'next/server'
import { db, djs, settings, djHistory } from '@/db'
import { eq, notInArray, sql } from 'drizzle-orm'
import { calculateProbabilities, selectDJByProbability } from '@/lib/probability'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// GET - Calcule les probabilités pour tous les DJs actifs
export async function GET() {
  try {
    const allDjs = await db.select().from(djs).where(eq(djs.isActive, true))

    // Count history entries for each DJ by name
    const historyCounts = await db
      .select({
        djName: djHistory.djName,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(djHistory)
      .groupBy(djHistory.djName)

    const historyCountMap = new Map(
      historyCounts.map(h => [h.djName, h.count])
    )

    // Override totalPlays with history count
    const djsWithHistoryCount = allDjs.map(dj => ({
      ...dj,
      totalPlays: historyCountMap.get(dj.name) || 0,
    }))

    const [settingsRow] = await db.select()
      .from(settings)
      .where(eq(settings.id, 'default'))
      .limit(1)

    const djsWithProbability = calculateProbabilities(djsWithHistoryCount, {
      weightLastPlayed: settingsRow?.weightLastPlayed ?? 0.6,
      weightTotalPlays: settingsRow?.weightTotalPlays ?? 0.4,
    })

    return NextResponse.json({
      djs: djsWithProbability,
      settings: {
        weightLastPlayed: settingsRow?.weightLastPlayed ?? 0.6,
        weightTotalPlays: settingsRow?.weightTotalPlays ?? 0.4,
      },
    })
  } catch (error) {
    console.error('Error calculating probabilities:', error)
    return NextResponse.json({ error: 'Failed to calculate probabilities' }, { status: 500 })
  }
}

// POST - Sélectionne un DJ basé sur les probabilités
export async function POST(request: NextRequest) {
  try {
    // Optionally exclude DJs (e.g., the current DJ and refused DJs)
    let excludeDjIds: string[] = []
    try {
      const body = await request.json()
      // Support both old single excludeDjId and new array excludeDjIds
      if (body.excludeDjIds && Array.isArray(body.excludeDjIds)) {
        excludeDjIds = body.excludeDjIds.filter((id: unknown) => typeof id === 'string' && id)
      } else if (body.excludeDjId) {
        excludeDjIds = [body.excludeDjId]
      }
    } catch {
      // No body or invalid JSON - that's fine, no exclusion
    }

    let query = db.select().from(djs).where(eq(djs.isActive, true))

    if (excludeDjIds.length > 0) {
      query = db.select().from(djs).where(
        sql`${djs.isActive} = 1 AND ${djs.id} NOT IN (${sql.raw(excludeDjIds.map(id => `'${id}'`).join(','))})`
      ) as typeof query
    }

    const allDjs = await query

    // Count history entries for each DJ by name
    const historyCounts = await db
      .select({
        djName: djHistory.djName,
        count: sql<number>`count(*)`.as('count'),
      })
      .from(djHistory)
      .groupBy(djHistory.djName)

    const historyCountMap = new Map(
      historyCounts.map(h => [h.djName, h.count])
    )

    // Override totalPlays with history count
    const djsWithHistoryCount = allDjs.map(dj => ({
      ...dj,
      totalPlays: historyCountMap.get(dj.name) || 0,
    }))

    const [settingsRow] = await db.select()
      .from(settings)
      .where(eq(settings.id, 'default'))
      .limit(1)

    const djsWithProbability = calculateProbabilities(djsWithHistoryCount, {
      weightLastPlayed: settingsRow?.weightLastPlayed ?? 0.6,
      weightTotalPlays: settingsRow?.weightTotalPlays ?? 0.4,
    })

    const selectedDJ = selectDJByProbability(djsWithProbability)

    if (!selectedDJ) {
      return NextResponse.json({ error: 'No active DJs available' }, { status: 404 })
    }

    return NextResponse.json({
      selected: selectedDJ,
      allProbabilities: djsWithProbability,
    })
  } catch (error) {
    console.error('Error selecting DJ:', error)
    return NextResponse.json({ error: 'Failed to select DJ' }, { status: 500 })
  }
}
