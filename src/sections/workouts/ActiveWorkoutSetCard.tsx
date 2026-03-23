import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons'
import { Button, Card, Col, Flex, Input, InputNumber, Row, Tag, Typography } from 'antd'
import type { SessionEquipmentAssignment } from '../../types'
import { ActiveWorkoutAssignmentsEditor } from './ActiveWorkoutAssignmentsEditor'
import type { ActiveWorkoutSetUpdateValues } from './activeWorkoutTypes'
import type { EquipmentOptions } from './types'

const { Text } = Typography

type ActiveWorkoutSetCardProps = {
  entryId: string
  set: {
    id: string
    plannedReps: number
    actualReps: number
    plannedWeightKg: number | null
    actualWeightKg: number | null
    plannedEquipmentAssignments: SessionEquipmentAssignment[]
    actualEquipmentAssignments: SessionEquipmentAssignment[]
    notes: string
    status: 'pending' | 'completed' | 'skipped'
  }
  setIndex: number
  bodyweightMode: boolean
  actualEquipmentOptions: EquipmentOptions
  getAssignmentLabels: (assignments: SessionEquipmentAssignment[]) => string[]
  getComputedWeight: (
    assignments: SessionEquipmentAssignment[],
    fallbackWeight: number | null,
  ) => number | null
  onUpdateSet: (
    entryId: string,
    setId: string,
    values: ActiveWorkoutSetUpdateValues,
  ) => void
}

export function ActiveWorkoutSetCard({
  entryId,
  set,
  setIndex,
  bodyweightMode,
  actualEquipmentOptions,
  getAssignmentLabels,
  getComputedWeight,
  onUpdateSet,
}: ActiveWorkoutSetCardProps) {
  const plannedLabels = getAssignmentLabels(set.plannedEquipmentAssignments)
  const actualLabels = getAssignmentLabels(set.actualEquipmentAssignments)
  const computedWeight = getComputedWeight(set.actualEquipmentAssignments, set.actualWeightKg)

  return (
    <Card
      size="small"
      className={`active-workout-set-card active-workout-set-card--${set.status}`}
    >
      <Flex vertical gap={16}>
        <div className="workout-set-card__header">
          <Tag color="blue" className="workout-set-card__tag">
            Подход {setIndex + 1}
          </Tag>
          <Flex gap={8} wrap="wrap">
            <Button
              size="small"
              type={set.status === 'completed' ? 'primary' : 'default'}
              icon={<CheckCircleOutlined />}
              onClick={() => onUpdateSet(entryId, set.id, { status: 'completed' })}
            >
              Выполнен
            </Button>
            <Button
              size="small"
              type={set.status === 'pending' ? 'primary' : 'default'}
              icon={<MinusCircleOutlined />}
              onClick={() => onUpdateSet(entryId, set.id, { status: 'pending' })}
            >
              В процессе
            </Button>
            <Button
              size="small"
              danger={set.status === 'skipped'}
              icon={<CloseCircleOutlined />}
              onClick={() => onUpdateSet(entryId, set.id, { status: 'skipped' })}
            >
              Пропустить
            </Button>
          </Flex>
        </div>

        <div className="active-workout-set-card__planned">
          <Text strong>План</Text>
          <Text type="secondary">
            {set.plannedReps} повт.
            {bodyweightMode
              ? set.plannedWeightKg !== null
                ? ` · доп. вес ${set.plannedWeightKg} кг`
                : ' · собственный вес'
              : ''}
            {plannedLabels.length > 0 ? ` · ${plannedLabels.join(', ')}` : ''}
          </Text>
        </div>

        <Row gutter={[12, 12]}>
          <Col xs={24} md={bodyweightMode ? 8 : 10}>
            <Text type="secondary">Фактические повторения</Text>
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              value={set.actualReps}
              onChange={(value) =>
                onUpdateSet(entryId, set.id, {
                  actualReps: Math.max(0, Number(value) || 0),
                })
              }
            />
          </Col>
          {bodyweightMode ? (
            <Col xs={24} md={8}>
              <Text type="secondary">Дополнительный вес, кг</Text>
              <InputNumber
                min={0}
                step={0.5}
                style={{ width: '100%' }}
                value={set.actualWeightKg ?? undefined}
                onChange={(value) =>
                  onUpdateSet(entryId, set.id, {
                    actualWeightKg:
                      value === null || value === undefined
                        ? null
                        : Math.max(0, Number(value) || 0),
                  })
                }
              />
            </Col>
          ) : null}
          <Col span={24}>
            <Text type="secondary">Фактический инвентарь</Text>
            <ActiveWorkoutAssignmentsEditor
              value={set.actualEquipmentAssignments}
              options={actualEquipmentOptions}
              onChange={(assignments) =>
                onUpdateSet(entryId, set.id, {
                  actualEquipmentAssignments: assignments.filter(
                    (assignment) => assignment.itemId,
                  ),
                })
              }
            />
          </Col>
          <Col span={24}>
            <Text type="secondary">Заметка по подходу</Text>
            <Input.TextArea
              rows={2}
              value={set.notes}
              placeholder="Например: снизил вес, сделал паузу, тяжело пошло"
              onChange={(event) =>
                onUpdateSet(entryId, set.id, {
                  notes: event.target.value,
                })
              }
            />
          </Col>
        </Row>

        <Flex vertical gap={4}>
          <Text type="secondary">
            По факту: {actualLabels.length > 0 ? actualLabels.join(', ') : 'инвентарь не выбран'}
          </Text>
          <Text type="secondary">
            Нагрузка:{' '}
            {computedWeight !== null && computedWeight !== undefined
              ? `${computedWeight} кг`
              : bodyweightMode
                ? 'собственный вес'
                : 'не определена'}
          </Text>
        </Flex>
      </Flex>
    </Card>
  )
}
