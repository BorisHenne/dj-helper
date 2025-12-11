import * as XLSX from 'xlsx'
import { getRandomColor, getRandomEmoji } from './probability'

export interface ImportedDJ {
  name: string
  totalPlays: number
  lastPlayedAt: Date | null
  avatar: string
  color: string
}

/**
 * Parse un fichier Excel et extrait les données des DJs
 * Format attendu:
 * - Colonne A: Nom du DJ
 * - Colonne B: Nombre de passages (optionnel)
 * - Colonne C: Date du dernier passage (optionnel)
 */
export function parseExcelFile(buffer: ArrayBuffer): ImportedDJ[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

  // Prendre la première feuille
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // Convertir en JSON
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 })

  // Skip la première ligne si c'est un header
  const startRow = isHeaderRow(data[0] as unknown[]) ? 1 : 0

  const djs: ImportedDJ[] = []

  for (let i = startRow; i < data.length; i++) {
    const row = data[i] as unknown[]
    if (!row || !row[0]) continue

    const name = String(row[0]).trim()
    if (!name) continue

    const totalPlays = row[1] ? parseInt(String(row[1]), 10) || 0 : 0

    let lastPlayedAt: Date | null = null
    if (row[2]) {
      if (row[2] instanceof Date) {
        lastPlayedAt = row[2]
      } else {
        const parsed = new Date(String(row[2]))
        if (!isNaN(parsed.getTime())) {
          lastPlayedAt = parsed
        }
      }
    }

    djs.push({
      name,
      totalPlays,
      lastPlayedAt,
      avatar: getRandomEmoji(),
      color: getRandomColor(),
    })
  }

  return djs
}

function isHeaderRow(row: unknown[]): boolean {
  if (!row || !row[0]) return false
  const firstCell = String(row[0]).toLowerCase()
  return ['nom', 'name', 'dj', 'participant', 'joueur'].includes(firstCell)
}

/**
 * Génère un fichier Excel template
 */
export function generateTemplate(): ArrayBuffer {
  const data = [
    ['Nom', 'Nombre de passages', 'Dernier passage'],
    ['Alice', 5, '2024-01-15'],
    ['Bob', 3, '2024-02-20'],
    ['Charlie', 0, ''],
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'DJs')

  // Ajuster les largeurs de colonnes
  ws['!cols'] = [
    { wch: 20 }, // Nom
    { wch: 20 }, // Nombre de passages
    { wch: 20 }, // Dernier passage
  ]

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}
