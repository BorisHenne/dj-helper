import { NextRequest, NextResponse } from 'next/server'
import { db, dailySessions } from '@/db'
import { eq } from 'drizzle-orm'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// POST - Marquer une session comme annulée (skipped)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { reason } = body

    // Vérifier que la session existe
    const [existing] = await db.select()
      .from(dailySessions)
      .where(eq(dailySessions.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    // Mettre à jour la session comme annulée
    const [session] = await db.update(dailySessions)
      .set({
        status: 'skipped',
        skipReason: reason?.trim() || 'Daily annulée',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(dailySessions.id, id))
      .returning()

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error skipping session:', error)
    return NextResponse.json({ error: 'Failed to skip session' }, { status: 500 })
  }
}
