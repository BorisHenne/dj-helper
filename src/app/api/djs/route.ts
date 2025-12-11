import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRandomColor, getRandomEmoji } from '@/lib/probability'

// GET - Liste tous les DJs
export async function GET() {
  try {
    const djs = await prisma.dJ.findMany({
      orderBy: { name: 'asc' },
      include: {
        plays: {
          orderBy: { playedAt: 'desc' },
          take: 5,
        },
      },
    })

    return NextResponse.json(djs)
  } catch (error) {
    console.error('Error fetching DJs:', error)
    return NextResponse.json({ error: 'Failed to fetch DJs' }, { status: 500 })
  }
}

// POST - Créer un nouveau DJ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, avatar, color, totalPlays, lastPlayedAt } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Vérifier si le DJ existe déjà
    const existing = await prisma.dJ.findUnique({
      where: { name: name.trim() },
    })

    if (existing) {
      return NextResponse.json({ error: 'DJ already exists' }, { status: 409 })
    }

    const dj = await prisma.dJ.create({
      data: {
        name: name.trim(),
        avatar: avatar || getRandomEmoji(),
        color: color || getRandomColor(),
        totalPlays: totalPlays || 0,
        lastPlayedAt: lastPlayedAt ? new Date(lastPlayedAt) : null,
      },
    })

    return NextResponse.json(dj, { status: 201 })
  } catch (error) {
    console.error('Error creating DJ:', error)
    return NextResponse.json({ error: 'Failed to create DJ' }, { status: 500 })
  }
}
