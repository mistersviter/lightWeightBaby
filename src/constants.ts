import type { EquipmentKind, EquipmentRequirementCategory } from './types'
import { toDateInput } from './utils'

export type CalendarMode = 'day' | 'week' | 'month'

export const today = new Date()
export const todayInput = toDateInput(today)

export const equipmentKindOptions: Array<{
  label: string
  options: Array<{ value: EquipmentKind; label: string }>
}> = [
  {
    label: 'Компоненты для сборки',
    options: [
      { value: 'plate', label: 'Блин' },
      { value: 'handle', label: 'Рукоятка гантели' },
      { value: 'lock', label: 'Замок гантели' },
      { value: 'barbell_bar', label: 'Гриф' },
    ],
  },
  {
    label: 'Готовые снаряды и нагрузка',
    options: [
      { value: 'kettlebell', label: 'Гиря' },
      { value: 'machine', label: 'Тренажер' },
      { value: 'cable_station', label: 'Блочная станция' },
      { value: 'band', label: 'Резина / эспандер' },
    ],
  },
  {
    label: 'Опорное оборудование',
    options: [
      { value: 'bench', label: 'Скамья' },
      { value: 'pullup_bar', label: 'Турник' },
      { value: 'dip_bars', label: 'Брусья' },
      { value: 'rack', label: 'Стойки / рама' },
      { value: 'accessory_other', label: 'Другое оборудование' },
    ],
  },
]

export const equipmentRequirementCategoryOptions: Array<{
  label: string
  options: Array<{ value: EquipmentRequirementCategory; label: string }>
}> = [
  {
    label: 'Нагрузка',
    options: [
      { value: 'dumbbell', label: 'Гантель' },
      { value: 'barbell', label: 'Штанга' },
      { value: 'kettlebell', label: 'Гиря' },
      { value: 'machine', label: 'Тренажер' },
      { value: 'cable_station', label: 'Блочная станция' },
      { value: 'band', label: 'Резина / эспандер' },
    ],
  },
  {
    label: 'Опора и станция',
    options: [
      { value: 'bench', label: 'Скамья' },
      { value: 'pullup_bar', label: 'Турник' },
      { value: 'dip_bars', label: 'Брусья' },
      { value: 'rack', label: 'Стойки / рама' },
    ],
  },
  {
    label: 'Прочее',
    options: [
      { value: 'bodyweight', label: 'Собственный вес' },
      { value: 'other', label: 'Другое' },
    ],
  },
]

export const muscleGroupOptions: Array<{ value: string; label: string }> = [
  { value: 'Грудь', label: 'Грудь' },
  { value: 'Спина', label: 'Спина' },
  { value: 'Плечи', label: 'Плечи' },
  { value: 'Бицепс', label: 'Бицепс' },
  { value: 'Трицепс', label: 'Трицепс' },
  { value: 'Предплечья', label: 'Предплечья' },
  { value: 'Пресс', label: 'Пресс' },
  { value: 'Косые мышцы живота', label: 'Косые мышцы живота' },
  { value: 'Ягодицы', label: 'Ягодицы' },
  { value: 'Квадрицепсы', label: 'Квадрицепсы' },
  { value: 'Бицепс бедра', label: 'Бицепс бедра' },
  { value: 'Икры', label: 'Икры' },
  { value: 'Ноги', label: 'Ноги' },
  { value: 'Все тело', label: 'Все тело' },
]

export const calendarModeOptions: Array<{ label: string; value: CalendarMode }> = [
  { label: 'День', value: 'day' },
  { label: 'Неделя', value: 'week' },
  { label: 'Месяц', value: 'month' },
]

export const initialEntryForm = {
  exerciseId: '',
  sets: [{ reps: 10, weightKg: null, equipmentAssignments: [] }],
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
