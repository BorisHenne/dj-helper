import { NextRequest, NextResponse } from 'next/server'
import { db, djs, plays, settings } from '@/db'
import { eq, sql } from 'drizzle-orm'

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
    const dj = await db.query.djs.findFirst({
      where: eq(djs.id, id),
    })

    if (!dj) {
      return NextResponse.json({ error: 'DJ not found' }, { status: 404 })
    }

    const now = new Date()
    const nowISO = now.toISOString()

    // Créer le play et mettre à jour le DJ en une transaction
    const result = await db.transaction(async (tx) => {
      const [play] = await tx.insert(plays).values({
        djId: id,
        playedAt: nowISO,
        notes: notes || null,
      }).returning()

      const [updatedDj] = await tx.update(djs)
        .set({
          totalPlays: sql`${djs.totalPlays} + 1`,
          lastPlayedAt: nowISO,
          updatedAt: nowISO,
        })
        .where(eq(djs.id, id))
        .returning()

      return { play, updatedDj }
    })

    // Mettre à jour les settings avec le dernier DJ sélectionné
    await db.insert(settings)
      .values({ id: 'default', lastSelectedDjId: id })
      .onConflictDoUpdate({
        target: settings.id,
        set: { lastSelectedDjId: id },
      })

    return NextResponse.json({ play: result.play, dj: result.updatedDj })
  } catch (error) {
    console.error('Error recording play:', error)
    return NextResponse.json({ error: 'Failed to record play' }, { status: 500 })
  }
}
