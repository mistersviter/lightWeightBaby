import { equipmentRequirementCategoryOptions } from '../../constants'
import type {
  EquipmentItem,
  EquipmentRequirementCategory,
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

function getRequirementLabel(category: EquipmentRequirementCategory) {
  const labels = new Map(
    equipmentRequirementCategoryOptions.flatMap((group) =>
      group.options.map((option) => [option.value, option.label] as const),
    ),
  )

  return labels.get(category) ?? 'Другое'
}

function getRequirementCategoryForAssignment(
  assignment: SessionEquipmentAssignment,
  equipmentMap: Map<string, EquipmentItem>,
): EquipmentRequirementCategory | null {
  if (assignment.itemType === 'assembly') {
    return 'dumbbell'
  }

  const item = equipmentMap.get(assignment.itemId)
  if (!item) {
    return null
  }

  switch (item.kind) {
    case 'barbell_bar':
      return 'barbell'
    case 'kettlebell':
      return 'kettlebell'
    case 'bench':
      return 'bench'
    case 'pullup_bar':
      return 'pullup_bar'
    case 'dip_bars':
      return 'dip_bars'
    case 'rack':
      return 'rack'
    case 'machine':
      return 'machine'
    case 'cable_station':
      return 'cable_station'
    case 'band':
      return 'band'
    case 'accessory_other':
      return 'other'
    default:
      return null
  }
}

export function getExerciseRequirementValidationMessage(
  exercise: Exercise | undefined,
  sets: SetFormValue[] | SessionSet[] | undefined,
  equipmentMap: Map<string, EquipmentItem>,
) {
  if (!exercise) {
    return null
  }

  const requiredItems = exercise.equipmentRequirements.filter(
    (requirement) => requirement.category !== 'bodyweight',
  )

  if (requiredItems.length === 0) {
    return null
  }

  const normalizedSets = normalizeSets(sets)
  const setErrors = normalizedSets
    .map((set, index) => {
      const categoryCounts = new Map<EquipmentRequirementCategory, number>()

      set.equipmentAssignments.forEach((assignment) => {
        const category = getRequirementCategoryForAssignment(assignment, equipmentMap)
        if (!category) {
          return
        }

        categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + assignment.quantity)
      })

      const missing = requiredItems.filter(
        (requirement) =>
          (categoryCounts.get(requirement.category) ?? 0) < requirement.quantity,
      )

      if (missing.length === 0) {
        return null
      }

      const missingText = missing
        .map((requirement) => `${getRequirementLabel(requirement.category)} × ${requirement.quantity}`)
        .join(', ')

      return `Подход ${index + 1}: ${missingText}`
    })
    .filter((value): value is string => Boolean(value))

  if (setErrors.length === 0) {
    return null
  }

  return `Добавьте обязательный инвентарь для упражнения "${exercise.name}": ${setErrors.join('; ')}`
}
