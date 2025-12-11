import * as XLSX from 'xlsx'
import { getRandomColor, getRandomEmoji } from './probability'

export interface ImportedDJ {
  name: string
  totalPlays: number
  lastPlayedAt: Date | null
  avatar: string
  color: string
}

// Mapping des noms de colonnes possibles
const NAME_COLUMNS = ['name', 'nom', 'dj', 'participant', 'joueur']
const COUNT_COLUMNS = ['count', 'nombre', 'passages', 'total', 'plays', 'nombre de passages']
const DATE_COLUMNS = ['last djed', 'last played', 'dernier passage', 'date', 'last', 'dernier']

/**
 * Parse un fichier Excel et extrait les données des DJs
 * Supporte deux formats :
 * 1. Colonnes nommées : Name, Count, Last Djed (ton format actuel)
 * 2. Colonnes positionnelles : A=Nom, B=Count, C=Date
 */
export function parseExcelFile(buffer: ArrayBuffer): ImportedDJ[] {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

  // Prendre la première feuille
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  // D'abord essayer avec les colonnes nommées
  const namedData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

  if (namedData.length > 0 && hasNamedColumns(namedData[0])) {
    return parseNamedColumns(namedData)
  }

  // Sinon utiliser le format positionnel
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 })
  return parsePositionalColumns(data)
}

function hasNamedColumns(row: Record<string, unknown>): boolean {
  const keys = Object.keys(row).map(k => k.toLowerCase())
  return keys.some(k => NAME_COLUMNS.includes(k))
}

function parseNamedColumns(data: Record<string, unknown>[]): ImportedDJ[] {
  const djs: ImportedDJ[] = []

  for (const row of data) {
    const keys = Object.keys(row)

    // Trouver la colonne du nom
    const nameKey = keys.find(k => NAME_COLUMNS.includes(k.toLowerCase()))
    if (!nameKey || !row[nameKey]) continue

    const name = String(row[nameKey]).trim()
    if (!name) continue

    // Trouver la colonne du count
    const countKey = keys.find(k => COUNT_COLUMNS.includes(k.toLowerCase()))
    const totalPlays = countKey ? parseInt(String(row[countKey]), 10) || 0 : 0

    // Trouver la colonne de la date
    const dateKey = keys.find(k => DATE_COLUMNS.includes(k.toLowerCase()))
    const lastPlayedAt = dateKey ? parseDate(row[dateKey]) : null

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

function parsePositionalColumns(data: unknown[]): ImportedDJ[] {
  // Skip la première ligne si c'est un header
  const startRow = isHeaderRow(data[0] as unknown[]) ? 1 : 0
  const djs: ImportedDJ[] = []

  for (let i = startRow; i < data.length; i++) {
    const row = data[i] as unknown[]
    if (!row || !row[0]) continue

    const name = String(row[0]).trim()
    if (!name) continue

    const totalPlays = row[1] ? parseInt(String(row[1]), 10) || 0 : 0
    const lastPlayedAt = row[2] ? parseDate(row[2]) : null

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

function parseDate(value: unknown): Date | null {
  if (!value) return null

  if (value instanceof Date) {
    return value
  }

  const str = String(value).trim()
  if (!str) return null

  // Format YYYY-MM-DD (ton format)
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const date = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]))
    if (!isNaN(date.getTime())) return date
  }

  // Format DD/MM/YYYY
  const frMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (frMatch) {
    const date = new Date(parseInt(frMatch[3]), parseInt(frMatch[2]) - 1, parseInt(frMatch[1]))
    if (!isNaN(date.getTime())) return date
  }

  // Fallback: essayer le parsing natif
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) return parsed

  return null
}

function isHeaderRow(row: unknown[]): boolean {
  if (!row || !row[0]) return false
  const firstCell = String(row[0]).toLowerCase()
  return NAME_COLUMNS.includes(firstCell)
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
