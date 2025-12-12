import { NextResponse } from 'next/server'
import { db, djHistory } from '@/db'
import { desc } from 'drizzle-orm'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// GET - Récupérer la dernière entrée d'historique
export async function GET() {
  try {
    const [latest] = await db.select()
      .from(djHistory)
      .orderBy(desc(djHistory.playedAt))
      .limit(1)

    if (!latest) {
      return NextResponse.json(null)
    }

    return NextResponse.json(latest)
  } catch (error) {
    console.error('Error fetching latest history:', error)
    return NextResponse.json({ error: 'Failed to fetch latest history' }, { status: 500 })
  }
}
