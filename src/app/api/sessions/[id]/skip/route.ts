import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    const existing = await prisma.dailySession.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 })
    }

    // Mettre à jour la session comme annulée
    const session = await prisma.dailySession.update({
      where: { id },
      data: {
        status: 'skipped',
        skipReason: reason?.trim() || 'Daily annulée'
      }
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error skipping session:', error)
    return NextResponse.json({ error: 'Failed to skip session' }, { status: 500 })
  }
}
