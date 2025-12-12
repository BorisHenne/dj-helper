import { NextResponse } from 'next/server'
import { db, dailySessions, djs } from '@/db'
import { eq } from 'drizzle-orm'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// POST - Reset toutes les sessions et recréer l'état initial
export async function POST() {
  try {
    // Supprimer toutes les sessions existantes
    const deleted = await db.delete(dailySessions).returning()
    console.log(`Deleted ${deleted.length} sessions`)

    // Trouver A. Gautier
    const [gautierDj] = await db.select()
      .from(djs)
      .where(eq(djs.name, 'A. Gautier'))
      .limit(1)

    if (!gautierDj) {
      return NextResponse.json({
        error: 'A. Gautier DJ not found',
        deleted: deleted.length
      }, { status: 404 })
    }

    // Créer la session du 12/12/2025 (annulée)
    const [skippedSession] = await db.insert(dailySessions).values({
      date: new Date('2025-12-12T00:00:00.000Z'),
      djId: null,
      djName: 'A. Gautier',
      status: 'skipped',
      skipReason: 'Daily annulée'
    }).returning()

    // Créer la session du 15/12/2025 (A. Gautier en pending)
    const [nextSession] = await db.insert(dailySessions).values({
      date: new Date('2025-12-15T00:00:00.000Z'),
      djId: gautierDj.id,
      djName: gautierDj.name,
      status: 'pending'
    }).returning()

    return NextResponse.json({
      success: true,
      deleted: deleted.length,
      created: [
        { date: '2025-12-12', status: 'skipped', djName: skippedSession.djName },
        { date: '2025-12-15', status: 'pending', djName: nextSession.djName }
      ]
    })
  } catch (error) {
    console.error('Error resetting sessions:', error)
    return NextResponse.json({ error: 'Failed to reset sessions' }, { status: 500 })
  }
}
