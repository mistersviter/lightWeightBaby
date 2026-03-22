import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Tag,
  Typography,
} from 'antd'
import { useMemo, useState } from 'react'
import type {
  ActiveWorkout,
  DumbbellAssembly,
  EquipmentItem,
  Exercise,
  SessionEntry,
  SessionEquipmentAssignment,
} from '../../types'
import { formatDumbbellAssemblyShortLabel } from '../../utils'
import { SessionSetsFields } from './SessionSetsFields'
import type { EntryFormValues, EquipmentOptions } from './types'
import {
  formatExerciseRequirements,
  isBodyweightExercise,
  normalizeSets,
  parseEquipmentKey,
} from './utils'

const { Text, Title } = Typography

type AssignmentEditorProps = {
  value: SessionEquipmentAssignment[]
  options: EquipmentOptions
  onChange: (value: SessionEquipmentAssignment[]) => void
}

type ActiveWorkoutScreenProps = {
  activeWorkout: ActiveWorkout
  exercises: Exercise[]
  equipment: EquipmentItem[]
  dumbbellAssemblies: DumbbellAssembly[]
  actualEquipmentOptions: EquipmentOptions
  exerciseOptions: Array<{ label: string; value: string }>
  onAddEntry: (entry: Omit<SessionEntry, 'id'>) => void
  onAddSet: (entryId: string) => void
  onUpdateMeta: (values: { title?: string; notes?: string }) => void
  onUpdateSet: (
    entryId: string,
    setId: string,
    values: Partial<{
      actualReps: number
      actualWeightKg: number | null
      actualEquipmentAssignments: SessionEquipmentAssignment[]
      notes: string
      status: 'pending' | 'completed' | 'skipped'
    }>,
  ) => void
  onFinish: () => void
  onDiscard: () => void
}

function ActiveWorkoutAssignmentsEditor({
  value,
  options,
  onChange,
}: AssignmentEditorProps) {
  const firstOptionValue = options[0]?.options[0]?.value

  return (
    <Flex vertical gap={8}>
      {value.map((assignment, index) => (
        <Row gutter={[8, 8]} key={`${assignment.itemType}-${assignment.itemId}-${index}`}>
          <Col xs={24} md={16}>
            <Select
              style={{ width: '100%' }}
              value={`${assignment.itemType}:${assignment.itemId}`}
              options={options}
              placeholder="Выберите инвентарь"
              onChange={(itemKey) => {
                const parsed = parseEquipmentKey(itemKey)
                if (!parsed) {
                  return
                }

                onChange(
                  value.map((current, currentIndex) =>
                    currentIndex === index
                      ? {
                          ...parsed,
                          quantity: current.quantity,
                        }
                      : current,
                  ),
                )
              }}
            />
          </Col>
          <Col xs={16} md={6}>
            <InputNumber
              min={1}
              style={{ width: '100%' }}
              value={assignment.quantity}
              onChange={(nextQuantity) => {
                onChange(
                  value.map((current, currentIndex) =>
                    currentIndex === index
                      ? {
                          ...current,
                          quantity: Math.max(1, Number(nextQuantity) || 1),
                        }
                      : current,
                  ),
                )
              }}
            />
          </Col>
          <Col xs={8} md={2}>
            <Button
              danger
              type="text"
              icon={<DeleteOutlined />}
              aria-label="Удалить инвентарь подхода"
              onClick={() => onChange(value.filter((_, currentIndex) => currentIndex !== index))}
            />
          </Col>
        </Row>
      ))}
      <div className="workout-builder-inline-action">
        <Button
          icon={<ToolOutlined />}
          disabled={!firstOptionValue}
          onClick={() => {
            const parsed = parseEquipmentKey(firstOptionValue)
            if (!parsed) {
              return
            }

            onChange([
              ...value,
              {
                ...parsed,
                quantity: 1,
              },
            ])
          }}
        >
          Добавить инвентарь
        </Button>
      </div>
    </Flex>
  )
}

export function ActiveWorkoutScreen({
  activeWorkout,
  exercises,
  equipment,
  dumbbellAssemblies,
  actualEquipmentOptions,
  exerciseOptions,
  onAddEntry,
  onAddSet,
  onUpdateMeta,
  onUpdateSet,
  onFinish,
  onDiscard,
}: ActiveWorkoutScreenProps) {
  const [entryForm] = Form.useForm<EntryFormValues>()
  const [titleDraft, setTitleDraft] = useState(activeWorkout.title)
  const [titleModalOpen, setTitleModalOpen] = useState(false)
  const [addExerciseModalOpen, setAddExerciseModalOpen] = useState(false)

  const exerciseMap = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises],
  )

  const assignmentLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    equipment.forEach((item) => map.set(`equipment:${item.id}`, item.name))
    dumbbellAssemblies.forEach((assembly) => {
      map.set(`assembly:${assembly.id}`, formatDumbbellAssemblyShortLabel(assembly))
    })
    return map
  }, [dumbbellAssemblies, equipment])

  const assignmentWeightMap = useMemo(() => {
    const map = new Map<string, number | null>()
    equipment.forEach((item) => map.set(`equipment:${item.id}`, item.weightKg))
    dumbbellAssemblies.forEach((assembly) =>
      map.set(`assembly:${assembly.id}`, assembly.totalWeightKg),
    )
    return map
  }, [dumbbellAssemblies, equipment])

  const selectedExerciseId = Form.useWatch('exerciseId', entryForm)
  const selectedExercise = selectedExerciseId
    ? exerciseMap.get(selectedExerciseId)
    : undefined

  const getAssignmentLabels = (assignments: SessionEquipmentAssignment[]) =>
    assignments.map((assignment) => {
      const key = `${assignment.itemType}:${assignment.itemId}`
      const label = assignmentLabelMap.get(key) ?? 'Неизвестный инвентарь'
      return `${label} × ${assignment.quantity}`
    })

  const getComputedWeight = (
    assignments: SessionEquipmentAssignment[],
    fallbackWeight: number | null,
  ) => {
    const total = assignments.reduce<number | null>((sum, assignment) => {
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

    return fallbackWeight
  }

  const totalSets = activeWorkout.entries.reduce((sum, entry) => sum + entry.sets.length, 0)
  const completedSets = activeWorkout.entries.reduce(
    (sum, entry) => sum + entry.sets.filter((set) => set.status === 'completed').length,
    0,
  )

  const resetEntryForm = () => {
    entryForm.setFieldsValue({
      exerciseId: '',
      sets: [{ reps: 10, weightKg: null, equipmentAssignments: [] }],
      notes: '',
    })
  }

  const openAddExerciseModal = () => {
    resetEntryForm()
    setAddExerciseModalOpen(true)
  }

  const handleAddEntry = (values: EntryFormValues) => {
    onAddEntry({
      exerciseId: values.exerciseId,
      sets: normalizeSets(values.sets),
      notes: values.notes?.trim() || '',
    })

    resetEntryForm()
    setAddExerciseModalOpen(false)
  }

  return (
    <>
      <Flex vertical gap={16}>
        <Card className="today-workout-card active-workout-card">
          <Flex vertical gap={16}>
            <div className="today-workout-card__header active-workout-card__header">
              <div className="active-workout-card__intro">
                <Tag color="blue">Текущая тренировка</Tag>
                <Flex align="center" gap={8} wrap>
                  <Title level={4} style={{ margin: 0 }}>
                    {activeWorkout.title}
                  </Title>
                  {activeWorkout.sourceType === 'manual' ? (
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setTitleDraft(activeWorkout.title)
                        setTitleModalOpen(true)
                      }}
                    >
                      Переименовать
                    </Button>
                  ) : null}
                </Flex>
                <Text type="secondary">Дата: {activeWorkout.date}</Text>
              </div>
              <Button
                className="active-workout-card__add-exercise"
                type="default"
                size="small"
                icon={<PlusOutlined />}
                onClick={openAddExerciseModal}
              >
                Добавить упражнение
              </Button>
            </div>

            <Flex gap={8} wrap="wrap">
              <Tag color="default">Упражнений: {activeWorkout.entries.length}</Tag>
              <Tag color="processing">
                Подходов выполнено: {completedSets} / {totalSets}
              </Tag>
              {activeWorkout.sourceType === 'scheduled' ? (
                <Tag color="purple">Из календаря</Tag>
              ) : activeWorkout.sourceType === 'template' ? (
                <Tag color="cyan">Из шаблона</Tag>
              ) : (
                <Tag color="gold">Быстрая тренировка</Tag>
              )}
            </Flex>

            <div className="workout-builder-actions">
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={onFinish}>
                Завершить тренировку
              </Button>
              <Button danger icon={<CloseCircleOutlined />} onClick={onDiscard}>
                Прервать
              </Button>
            </div>
          </Flex>
        </Card>

        {activeWorkout.entries.length === 0 ? (
          <Card className="entity-item-card">
            <Empty description="В этой тренировке пока нет упражнений" />
          </Card>
        ) : (
          <Flex vertical gap={16}>
            {activeWorkout.entries.map((entry, entryIndex) => {
              const exercise = exerciseMap.get(entry.exerciseId)
              const bodyweightMode = isBodyweightExercise(exercise)

              return (
                <Card key={entry.id} className="entity-item-card active-workout-entry-card">
                  <Flex vertical gap={16}>
                    <div className="entity-item-card__header">
                      <div>
                        <Tag color="geekblue">Упражнение {entryIndex + 1}</Tag>
                        <div className="entity-item-card__title">{entry.exerciseName}</div>
                        {entry.notes ? <Text type="secondary">{entry.notes}</Text> : null}
                      </div>
                      <Button type="dashed" icon={<PlusOutlined />} onClick={() => onAddSet(entry.id)}>
                        Добавить подход
                      </Button>
                    </div>

                    <Flex vertical gap={12}>
                      {entry.sets.map((set, setIndex) => {
                        const plannedLabels = getAssignmentLabels(set.plannedEquipmentAssignments)
                        const actualLabels = getAssignmentLabels(set.actualEquipmentAssignments)
                        const computedWeight = getComputedWeight(
                          set.actualEquipmentAssignments,
                          set.actualWeightKg,
                        )

                        return (
                          <Card
                            key={set.id}
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
                                    onClick={() =>
                                      onUpdateSet(entry.id, set.id, { status: 'completed' })
                                    }
                                  >
                                    Выполнен
                                  </Button>
                                  <Button
                                    size="small"
                                    type={set.status === 'pending' ? 'primary' : 'default'}
                                    icon={<MinusCircleOutlined />}
                                    onClick={() =>
                                      onUpdateSet(entry.id, set.id, { status: 'pending' })
                                    }
                                  >
                                    В процессе
                                  </Button>
                                  <Button
                                    size="small"
                                    danger={set.status === 'skipped'}
                                    icon={<CloseCircleOutlined />}
                                    onClick={() =>
                                      onUpdateSet(entry.id, set.id, { status: 'skipped' })
                                    }
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
                                      onUpdateSet(entry.id, set.id, {
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
                                        onUpdateSet(entry.id, set.id, {
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
                                      onUpdateSet(entry.id, set.id, {
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
                                      onUpdateSet(entry.id, set.id, {
                                        notes: event.target.value,
                                      })
                                    }
                                  />
                                </Col>
                              </Row>

                              <Flex vertical gap={4}>
                                <Text type="secondary">
                                  По факту:{' '}
                                  {actualLabels.length > 0
                                    ? actualLabels.join(', ')
                                    : 'инвентарь не выбран'}
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
                      })}
                    </Flex>
                  </Flex>
                </Card>
              )
            })}
          </Flex>
        )}
      </Flex>

      <Modal
        title="Переименовать быструю тренировку"
        open={titleModalOpen}
        onOk={() => {
          onUpdateMeta({ title: titleDraft })
          setTitleModalOpen(false)
        }}
        onCancel={() => {
          setTitleDraft(activeWorkout.title)
          setTitleModalOpen(false)
        }}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Input
          value={titleDraft}
          onChange={(event) => setTitleDraft(event.target.value)}
          placeholder="Например, Домашняя тренировка"
        />
      </Modal>

      <Modal
        title="Добавить упражнение в тренировку"
        open={addExerciseModalOpen}
        onCancel={() => {
          setAddExerciseModalOpen(false)
          resetEntryForm()
        }}
        footer={null}
        width={860}
        destroyOnHidden
      >
        <Flex vertical gap={16}>
          <Flex align="center" justify="space-between" gap={12} wrap>
            <Text type="secondary">
              Выбери упражнение, задай подходы и добавь его в текущую тренировку.
            </Text>
            {selectedExercise ? <Tag color="cyan">{selectedExercise.name}</Tag> : null}
          </Flex>

          <Form
            form={entryForm}
            layout="vertical"
            onFinish={handleAddEntry}
            initialValues={{
              exerciseId: '',
              sets: [{ reps: 10, weightKg: null, equipmentAssignments: [] }],
              notes: '',
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Упражнение"
                  name="exerciseId"
                  rules={[{ required: true, message: 'Выберите упражнение' }]}
                >
                  <Select options={exerciseOptions} placeholder="Выберите упражнение" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <div className="workout-builder-hint">
                  <Text type="secondary">
                    Требования упражнения: {formatExerciseRequirements(selectedExercise)}
                  </Text>
                </div>
              </Col>
              <Col span={24}>
                <div className="workout-builder-sets-section">
                  <div className="workout-builder-sets-section__header">
                    <Text strong>Подходы</Text>
                    <Text type="secondary">
                      Здесь задается стартовый набор подходов для нового упражнения.
                    </Text>
                  </div>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <SessionSetsFields
                      name="sets"
                      options={actualEquipmentOptions}
                      bodyweightMode={isBodyweightExercise(selectedExercise)}
                    />
                  </Form.Item>
                </div>
              </Col>
              <Col span={24}>
                <Form.Item label="Комментарий" name="notes">
                  <Input.TextArea rows={2} placeholder="Необязательно" />
                </Form.Item>
              </Col>
            </Row>
            <div className="workout-builder-actions">
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                Добавить в тренировку
              </Button>
              <Button
                onClick={() => {
                  setAddExerciseModalOpen(false)
                  resetEntryForm()
                }}
              >
                Отмена
              </Button>
            </div>
          </Form>
        </Flex>
      </Modal>
    </>
  )
}
