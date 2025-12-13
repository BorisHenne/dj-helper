import { NextRequest, NextResponse } from 'next/server'
import { sanitizeString, containsInjection, MAX_STRING_LENGTH } from '@/lib/security'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface SearchResult {
  videoId: string
  title: string
  thumbnailUrl: string
}

/**
 * Search YouTube for a video by artist and title
 * Uses ytsr package (no API key required)
 */
async function searchYouTube(query: string): Promise<SearchResult | null> {
  try {
    // Dynamic import ytsr (CommonJS module)
    const ytsr = (await import('ytsr')).default

    const searchResults = await ytsr(query, {
      limit: 1,
      safeSearch: false,
    })

    // Find the first video result
    const video = searchResults.items.find((item: { type: string }) => item.type === 'video') as {
      type: string
      id: string
      title: string
      thumbnails: { url: string }[]
    } | undefined

    if (!video) {
      return null
    }

    return {
      videoId: video.id,
      title: video.title,
      thumbnailUrl: video.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
    }
  } catch (error) {
    console.error('ytsr search failed:', error)
    return null
  }
}

/**
 * Fallback: Search using Invidious API
 */
async function searchInvidious(query: string): Promise<SearchResult | null> {
  const instances = [
    'https://invidious.fdn.fr',
    'https://invidious.privacydev.net',
    'https://vid.puffyan.us',
  ]

  for (const instance of instances) {
    try {
      const response = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
        {
          signal: AbortSignal.timeout(5000),
          headers: { 'Accept': 'application/json' }
        }
      )

      if (!response.ok) continue

      const results = await response.json()
      if (results && results.length > 0) {
        const video = results[0]
        return {
          videoId: video.videoId,
          title: video.title,
          thumbnailUrl: `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`,
        }
      }
    } catch {
      // Try next instance
      continue
    }
  }

  return null
}

// GET - Search YouTube for a video
export async function GET(request: NextRequest) {
  try {
    // Sanitize query parameters
    const rawArtist = request.nextUrl.searchParams.get('artist')
    const rawTitle = request.nextUrl.searchParams.get('title')
    const rawQuery = request.nextUrl.searchParams.get('q')

    const artist = sanitizeString(rawArtist, MAX_STRING_LENGTH.searchQuery)
    const title = sanitizeString(rawTitle, MAX_STRING_LENGTH.searchQuery)
    const query = sanitizeString(rawQuery, MAX_STRING_LENGTH.searchQuery)

    const searchQuery = query || `${artist || ''} ${title || ''}`.trim()

    if (!searchQuery) {
      return NextResponse.json(
        { error: 'Search query is required (provide artist+title or q parameter)' },
        { status: 400 }
      )
    }

    // Check for injection attempts in search query
    if (containsInjection(searchQuery)) {
      return NextResponse.json(
        { error: 'Invalid search query' },
        { status: 400 }
      )
    }

    // Try ytsr first
    let result = await searchYouTube(searchQuery)

    // Fallback to Invidious if ytsr fails
    if (!result) {
      result = await searchInvidious(searchQuery)
    }

    if (!result) {
      return NextResponse.json(
        { error: 'No video found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error searching YouTube:', error)
    return NextResponse.json(
      { error: 'Failed to search YouTube' },
      { status: 500 }
    )
  }
}
