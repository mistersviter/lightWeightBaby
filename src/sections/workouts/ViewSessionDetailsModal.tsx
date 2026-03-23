import { Card, Empty, Flex, Modal, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { SessionSet, WorkoutSession } from '../../types'
import { formatDate } from '../../utils'

const { Text, Title, Paragraph } = Typography

type ViewSessionDetailsModalProps = {
  open: boolean
  session: WorkoutSession | null
  getExerciseName: (exerciseId: string) => string
  assignmentWeightMap: Map<string, number | null>
  onClose: () => void
}

type ComparisonRow = {
  key: string
  exerciseName: string
  setIndex: number
  plannedSet: SessionSet | null
  actualSet: SessionSet | null
  exerciseRowSpan: number
}

const sourceTypeLabels: Record<WorkoutSession['sourceType'], string> = {
  manual: 'Быстрая тренировка',
  template: 'Из шаблона',
  scheduled: 'Из календаря',
}

function getComputedSetWeight(
  set: SessionSet,
  assignmentWeightMap: Map<string, number | null>,
) {
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

function formatWeight(set: SessionSet | null, assignmentWeightMap: Map<string, number | null>) {
  if (!set) {
    return <Text type="secondary">—</Text>
  }

  const weight = getComputedSetWeight(set, assignmentWeightMap)
  if (weight === null || weight === undefined) {
    return <Text type="secondary">не указан</Text>
  }

  return <Text>{weight} кг</Text>
}

function formatReps(set: SessionSet | null) {
  if (!set) {
    return <Text type="secondary">—</Text>
  }

  return <Text>{set.reps}</Text>
}

function buildComparisonRows(
  session: WorkoutSession,
  getExerciseName: (exerciseId: string) => string,
): ComparisonRow[] {
  const plannedEntries = session.plannedEntries ?? []
  const maxEntries = Math.max(plannedEntries.length, session.entries.length)

  return Array.from({ length: maxEntries }).flatMap<ComparisonRow>((_, entryIndex) => {
    const plannedEntry = plannedEntries[entryIndex] ?? null
    const actualEntry = session.entries[entryIndex] ?? null
    const exerciseId =
      plannedEntry?.exerciseId ?? actualEntry?.exerciseId ?? `unknown-${entryIndex}`
    const exerciseName = getExerciseName(exerciseId)
    const maxSets = Math.max(plannedEntry?.sets.length ?? 0, actualEntry?.sets.length ?? 0)

    if (maxSets === 0) {
      return [
        {
          key: `${session.id}-${entryIndex}-0`,
          exerciseName,
          setIndex: 1,
          plannedSet: null,
          actualSet: null,
          exerciseRowSpan: 1,
        },
      ]
    }

    return Array.from({ length: maxSets }, (_, setIndex) => ({
      key: `${session.id}-${entryIndex}-${setIndex}`,
      exerciseName,
      setIndex: setIndex + 1,
      plannedSet: plannedEntry?.sets[setIndex] ?? null,
      actualSet: actualEntry?.sets[setIndex] ?? null,
      exerciseRowSpan: setIndex === 0 ? maxSets : 0,
    }))
  })
}

export function ViewSessionDetailsModal({
  open,
  session,
  getExerciseName,
  assignmentWeightMap,
  onClose,
}: ViewSessionDetailsModalProps) {
  const rows = session ? buildComparisonRows(session, getExerciseName) : []

  const columns: ColumnsType<ComparisonRow> = [
    {
      title: 'Упражнение',
      dataIndex: 'exerciseName',
      key: 'exerciseName',
      width: 280,
      render: (value: string, row) => ({
        children: <Text strong>{value}</Text>,
        props: {
          rowSpan: row.exerciseRowSpan,
        },
      }),
    },
    {
      title: 'Подход',
      dataIndex: 'setIndex',
      key: 'setIndex',
      width: 100,
      render: (value: number) => <Text strong>{value}</Text>,
    },
    {
      title: 'План: повторы',
      dataIndex: 'plannedSet',
      key: 'plannedReps',
      width: 150,
      render: (value: SessionSet | null) => formatReps(value),
    },
    {
      title: 'Факт: повторы',
      dataIndex: 'actualSet',
      key: 'actualReps',
      width: 150,
      render: (value: SessionSet | null) => formatReps(value),
    },
    {
      title: 'План: вес',
      dataIndex: 'plannedSet',
      key: 'plannedWeight',
      width: 150,
      render: (value: SessionSet | null) => formatWeight(value, assignmentWeightMap),
    },
    {
      title: 'Факт: вес',
      dataIndex: 'actualSet',
      key: 'actualWeight',
      width: 150,
      render: (value: SessionSet | null) => formatWeight(value, assignmentWeightMap),
    },
  ]

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      onOk={onClose}
      okText="Закрыть"
      cancelButtonProps={{ style: { display: 'none' } }}
      width={1180}
    >
      {session ? (
        <Flex vertical gap={16}>
          <Flex
            justify="space-between"
            align="flex-start"
            gap={16}
            wrap
            className="session-details-modal__header"
          >
            <Flex vertical gap={6} className="session-details-modal__title-block">
              <Title level={3} style={{ margin: 0 }}>
                {session.title}
              </Title>
              <Text type="secondary">{formatDate(session.date)}</Text>
            </Flex>
            <Flex gap={8} wrap="wrap" align="center" className="session-details-modal__meta">
              <Tag color="blue">{sourceTypeLabels[session.sourceType]}</Tag>
              <Tag color="default">Упражнений: {session.entries.length}</Tag>
            </Flex>
          </Flex>

          <Card className="entity-item-card" title="План и фактический результат">
            {rows.length > 0 ? (
              <Table
                bordered
                rowKey="key"
                columns={columns}
                dataSource={rows}
                pagination={false}
                size="small"
                scroll={{ x: 910 }}
              />
            ) : (
              <Empty description="В тренировке нет данных для сравнения" />
            )}
          </Card>

          <Card className="entity-item-card" title="Заметка">
            {session.notes ? (
              <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                {session.notes}
              </Paragraph>
            ) : (
              <Text type="secondary">Без заметки</Text>
            )}
          </Card>
        </Flex>
      ) : null}
    </Modal>
  )
}
