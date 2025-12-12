import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// POST - Reset toutes les sessions et recréer l'état initial
export async function POST() {
  try {
    // Supprimer toutes les sessions existantes
    const deleted = await prisma.dailySession.deleteMany()
    console.log(`Deleted ${deleted.count} sessions`)

    // Trouver A. Gautier
    const gautierDj = await prisma.dJ.findUnique({
      where: { name: 'A. Gautier' }
    })

    if (!gautierDj) {
      return NextResponse.json({
        error: 'A. Gautier DJ not found',
        deleted: deleted.count
      }, { status: 404 })
    }

    // Créer la session du 12/12/2025 (annulée)
    const skippedSession = await prisma.dailySession.create({
      data: {
        date: new Date('2025-12-12T00:00:00.000Z'),
        djId: null,
        djName: 'A. Gautier',
        status: 'skipped',
        skipReason: 'Daily annulée'
      }
    })

    // Créer la session du 15/12/2025 (A. Gautier en pending)
    const nextSession = await prisma.dailySession.create({
      data: {
        date: new Date('2025-12-15T00:00:00.000Z'),
        djId: gautierDj.id,
        djName: gautierDj.name,
        status: 'pending'
      }
    })

    return NextResponse.json({
      success: true,
      deleted: deleted.count,
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
