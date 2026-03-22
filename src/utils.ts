import type {
  MeasurementRecord,
  ScheduledWorkout,
  Sprint,
  WorkoutSession,
} from './types'

export function parseDateInput(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export function createId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now()}-${random}`
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parseDateInput(date))
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  }).format(parseDateInput(date))
}

export function formatWeekday(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
  }).format(parseDateInput(date))
}

export function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function toDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isTodayDateInput(date: string) {
  return date === toDateInput(new Date())
}

export function isWeekendDateInput(date: string) {
  const day = parseDateInput(date).getDay()
  return day === 0 || day === 6
}

export function getSessionsForDay(sessions: WorkoutSession[], date: string) {
  return sessions.filter((session) => session.date === date)
}

export function getMeasurementsForDay(
  measurements: MeasurementRecord[],
  date: string,
) {
  return measurements.filter((measurement) => measurement.date === date)
}

export function getScheduledWorkoutsForDay(
  scheduledWorkouts: ScheduledWorkout[],
  date: string,
) {
  return scheduledWorkouts.filter((item) => item.date === date)
}

export function getSprintEndDate(sprint: Sprint) {
  return addDays(parseDateInput(sprint.startDate), sprint.durationDays - 1)
}

export function getSprintProgress(sprint: Sprint, today: Date) {
  const start = startOfDay(parseDateInput(sprint.startDate)).getTime()
  const end = startOfDay(getSprintEndDate(sprint)).getTime()
  const now = startOfDay(today).getTime()

  if (now <= start) {
    return 0
  }

  if (now >= end) {
    return 100
  }

  return Math.round(((now - start) / (end - start)) * 100)
}

export function getSprintSnapshot(
  sprint: Sprint,
  sessions: WorkoutSession[],
  measurements: MeasurementRecord[],
) {
  const start = startOfDay(parseDateInput(sprint.startDate)).getTime()
  const end = startOfDay(getSprintEndDate(sprint)).getTime()

  const sprintSessions = sessions.filter((session) => {
    const time = startOfDay(parseDateInput(session.date)).getTime()
    return time >= start && time <= end
  })

  const sprintMeasurements = measurements
    .filter((measurement) => {
      const time = startOfDay(parseDateInput(measurement.date)).getTime()
      return time >= start && time <= end
    })
    .sort((left, right) => left.date.localeCompare(right.date))

  const first = sprintMeasurements[0]
  const last = sprintMeasurements[sprintMeasurements.length - 1]

  return {
    workouts: sprintSessions.length,
    totalSets: sprintSessions.reduce(
      (sum, session) =>
        sum +
        session.entries.reduce(
          (entrySum, entry) => entrySum + entry.sets.length,
          0,
        ),
      0,
    ),
    weightDelta:
      first && last ? Number((last.bodyWeight - first.bodyWeight).toFixed(1)) : 0,
    measurementCount: sprintMeasurements.length,
  }
}
