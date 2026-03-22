import { Typography } from 'antd'
import type { Exercise, SessionEntry, SessionEquipmentAssignment, SessionSet } from '../../types'
import { formatExerciseRequirements, isBodyweightExercise } from './utils'

const { Text } = Typography

type WorkoutEntrySummaryProps = {
  entry: SessionEntry
  exercise: Exercise | undefined
  assignmentLabelMap: Map<string, string>
  assignmentWeightMap: Map<string, number | null>
}

export function WorkoutEntrySummary({
  entry,
  exercise,
  assignmentLabelMap,
  assignmentWeightMap,
}: WorkoutEntrySummaryProps) {
  const assignmentLabels = (assignments: SessionEquipmentAssignment[]) =>
    assignments.map((assignment) => {
      const key = `${assignment.itemType}:${assignment.itemId}`
      const label = assignmentLabelMap.get(key) ?? 'Неизвестный инвентарь'
      return `${label} × ${assignment.quantity}`
    })

  const getComputedWeight = (set: SessionSet) => {
    const total = set.equipmentAssignments.reduce<number | null>((sum, assignment) => {
      const key = `${assignment.itemType}:${assignment.itemId}`
      const weight = assignmentWeightMap.get(key)
      if (weight === null || weight === undefined) {
        return sum
      }
      return (sum ?? 0) + weight * assignment.quantity
    }, null)

    if (total !== null && total > 0) {
      return Number(total.toFixed(2))
    }

    return set.weightKg
  }

  const bodyweightMode = isBodyweightExercise(exercise)

  return (
    <div className="workout-entry-summary">
      <div className="workout-entry-summary__title">{exercise?.name ?? 'Упражнение'}</div>
      <Text type="secondary">{formatExerciseRequirements(exercise)}</Text>
      <div className="workout-entry-summary__sets">
        {entry.sets.map((set, index) => {
          const labels = assignmentLabels(set.equipmentAssignments)
          const computedWeight = getComputedWeight(set)
          const parts = []

          if (labels.length > 0) {
            parts.push(labels.join(', '))
          }
          if (bodyweightMode && computedWeight !== null && computedWeight !== undefined) {
            parts.push(`доп. вес ${computedWeight} кг`)
          } else if (!bodyweightMode && computedWeight !== null && computedWeight !== undefined) {
            parts.push(`${computedWeight} кг`)
          } else if (bodyweightMode) {
            parts.push('собственный вес')
          }

          return (
            <div key={`${entry.id}-${index}`} className="workout-entry-summary__set">
              <Text type="secondary">
                Подход {index + 1}: {set.reps} повт. ·{' '}
                {parts.length > 0 ? parts.join(' · ') : 'нагрузка не указана'}
              </Text>
            </div>
          )
        })}
      </div>
    </div>
  )
}
