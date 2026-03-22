import { Flex, Typography } from 'antd'
import type {
  Exercise,
  SessionEntry,
  SessionEquipmentAssignment,
  SessionSet,
} from '../../types'
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
    <Flex vertical gap={4} className="workout-entry-summary">
      <Text strong>{exercise?.name ?? 'Упражнение'}</Text>
      <Text type="secondary">{formatExerciseRequirements(exercise)}</Text>
      <Flex vertical gap={2}>
        {entry.sets.map((set, index) => {
          const labels = assignmentLabels(set.equipmentAssignments)
          const computedWeight = getComputedWeight(set)
          const parts: string[] = []

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
            <Text key={`${entry.id}-${index}`} type="secondary">
              Подход {index + 1}: {set.reps} повт. ·{' '}
              {parts.length > 0 ? parts.join(' · ') : 'нагрузка не указана'}
            </Text>
          )
        })}
      </Flex>
    </Flex>
  )
}
