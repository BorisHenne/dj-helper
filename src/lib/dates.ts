/**
 * Utilitaires pour la gestion des dates et jours ouvrables
 */

/**
 * Vérifie si une date est un jour ouvrable (lundi à vendredi)
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay()
  return day >= 1 && day <= 5 // Lundi = 1, Vendredi = 5
}

/**
 * Retourne le prochain jour ouvrable à partir d'une date
 * @param fromDate - Date de départ (par défaut: aujourd'hui)
 * @param skipToday - Si true, on commence à chercher à partir de demain
 */
export function getNextBusinessDay(fromDate: Date = new Date(), skipToday: boolean = true): Date {
  const date = new Date(fromDate)
  date.setHours(0, 0, 0, 0)

  if (skipToday) {
    date.setDate(date.getDate() + 1)
  }

  while (!isBusinessDay(date)) {
    date.setDate(date.getDate() + 1)
  }

  return date
}

/**
 * Retourne la date d'aujourd'hui à minuit
 */
export function getTodayMidnight(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Formate une date en format ISO sans heure (YYYY-MM-DD)
 */
export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Compare deux dates en ignorant l'heure
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDateISO(date1) === formatDateISO(date2)
}

/**
 * Parse une date ISO string en Date locale à minuit
 */
export function parseDateISO(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

/**
 * Retourne le nom du jour en français ou anglais
 */
export function getDayName(date: Date, locale: string = 'fr'): string {
  return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long' })
}

/**
 * Formate une date pour l'affichage
 */
export function formatDateDisplay(date: Date, locale: string = 'fr'): string {
  return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
