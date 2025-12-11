import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Récupère les settings
export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })

    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 'default' },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PATCH - Met à jour les settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { weightLastPlayed, weightTotalPlays } = body

    const updateData: Record<string, number> = {}

    if (weightLastPlayed !== undefined) {
      updateData.weightLastPlayed = Math.max(0, Math.min(1, weightLastPlayed))
    }
    if (weightTotalPlays !== undefined) {
      updateData.weightTotalPlays = Math.max(0, Math.min(1, weightTotalPlays))
    }

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: { id: 'default', ...updateData },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
