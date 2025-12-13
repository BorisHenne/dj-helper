import { NextRequest, NextResponse } from 'next/server'
import { db, settings } from '@/db'
import { eq } from 'drizzle-orm'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// GET - Récupère les settings
export async function GET() {
  try {
    let [settingsRow] = await db.select()
      .from(settings)
      .where(eq(settings.id, 'default'))
      .limit(1)

    if (!settingsRow) {
      const [created] = await db.insert(settings)
        .values({ id: 'default' })
        .returning()
      settingsRow = created
    }

    return NextResponse.json(settingsRow)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PATCH - Met à jour les settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { weightLastPlayed, weightTotalPlays } = body

    const updateData: Record<string, number> = {}

    if (weightLastPlayed !== undefined) {
      updateData.weightLastPlayed = Math.max(0, Math.min(1, weightLastPlayed))
    }
    if (weightTotalPlays !== undefined) {
      updateData.weightTotalPlays = Math.max(0, Math.min(1, weightTotalPlays))
    }

    // Upsert: try to update, if not found, insert
    const [existing] = await db.select()
      .from(settings)
      .where(eq(settings.id, 'default'))
      .limit(1)

    let settingsRow
    if (existing) {
      const [updated] = await db.update(settings)
        .set(updateData)
        .where(eq(settings.id, 'default'))
        .returning()
      settingsRow = updated
    } else {
      const [created] = await db.insert(settings)
        .values({ id: 'default', ...updateData })
        .returning()
      settingsRow = created
    }

    return NextResponse.json(settingsRow)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
