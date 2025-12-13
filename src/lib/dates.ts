/**
 * Utilitaires pour la gestion des dates et jours ouvrables
 */

// Variable globale pour le mode debug
let mockDate: Date | null = null

/**
 * Définit une date simulée pour les tests (mode debug)
 */
export function setMockDate(date: Date | null): void {
  mockDate = date
}

/**
 * Retourne la date simulée si définie, sinon null
 */
export function getMockDate(): Date | null {
  return mockDate
}

/**
 * Vérifie si une date est un jour ouvrable (lundi à vendredi)
 */
export function isBusinessDay(date: Date): boolean {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

/**
 * Retourne le prochain jour ouvrable à partir d'une date
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
  const today = mockDate ? new Date(mockDate) : new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Retourne l'heure actuelle (ou heure simulée en mode debug)
 */
export function getCurrentHour(): number {
  if (mockDate) {
    return mockDate.getHours()
  }
  return new Date().getHours()
}

/**
 * Retourne les minutes actuelles
 */
export function getCurrentMinutes(): number {
  if (mockDate) {
    return mockDate.getMinutes()
  }
  return new Date().getMinutes()
}

/**
 * Vérifie si on est dans la fenêtre d'enregistrement (10h00 - 11h00)
 */
export function isInRegistrationWindow(): boolean {
  const hour = getCurrentHour()
  return hour >= 10 && hour < 11
}

/**
 * Retourne le temps restant avant la fermeture de la fenêtre (en minutes)
 * Retourne -1 si la fenêtre est fermée
 */
export function getRegistrationWindowTimeLeft(): number {
  const hour = getCurrentHour()
  const minutes = getCurrentMinutes()
  
  if (hour < 10) {
    return -1 // Pas encore ouvert
  }
  if (hour >= 11) {
    return -1 // Déjà fermé
  }
  
  // Entre 10h et 11h: calculer le temps restant
  return 60 - minutes
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
