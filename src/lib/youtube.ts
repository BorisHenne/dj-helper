/**
 * YouTube utility functions for extracting video information
 * Uses oEmbed API (no API key required)
 */

export interface YouTubeVideoInfo {
  title: string
  artist: string
  channelName: string
  thumbnailUrl: string
  videoId: string
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Just the video ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Parse video title to extract artist and song title
 * Common formats: "Artist - Title", "Artist | Title", "Title by Artist"
 */
function parseVideoTitle(rawTitle: string): { title: string; artist: string } {
  // Remove common suffixes like (Official Video), [Lyrics], etc.
  let cleanTitle = rawTitle
    .replace(/\s*[\(\[].*?(official|video|audio|lyrics|clip|hd|4k|remaster|live).*?[\)\]]\s*/gi, '')
    .replace(/\s*[\(\[].*?[\)\]]\s*$/, '') // Remove trailing parentheses content
    .trim()

  // Try different separators
  const separators = [' - ', ' – ', ' — ', ' | ', ' // ']

  for (const sep of separators) {
    if (cleanTitle.includes(sep)) {
      const parts = cleanTitle.split(sep)
      if (parts.length >= 2) {
        return {
          artist: parts[0].trim(),
          title: parts.slice(1).join(sep).trim(),
        }
      }
    }
  }

  // Try "Title by Artist" format
  const byMatch = cleanTitle.match(/^(.+?)\s+by\s+(.+)$/i)
  if (byMatch) {
    return {
      title: byMatch[1].trim(),
      artist: byMatch[2].trim(),
    }
  }

  // Fallback: use the whole title as title, empty artist
  return {
    title: cleanTitle,
    artist: '',
  }
}

/**
 * Fetch video information from YouTube using oEmbed API
 */
export async function fetchYouTubeInfo(url: string): Promise<YouTubeVideoInfo | null> {
  const videoId = extractVideoId(url)
  if (!videoId) return null

  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`

    const response = await fetch(oembedUrl)
    if (!response.ok) return null

    const data = await response.json()

    const { title, artist } = parseVideoTitle(data.title || '')

    return {
      title,
      artist: artist || data.author_name || '',
      channelName: data.author_name || '',
      thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      videoId,
    }
  } catch (error) {
    console.error('Error fetching YouTube info:', error)
    return null
  }
}
