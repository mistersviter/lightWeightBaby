import { useMemo } from 'react'
import { today } from '../constants'
import { useAppStore } from '../store/appStore'
import { addDays, startOfDay, toDateInput } from '../utils'

export function useDashboardData() {
  const data = useAppStore((state) => state.data)
  const anchorDate = useAppStore((state) => state.anchorDate)
  const calendarMode = useAppStore((state) => state.calendarMode)

  const activeUser = useMemo(
    () => data.users.find((user) => user.id === data.activeUserId) ?? null,
    [data.activeUserId, data.users],
  )

  const recentSessions = useMemo(
    () => [...data.sessions].sort((left, right) => right.date.localeCompare(left.date)),
    [data.sessions],
  )

  const recentMeasurements = useMemo(
    () =>
      [...data.measurements].sort((left, right) => right.date.localeCompare(left.date)),
    [data.measurements],
  )

  const recentSprints = useMemo(
    () =>
      [...data.sprints].sort((left, right) =>
        right.startDate.localeCompare(left.startDate),
      ),
    [data.sprints],
  )

  const nextSprint = recentSprints[0] ?? null

  const sessionsThisWeek = useMemo(() => {
    const start = startOfDay(addDays(new Date(), -6)).getTime()
    const end = startOfDay(new Date()).getTime()

    return data.sessions.filter((session) => {
      const time = startOfDay(new Date(session.date)).getTime()
      return time >= start && time <= end
    }).length
  }, [data.sessions])

  const calendarDays = useMemo(() => {
    const base = startOfDay(new Date(anchorDate))
    if (calendarMode === 'day') {
      return [toDateInput(base)]
    }
    if (calendarMode === 'week') {
      const day = base.getDay()
      const offset = day === 0 ? -6 : 1 - day
      return Array.from({ length: 7 }, (_, index) =>
        toDateInput(addDays(base, offset + index)),
      )
    }

    const monthStart = new Date(base.getFullYear(), base.getMonth(), 1)
    const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0)
    return Array.from({ length: monthEnd.getDate() }, (_, index) =>
      toDateInput(new Date(monthStart.getFullYear(), monthStart.getMonth(), index + 1)),
    )
  }, [anchorDate, calendarMode])

  const equipmentOptions = useMemo(
    () => [
      {
        label: 'Компоненты',
        options: data.equipment.map((item) => ({
          label: item.name,
          value: item.id,
        })),
      },
      {
        label: 'Сохраненные снаряды',
        options: data.dumbbellAssemblies.map((assembly) => ({
          label: `${assembly.name} · ${assembly.totalWeightKg} кг`,
          value: assembly.id,
        })),
      },
    ],
    [data.dumbbellAssemblies, data.equipment],
  )

  const exerciseOptions = useMemo(
    () =>
      data.exercises.map((exercise) => ({
        label: exercise.name,
        value: exercise.id,
      })),
    [data.exercises],
  )

  const dumbbellAssemblyOptions = useMemo(
    () =>
      data.dumbbellAssemblies.map((assembly) => ({
        label: `${assembly.name} · ${assembly.totalWeightKg} кг`,
        value: assembly.id,
      })),
    [data.dumbbellAssemblies],
  )

  return {
    activeUser,
    recentSessions,
    recentMeasurements,
    recentSprints,
    nextSprint,
    sessionsThisWeek,
    calendarDays,
    equipmentOptions,
    exerciseOptions,
    dumbbellAssemblyOptions,
    today,
  }
}
