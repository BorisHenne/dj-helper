import { NextRequest, NextResponse } from 'next/server'
import { db, djs, plays } from '@/db'
import { eq, desc } from 'drizzle-orm'

// GET - Récupère un DJ par ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const dj = await db.query.djs.findFirst({
      where: eq(djs.id, id),
      with: {
        plays: {
          orderBy: [desc(plays.playedAt)],
        },
      },
    })

    if (!dj) {
      return NextResponse.json({ error: 'DJ not found' }, { status: 404 })
    }

    return NextResponse.json(dj)
  } catch (error) {
    console.error('Error fetching DJ:', error)
    return NextResponse.json({ error: 'Failed to fetch DJ' }, { status: 500 })
  }
}

// PATCH - Met à jour un DJ
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, avatar, color, isActive, totalPlays, lastPlayedAt } = body

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }

    if (name !== undefined) updateData.name = name.trim()
    if (avatar !== undefined) updateData.avatar = avatar
    if (color !== undefined) updateData.color = color
    if (isActive !== undefined) updateData.isActive = isActive
    if (totalPlays !== undefined) updateData.totalPlays = totalPlays
    if (lastPlayedAt !== undefined) {
      updateData.lastPlayedAt = lastPlayedAt ? new Date(lastPlayedAt).toISOString() : null
    }

    const [dj] = await db.update(djs)
      .set(updateData)
      .where(eq(djs.id, id))
      .returning()

    if (!dj) {
      return NextResponse.json({ error: 'DJ not found' }, { status: 404 })
    }

    return NextResponse.json(dj)
  } catch (error) {
    console.error('Error updating DJ:', error)
    return NextResponse.json({ error: 'Failed to update DJ' }, { status: 500 })
  }
}

// DELETE - Supprime un DJ
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await db.delete(djs).where(eq(djs.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting DJ:', error)
    return NextResponse.json({ error: 'Failed to delete DJ' }, { status: 500 })
  }
}
