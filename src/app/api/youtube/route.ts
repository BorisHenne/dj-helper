import { NextRequest, NextResponse } from 'next/server'
import { fetchYouTubeInfo } from '@/lib/youtube'

// GET - Fetch YouTube video info from URL
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    const info = await fetchYouTubeInfo(url)

    if (!info) {
      return NextResponse.json(
        { error: 'Could not fetch video information' },
        { status: 404 }
      )
    }

    return NextResponse.json(info)
  } catch (error) {
    console.error('Error fetching YouTube info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch YouTube info' },
      { status: 500 }
    )
  }
}
