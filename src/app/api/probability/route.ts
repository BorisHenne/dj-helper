import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateProbabilities, selectDJByProbability } from '@/lib/probability'

// GET - Calcule les probabilités pour tous les DJs actifs
export async function GET() {
  try {
    const djs = await prisma.dJ.findMany({
      where: { isActive: true },
    })

    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })

    const djsWithProbability = calculateProbabilities(djs, {
      weightLastPlayed: settings?.weightLastPlayed ?? 0.6,
      weightTotalPlays: settings?.weightTotalPlays ?? 0.4,
    })

    return NextResponse.json({
      djs: djsWithProbability,
      settings: {
        weightLastPlayed: settings?.weightLastPlayed ?? 0.6,
        weightTotalPlays: settings?.weightTotalPlays ?? 0.4,
      },
    })
  } catch (error) {
    console.error('Error calculating probabilities:', error)
    return NextResponse.json({ error: 'Failed to calculate probabilities' }, { status: 500 })
  }
}

// POST - Sélectionne un DJ basé sur les probabilités
export async function POST() {
  try {
    const djs = await prisma.dJ.findMany({
      where: { isActive: true },
    })

    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })

    const djsWithProbability = calculateProbabilities(djs, {
      weightLastPlayed: settings?.weightLastPlayed ?? 0.6,
      weightTotalPlays: settings?.weightTotalPlays ?? 0.4,
    })

    const selectedDJ = selectDJByProbability(djsWithProbability)

    if (!selectedDJ) {
      return NextResponse.json({ error: 'No active DJs available' }, { status: 404 })
    }

    return NextResponse.json({
      selected: selectedDJ,
      allProbabilities: djsWithProbability,
    })
  } catch (error) {
    console.error('Error selecting DJ:', error)
    return NextResponse.json({ error: 'Failed to select DJ' }, { status: 500 })
  }
}
