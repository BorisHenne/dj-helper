import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getRandomColor, getRandomEmoji } from '@/lib/probability'
import {
  validatePayloadSize,
  sanitizeString,
  containsInjection,
  MAX_PAYLOAD_SIZE,
  MAX_STRING_LENGTH,
} from '@/lib/security'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

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
    // Validate payload size
    const validation = await validatePayloadSize(request, MAX_PAYLOAD_SIZE.tiny)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const body = validation.body as Record<string, unknown>
    const rawName = body.name
    const rawAvatar = body.avatar
    const rawColor = body.color
    const totalPlays = body.totalPlays
    const lastPlayedAt = body.lastPlayedAt

    // Sanitize and validate name
    const name = sanitizeString(rawName, MAX_STRING_LENGTH.name)
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check for injection attempts
    if (containsInjection(name)) {
      return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 })
    }

    // Vérifier si le DJ existe déjà
    const existing = await prisma.dJ.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json({ error: 'DJ already exists' }, { status: 409 })
    }

    // Sanitize optional fields
    const avatar = sanitizeString(rawAvatar, 10) // Emoji max 10 chars
    const color = sanitizeString(rawColor, 20)   // Color code max 20 chars

    const dj = await prisma.dJ.create({
      data: {
        name,
        avatar: avatar || getRandomEmoji(),
        color: color || getRandomColor(),
        totalPlays: typeof totalPlays === 'number' ? Math.max(0, Math.floor(totalPlays)) : 0,
        lastPlayedAt: lastPlayedAt && typeof lastPlayedAt === 'string' ? new Date(lastPlayedAt) : null,
      },
    })

    return NextResponse.json(dj, { status: 201 })
  } catch (error) {
    console.error('Error creating DJ:', error)
    return NextResponse.json({ error: 'Failed to create DJ' }, { status: 500 })
  }
}
