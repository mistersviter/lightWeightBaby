import type {
  MeasurementRecord,
  ScheduledWorkout,
  Sprint,
  WorkoutSession,
} from './types'

export function createId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now()}-${random}`
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatShortDate(date: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(date))
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
  return date.toISOString().slice(0, 10)
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
  return addDays(new Date(sprint.startDate), sprint.durationDays - 1)
}

export function getSprintProgress(sprint: Sprint, today: Date) {
  const start = startOfDay(new Date(sprint.startDate)).getTime()
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
  const start = startOfDay(new Date(sprint.startDate)).getTime()
  const end = startOfDay(getSprintEndDate(sprint)).getTime()

  const sprintSessions = sessions.filter((session) => {
    const time = startOfDay(new Date(session.date)).getTime()
    return time >= start && time <= end
  })

  const sprintMeasurements = measurements
    .filter((measurement) => {
      const time = startOfDay(new Date(measurement.date)).getTime()
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
