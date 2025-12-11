import { NextResponse } from 'next/server'
import { generateTemplate } from '@/lib/excel'

// GET - Télécharge un template Excel
export async function GET() {
  try {
    const buffer = generateTemplate()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="dj-template.xlsx"',
      },
    })
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 })
  }
}
