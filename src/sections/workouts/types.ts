import type { SessionEquipmentAssignment } from '../../types'

export type AssignmentFormValue = {
  itemKey?: string
  quantity?: number
}

export type SetFormValue = {
  reps: number
  weightKg?: number | null
  equipmentAssignments?: AssignmentFormValue[]
}

export type EntryFormValues = {
  exerciseId: string
  sets: SetFormValue[]
  notes?: string
}

export type TemplateFormValues = {
  name: string
  notes?: string
}

export type SessionFormValues = {
  date: string
  title: string
  notes?: string
}

export type EditableEntryFormValue = {
  id?: string
  exerciseId: string
  sets: SetFormValue[]
  notes?: string
}

export type EditSessionFormValues = SessionFormValues & {
  entries: EditableEntryFormValue[]
}

export type EditTemplateFormValues = {
  name: string
  notes?: string
  entries: EditableEntryFormValue[]
}

export type ScheduleFormValues = {
  date: string
}

export type EquipmentOptions = Array<{
  label: string
  options: Array<{ label: string; value: string }>
}>

export function isAssignmentFormValue(
  assignment: AssignmentFormValue | SessionEquipmentAssignment,
): assignment is AssignmentFormValue {
  return 'itemKey' in assignment
}
