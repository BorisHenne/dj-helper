import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseExcelFile } from '@/lib/excel'
import { getRandomColor, getRandomEmoji } from '@/lib/probability'

// POST - Import des DJs depuis un fichier Excel
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const importedDJs = parseExcelFile(buffer)

    if (importedDJs.length === 0) {
      return NextResponse.json({ error: 'No valid DJs found in file' }, { status: 400 })
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    }

    for (const djData of importedDJs) {
      try {
        // Vérifier si le DJ existe déjà
        const existing = await prisma.dJ.findUnique({
          where: { name: djData.name },
        })

        if (existing) {
          // Mettre à jour si les données sont différentes
          await prisma.dJ.update({
            where: { id: existing.id },
            data: {
              totalPlays: djData.totalPlays || existing.totalPlays,
              lastPlayedAt: djData.lastPlayedAt || existing.lastPlayedAt,
            },
          })
          results.updated++
        } else {
          // Créer un nouveau DJ
          await prisma.dJ.create({
            data: {
              name: djData.name,
              avatar: djData.avatar || getRandomEmoji(),
              color: djData.color || getRandomColor(),
              totalPlays: djData.totalPlays,
              lastPlayedAt: djData.lastPlayedAt,
            },
          })
          results.created++
        }
      } catch (err) {
        results.errors.push(`Failed to import ${djData.name}: ${err}`)
        results.skipped++
      }
    }

    return NextResponse.json({
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      ...results,
    })
  } catch (error) {
    console.error('Error importing DJs:', error)
    return NextResponse.json({ error: 'Failed to import file' }, { status: 500 })
  }
}
