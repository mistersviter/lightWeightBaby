import { Card, Flex, Tag, Typography } from 'antd'
import type { SessionEntry, SessionSet, WorkoutSession } from '../../types'
import { formatDate } from '../../utils'

const { Text } = Typography

type PreviousExerciseResultCardProps = {
  previous: { session: WorkoutSession; entry: SessionEntry } | undefined
  bodyweightMode: boolean
  getComputedSessionSetWeight: (set: SessionSet) => number | null
  exerciseId: string
}

export function PreviousExerciseResultCard({
  previous,
  bodyweightMode,
  getComputedSessionSetWeight,
  exerciseId,
}: PreviousExerciseResultCardProps) {
  if (!previous) {
    return null
  }

  return (
    <Card size="small">
      <Flex vertical gap={6}>
        <Flex align="center" gap={8} wrap>
          <Tag color="purple">Прошлый результат</Tag>
          <Text type="secondary">{formatDate(previous.session.date)}</Text>
          <Text type="secondary">Подходов: {previous.entry.sets.length}</Text>
        </Flex>
        <Flex vertical gap={2}>
          {previous.entry.sets.map((previousSet, previousIndex) => {
            const previousWeight = getComputedSessionSetWeight(previousSet)
            const weightText =
              previousWeight === null || previousWeight === undefined
                ? bodyweightMode
                  ? 'собственный вес'
                  : 'вес не указан'
                : bodyweightMode
                  ? `доп. вес ${previousWeight} кг`
                  : `${previousWeight} кг`

            return (
              <Text key={`${previous.session.id}-${exerciseId}-${previousIndex}`}>
                Подход {previousIndex + 1}: {previousSet.reps} повт. · {weightText}
              </Text>
            )
          })}
        </Flex>
      </Flex>
    </Card>
  )
}
