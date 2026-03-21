import type { EquipmentKind } from './types'
import { toDateInput } from './utils'

export type CalendarMode = 'day' | 'week' | 'month'

export const today = new Date()
export const todayInput = toDateInput(today)

export const equipmentKindOptions: Array<{ value: EquipmentKind; label: string }> = [
  { value: 'plate', label: 'Блин' },
  { value: 'handle', label: 'Рукоятка' },
  { value: 'lock', label: 'Замок' },
  { value: 'weight', label: 'Свободный вес' },
  { value: 'machine', label: 'Тренажер' },
  { value: 'accessory', label: 'Аксессуар' },
]

export const calendarModeOptions: Array<{ label: string; value: CalendarMode }> = [
  { label: 'День', value: 'day' },
  { label: 'Неделя', value: 'week' },
  { label: 'Месяц', value: 'month' },
]

export const initialEntryForm = {
  exerciseId: '',
  sets: 3,
  reps: 10,
  weight: 0,
  notes: '',
}

export const defaultSessionFormValues = {
  date: todayInput,
  title: 'Силовая тренировка',
  notes: '',
}

export const defaultMeasurementFormValues = {
  date: todayInput,
}

export const defaultSprintFormValues = {
  startDate: todayInput,
  durationDays: 28,
}

export const defaultEquipmentFormValues = {
  kind: 'plate' as EquipmentKind,
  unit: 'кг',
  quantity: 1,
  weightKg: 1.25,
  thicknessMm: 20,
  diameterMm: 120,
  sleeveLengthMm: 160,
  gripLengthMm: 120,
  mountSizeMm: 30,
  increment: 2.5,
}
