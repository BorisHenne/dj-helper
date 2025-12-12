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

export interface YouTubeSearchResult {
  videoId: string
  title: string
  channelName: string
  thumbnailUrl: string
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
 * Improved algorithm with more patterns and cleanup
 */
function parseVideoTitle(rawTitle: string, channelName?: string): { title: string; artist: string } {
  // Remove common video tags and suffixes
  let cleanTitle = rawTitle
    // Remove things in parentheses/brackets with common keywords
    .replace(/\s*[\(\[].*?(official|video|audio|lyrics|lyric|clip|hd|4k|1080p|720p|remaster|remastered|live|acoustic|remix|cover|version|edit|extended|music video|mv|pv|visualizer|visualiser).*?[\)\]]\s*/gi, '')
    // Remove year in parentheses like (2023)
    .replace(/\s*[\(\[]\d{4}[\)\]]\s*/g, '')
    // Remove ft./feat. at the end
    .replace(/\s*[\(\[]?(?:ft\.?|feat\.?|featuring)\s+[^\)\]]+[\)\]]?\s*$/gi, '')
    // Remove trailing parentheses/brackets content
    .replace(/\s*[\(\[].*?[\)\]]\s*$/g, '')
    // Remove quotes
    .replace(/[""'']/g, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    .trim()

  // Try different separators (order matters - try longer ones first)
  const separators = [' - ', ' – ', ' — ', ' | ', ' // ', ': ', ' : ']

  for (const sep of separators) {
    if (cleanTitle.includes(sep)) {
      const parts = cleanTitle.split(sep)
      if (parts.length >= 2) {
        // First part is usually artist, rest is title
        let artist = parts[0].trim()
        let title = parts.slice(1).join(sep).trim()

        // Clean up common prefixes from artist
        artist = artist.replace(/^(vevo|topic|official)\s*[-–—]?\s*/i, '').trim()

        // If title contains another separator, it might be "Artist - Song - Extra"
        // Keep only the song part
        for (const sep2 of separators) {
          if (title.includes(sep2)) {
            title = title.split(sep2)[0].trim()
            break
          }
        }

        return { artist, title }
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

  // Try to extract from channel name if it looks like an artist
  if (channelName) {
    const cleanChannel = channelName
      .replace(/\s*[-–—]\s*(topic|vevo|official|music)$/i, '')
      .replace(/\s+(vevo|official|music)$/i, '')
      .trim()

    // If channel name is not generic, use it as artist
    const genericChannels = ['youtube', 'music', 'video', 'official', 'vevo', 'topic']
    if (!genericChannels.some(g => cleanChannel.toLowerCase() === g)) {
      return {
        title: cleanTitle,
        artist: cleanChannel,
      }
    }
  }

  // Fallback: use the whole title as title, empty artist
  return {
    title: cleanTitle,
    artist: '',
  }
}

/**
 * Generate YouTube search URL for artist + title
 */
export function getYouTubeSearchUrl(artist: string, title: string): string {
  const query = `${artist} ${title}`.trim()
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
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
    const channelName = data.author_name || ''

    // Parse title with channel name for better artist detection
    const { title, artist } = parseVideoTitle(data.title || '', channelName)

    return {
      title,
      artist: artist || channelName,
      channelName,
      thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      videoId,
    }
  } catch (error) {
    console.error('Error fetching YouTube info:', error)
    return null
  }
}
