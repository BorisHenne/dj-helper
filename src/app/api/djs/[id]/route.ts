import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupère un DJ par ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const dj = await prisma.dJ.findUnique({
      where: { id },
      include: {
        plays: {
          orderBy: { playedAt: 'desc' },
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

    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name.trim()
    if (avatar !== undefined) updateData.avatar = avatar
    if (color !== undefined) updateData.color = color
    if (isActive !== undefined) updateData.isActive = isActive
    if (totalPlays !== undefined) updateData.totalPlays = totalPlays
    if (lastPlayedAt !== undefined) {
      updateData.lastPlayedAt = lastPlayedAt ? new Date(lastPlayedAt) : null
    }

    const dj = await prisma.dJ.update({
      where: { id },
      data: updateData,
    })

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
    await prisma.dJ.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting DJ:', error)
    return NextResponse.json({ error: 'Failed to delete DJ' }, { status: 500 })
  }
}
