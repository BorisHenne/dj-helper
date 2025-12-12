import { NextRequest, NextResponse } from 'next/server'
import { db, djHistory } from '@/db'
import { desc } from 'drizzle-orm'
import { createId } from '@paralleldrive/cuid2'
import {
  validatePayloadSize,
  sanitizeString,
  validateYouTubeUrl,
  containsInjection,
  MAX_PAYLOAD_SIZE,
  MAX_STRING_LENGTH,
} from '@/lib/security'

// Force dynamic rendering (database access)
export const dynamic = 'force-dynamic'

// GET - Liste tout l'historique (ordonné par date décroissante)
export async function GET() {
  try {
    const history = await db.select()
      .from(djHistory)
      .orderBy(desc(djHistory.playedAt))
      .limit(500) // Limit to prevent memory issues

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching DJ history:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}

// POST - Créer une nouvelle entrée d'historique
export async function POST(request: NextRequest) {
  try {
    // Validate payload size
    const validation = await validatePayloadSize(request, MAX_PAYLOAD_SIZE.default)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const body = validation.body as Record<string, unknown>

    // Sanitize all inputs
    const djName = sanitizeString(body.djName, MAX_STRING_LENGTH.name)
    const title = sanitizeString(body.title, MAX_STRING_LENGTH.name)
    const artist = sanitizeString(body.artist, MAX_STRING_LENGTH.name)
    const playedAt = body.playedAt

    // Validation
    if (!djName) {
      return NextResponse.json({ error: 'Le nom du DJ est requis' }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })
    }
    if (!artist) {
      return NextResponse.json({ error: "L'artiste est requis" }, { status: 400 })
    }

    // Check for injection attempts
    if (containsInjection(djName) || containsInjection(title) || containsInjection(artist)) {
      return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 })
    }

    // Validate YouTube URL
    const urlValidation = validateYouTubeUrl(body.youtubeUrl)
    if (!urlValidation.valid) {
      return NextResponse.json({ error: urlValidation.error || 'Le lien YouTube n\'est pas valide' }, { status: 400 })
    }

    const [entry] = await db.insert(djHistory).values({
      id: createId(),
      djName,
      title,
      artist,
      youtubeUrl: urlValidation.url!,
      playedAt: playedAt && typeof playedAt === 'string' ? new Date(playedAt) : new Date(),
    }).returning()

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating history entry:', error)
    return NextResponse.json({ error: 'Failed to create history entry' }, { status: 500 })
  }
}
