import { useMemo } from 'react'
import { today } from '../constants'
import { useAppStore } from '../store/appStore'
import type { EquipmentItem } from '../types'
import { addDays, parseDateInput, startOfDay, toDateInput } from '../utils'

function isAssignableEquipment(item: EquipmentItem) {
  return item.kind !== 'plate' && item.kind !== 'handle' && item.kind !== 'lock'
}

function isSupportEquipment(item: EquipmentItem) {
  return (
    item.kind === 'bench' ||
    item.kind === 'pullup_bar' ||
    item.kind === 'dip_bars' ||
    item.kind === 'rack' ||
    item.kind === 'accessory_other'
  )
}

function isLoadEquipment(item: EquipmentItem) {
  return (
    item.kind === 'barbell_bar' ||
    item.kind === 'kettlebell' ||
    item.kind === 'machine' ||
    item.kind === 'cable_station' ||
    item.kind === 'band'
  )
}

function formatAssignableEquipmentLabel(item: EquipmentItem) {
  if (
    (item.kind === 'kettlebell' || item.kind === 'barbell_bar') &&
    item.weightKg !== null &&
    item.weightKg !== undefined
  ) {
    return `${item.name} · ${item.weightKg} кг`
  }

  return item.name
}

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
    () => [...data.measurements].sort((left, right) => right.date.localeCompare(left.date)),
    [data.measurements],
  )

  const recentSprints = useMemo(
    () =>
      [...data.sprints].sort((left, right) => right.startDate.localeCompare(left.startDate)),
    [data.sprints],
  )

  const nextSprint = recentSprints[0] ?? null

  const recentWorkoutTemplates = useMemo(
    () =>
      [...data.workoutTemplates].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt),
      ),
    [data.workoutTemplates],
  )

  const sessionsThisWeek = useMemo(() => {
    const start = startOfDay(addDays(new Date(), -6)).getTime()
    const end = startOfDay(new Date()).getTime()

    return data.sessions.filter((session) => {
      const time = startOfDay(parseDateInput(session.date)).getTime()
      return time >= start && time <= end
    }).length
  }, [data.sessions])

  const todayDate = toDateInput(new Date())

  const todaySessions = useMemo(
    () => data.sessions.filter((session) => session.date === todayDate),
    [data.sessions, todayDate],
  )

  const todayScheduledWorkouts = useMemo(
    () => data.scheduledWorkouts.filter((item) => item.date === todayDate),
    [data.scheduledWorkouts, todayDate],
  )

  const calendarDays = useMemo(() => {
    const base = startOfDay(parseDateInput(anchorDate))
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
        label: assembly.name,
        value: assembly.id,
      })),
    [data.dumbbellAssemblies],
  )

  const actualEquipmentOptions = useMemo(() => {
    const assignableEquipment = data.equipment.filter(isAssignableEquipment)

    return [
      {
        label: 'Опорное оборудование',
        options: assignableEquipment.filter(isSupportEquipment).map((item) => ({
          label: formatAssignableEquipmentLabel(item),
          value: `equipment:${item.id}`,
        })),
      },
      {
        label: 'Нагрузка и тренажеры',
        options: assignableEquipment.filter(isLoadEquipment).map((item) => ({
          label: formatAssignableEquipmentLabel(item),
          value: `equipment:${item.id}`,
        })),
      },
      {
        label: 'Сохраненные снаряды',
        options: data.dumbbellAssemblies.map((assembly) => ({
          label: assembly.name,
          value: `assembly:${assembly.id}`,
        })),
      },
    ].filter((group) => group.options.length > 0)
  }, [data.dumbbellAssemblies, data.equipment])

  const workoutTemplateOptions = useMemo(
    () =>
      data.workoutTemplates.map((template) => ({
        label: template.name,
        value: template.id,
      })),
    [data.workoutTemplates],
  )

  return {
    activeUser,
    recentSessions,
    recentWorkoutTemplates,
    recentMeasurements,
    recentSprints,
    nextSprint,
    sessionsThisWeek,
    todayDate,
    todaySessions,
    todayScheduledWorkouts,
    calendarDays,
    actualEquipmentOptions,
    exerciseOptions,
    dumbbellAssemblyOptions,
    workoutTemplateOptions,
    today,
  }
}
