import { NextRequest, NextResponse } from 'next/server'
import { db, settings, dailySessions } from '@/db'
import { eq, and, gte, lte } from 'drizzle-orm'
import { 
  isInRegistrationWindow, 
  getRegistrationWindowTimeLeft, 
  formatDateISO, 
  getTodayMidnight,
  isBusinessDay,
  getCurrentHour,
  getCurrentMinutes
} from '@/lib/dates'

export const dynamic = 'force-dynamic'

export interface RegistrationStatus {
  isOpen: boolean
  isLocked: boolean
  canRegister: boolean
  timeLeftMinutes: number
  currentHour: number
  currentMinutes: number
  isBusinessDay: boolean
  messageKey: string
  nextOpenTimeKey: string
}

export async function GET(request: NextRequest): Promise<NextResponse<RegistrationStatus>> {
  try {
    const today = getTodayMidnight()
    const todayStr = formatDateISO(today)
    const isWorkDay = isBusinessDay(today)
    const windowOpen = isInRegistrationWindow()
    const timeLeft = getRegistrationWindowTimeLeft()
    const hour = getCurrentHour()
    const minutes = getCurrentMinutes()

    const [currentSettings] = await db.select().from(settings).where(eq(settings.id, 'default')).limit(1)
    const isLocked = currentSettings?.lastRegistrationDate === todayStr && currentSettings?.registrationLocked === true

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
      tomorrow.setDate(tomorrow.getDate() + 1)
    }
    const tomorrowStart = new Date(tomorrow)
    tomorrowStart.setHours(0, 0, 0, 0)
    const tomorrowEnd = new Date(tomorrow)
    tomorrowEnd.setHours(23, 59, 59, 999)

    const [existingSession] = await db.select()
      .from(dailySessions)
      .where(and(
        gte(dailySessions.date, tomorrowStart.toISOString()),
        lte(dailySessions.date, tomorrowEnd.toISOString()),
        eq(dailySessions.status, 'pending')
      ))
      .limit(1)

    const hasSessionForTomorrow = !!existingSession
    const canRegister = isWorkDay && windowOpen && !isLocked && !hasSessionForTomorrow

    let messageKey = ''
    let nextOpenTimeKey = 'registration.tomorrowAt10'

    if (!isWorkDay) {
      messageKey = 'registration.noWeekend'
      nextOpenTimeKey = 'registration.mondayAt10'
    } else if (isLocked) {
      messageKey = 'registration.alreadyRegistered'
    } else if (hasSessionForTomorrow) {
      messageKey = 'registration.sessionPlanned'
    } else if (hour < 10) {
      messageKey = 'registration.opensAt10'
      nextOpenTimeKey = 'registration.todayAt10'
    } else if (hour >= 11) {
      messageKey = 'registration.windowClosed'
    } else if (windowOpen) {
      messageKey = 'registration.activeWithTime'
    }

    return NextResponse.json({
      isOpen: windowOpen,
      isLocked,
      canRegister,
      timeLeftMinutes: timeLeft,
      currentHour: hour,
      currentMinutes: minutes,
      isBusinessDay: isWorkDay,
      messageKey,
      nextOpenTimeKey
    })
  } catch (error) {
    console.error('Error checking registration status:', error)
    return NextResponse.json({
      isOpen: false, isLocked: true, canRegister: false, timeLeftMinutes: -1,
      currentHour: 0, currentMinutes: 0, isBusinessDay: false,
      messageKey: 'registration.systemError', nextOpenTimeKey: ''
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const today = getTodayMidnight()
    const todayStr = formatDateISO(today)

    await db.insert(settings)
      .values({ id: 'default', lastRegistrationDate: todayStr, registrationLocked: true })
      .onConflictDoUpdate({
        target: settings.id,
        set: { lastRegistrationDate: todayStr, registrationLocked: true },
      })

    return NextResponse.json({ success: true, lockedUntil: todayStr })
  } catch (error) {
    console.error('Error locking registration:', error)
    return NextResponse.json({ error: 'Failed to lock registration' }, { status: 500 })
  }
}
