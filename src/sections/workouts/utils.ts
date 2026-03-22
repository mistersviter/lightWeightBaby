import { equipmentRequirementCategoryOptions } from '../../constants'
import type {
  Exercise,
  SessionEntry,
  SessionEquipmentAssignment,
  SessionSet,
} from '../../types'
import type {
  AssignmentFormValue,
  EditableEntryFormValue,
  SetFormValue,
} from './types'
import { isAssignmentFormValue } from './types'

export function isBodyweightExercise(exercise: Exercise | undefined) {
  return (
    exercise?.equipmentRequirements.some(
      (requirement) => requirement.category === 'bodyweight',
    ) ?? false
  )
}

export function parseEquipmentKey(
  itemKey: string | undefined,
): SessionEquipmentAssignment | null {
  if (!itemKey) {
    return null
  }

  const [itemType, itemId] = itemKey.split(':')
  if (!itemId) {
    return null
  }

  return {
    itemType: itemType === 'assembly' ? 'assembly' : 'equipment',
    itemId,
    quantity: 1,
  }
}

export function normalizeAssignments(
  assignments: AssignmentFormValue[] | SessionEquipmentAssignment[] | undefined,
): SessionEquipmentAssignment[] {
  return (assignments ?? [])
    .map((assignment) => {
      if (isAssignmentFormValue(assignment)) {
        const parsed = parseEquipmentKey(assignment.itemKey)
        if (!parsed) {
          return null
        }

        return {
          ...parsed,
          quantity: Math.max(1, Number(assignment.quantity) || 1),
        }
      }

      return {
        itemType:
          assignment.itemType === 'assembly'
            ? ('assembly' as const)
            : ('equipment' as const),
        itemId: assignment.itemId,
        quantity: Math.max(1, Number(assignment.quantity) || 1),
      }
    })
    .filter((assignment): assignment is SessionEquipmentAssignment => Boolean(assignment))
}

export function normalizeSets(
  sets: SetFormValue[] | SessionSet[] | undefined,
): SessionSet[] {
  const normalized = (sets ?? []).map((set) => ({
    reps: Math.max(0, Number(set.reps) || 0),
    weightKg:
      set.weightKg === undefined || set.weightKg === null
        ? null
        : Math.max(0, Number(set.weightKg) || 0),
    equipmentAssignments: normalizeAssignments(set.equipmentAssignments),
  }))

  return normalized.length > 0
    ? normalized
    : [{ reps: 0, weightKg: null, equipmentAssignments: [] }]
}

export function toAssignmentFormValues(
  assignments: SessionEquipmentAssignment[] | undefined,
) {
  return (assignments ?? []).map((assignment) => ({
    itemKey: `${assignment.itemType}:${assignment.itemId}`,
    quantity: assignment.quantity,
  }))
}

export function toEditableEntry(entry: SessionEntry): EditableEntryFormValue {
  return {
    id: entry.id,
    exerciseId: entry.exerciseId,
    sets: entry.sets.map((set) => ({
      reps: set.reps,
      weightKg: set.weightKg,
      equipmentAssignments: toAssignmentFormValues(set.equipmentAssignments),
    })),
    notes: entry.notes,
  }
}

export function formatExerciseRequirements(exercise: Exercise | undefined) {
  if (!exercise || exercise.equipmentRequirements.length === 0) {
    return 'Требования к инвентарю не указаны'
  }

  const labels = new Map(
    equipmentRequirementCategoryOptions.flatMap((group) =>
      group.options.map((option) => [option.value, option.label] as const),
    ),
  )

  return exercise.equipmentRequirements
    .map(
      (requirement) =>
        `${labels.get(requirement.category) ?? 'Другое'} × ${requirement.quantity}`,
    )
    .join(', ')
}
