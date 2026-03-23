import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { Alert, Button, Card, Empty, Flex, Form, Input, Modal, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import type {
  ActiveWorkout,
  DumbbellAssembly,
  EquipmentItem,
  Exercise,
  SessionEntry,
  SessionEquipmentAssignment,
  SessionSet,
  WorkoutSession,
} from '../../types'
import { formatDumbbellAssemblyShortLabel } from '../../utils'
import { AddExerciseToWorkoutModal } from './AddExerciseToWorkoutModal'
import { ActiveWorkoutSetCard } from './ActiveWorkoutSetCard'
import { PreviousExerciseResultCard } from './PreviousExerciseResultCard'
import type { ActiveWorkoutSetUpdateValues } from './activeWorkoutTypes'
import type { EntryFormValues, EquipmentOptions } from './types'
import {
  getExerciseRequirementValidationMessage,
  isBodyweightExercise,
  normalizeSets,
} from './utils'

const { Text, Title } = Typography

type ActiveWorkoutScreenProps = {
  activeWorkout: ActiveWorkout
  exercises: Exercise[]
  equipment: EquipmentItem[]
  dumbbellAssemblies: DumbbellAssembly[]
  sessions: WorkoutSession[]
  actualEquipmentOptions: EquipmentOptions
  exerciseOptions: Array<{ label: string; value: string }>
  onAddEntry: (entry: Omit<SessionEntry, 'id'>) => void
  onAddSet: (entryId: string) => void
  onUpdateMeta: (values: { title?: string; notes?: string }) => void
  onUpdateSet: (
    entryId: string,
    setId: string,
    values: ActiveWorkoutSetUpdateValues,
  ) => void
  onFinish: () => void
  onDiscard: () => void
}

export function ActiveWorkoutScreen({
  activeWorkout,
  exercises,
  equipment,
  dumbbellAssemblies,
  sessions,
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
  const [finishValidationError, setFinishValidationError] = useState<string | null>(null)

  const exerciseMap = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises],
  )

  const equipmentMap = useMemo(
    () => new Map(equipment.map((item) => [item.id, item])),
    [equipment],
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

  const previousSessionByExerciseId = useMemo(() => {
    const sortedSessions = [...sessions].sort((left, right) => {
      const dateCompare = right.date.localeCompare(left.date)
      if (dateCompare !== 0) {
        return dateCompare
      }

      return right.createdAt.localeCompare(left.createdAt)
    })

    const map = new Map<string, { session: WorkoutSession; entry: SessionEntry }>()

    sortedSessions.forEach((session) => {
      session.entries.forEach((entry) => {
        if (!map.has(entry.exerciseId)) {
          map.set(entry.exerciseId, { session, entry })
        }
      })
    })

    return map
  }, [sessions])

  const selectedExerciseId = Form.useWatch('exerciseId', entryForm)
  const selectedExercise = selectedExerciseId
    ? exerciseMap.get(selectedExerciseId)
    : undefined

  const totalSets = activeWorkout.entries.reduce((sum, entry) => sum + entry.sets.length, 0)
  const completedSets = activeWorkout.entries.reduce(
    (sum, entry) => sum + entry.sets.filter((set) => set.status === 'completed').length,
    0,
  )

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

  const getComputedSessionSetWeight = (set: SessionSet) =>
    getComputedWeight(set.equipmentAssignments, set.weightKg)

  const resetEntryForm = () => {
    entryForm.setFields([{ name: ['sets'], errors: [] }])
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
    const error = getExerciseRequirementValidationMessage(
      exerciseMap.get(values.exerciseId),
      values.sets,
      equipmentMap,
    )

    entryForm.setFields([{ name: ['sets'], errors: error ? [error] : [] }])
    if (error) {
      return
    }

    onAddEntry({
      exerciseId: values.exerciseId,
      sets: normalizeSets(values.sets),
      notes: values.notes?.trim() || '',
    })

    resetEntryForm()
    setAddExerciseModalOpen(false)
  }

  const handleFinishWorkout = () => {
    const entryErrors = activeWorkout.entries
      .map((entry) => {
        const exercise = exerciseMap.get(entry.exerciseId)
        const error = getExerciseRequirementValidationMessage(
          exercise,
          entry.sets.map((set) => ({
            reps: set.actualReps,
            weightKg: set.actualWeightKg,
            equipmentAssignments: set.actualEquipmentAssignments,
          })),
          equipmentMap,
        )

        return error
          ? `${entry.exerciseName}: ${error.replace(
              /^Добавьте обязательный инвентарь для упражнения ".*?":\s*/,
              '',
            )}`
          : null
      })
      .filter((value): value is string => Boolean(value))

    if (entryErrors.length > 0) {
      setFinishValidationError(
        `Нельзя завершить тренировку, пока не добавлен обязательный инвентарь: ${entryErrors.join(
          '; ',
        )}`,
      )
      return
    }

    setFinishValidationError(null)
    onFinish()
  }

  return (
    <>
      <Flex vertical gap={16}>
        <Card className="today-workout-card active-workout-card">
          <Flex vertical gap={16}>
            {finishValidationError ? (
              <Alert
                type="error"
                showIcon
                title={finishValidationError}
                closable
                onClose={() => setFinishValidationError(null)}
              />
            ) : null}

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
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleFinishWorkout}>
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
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => onAddSet(entry.id)}
                      >
                        Добавить подход
                      </Button>
                    </div>

                    <PreviousExerciseResultCard
                      previous={previousSessionByExerciseId.get(entry.exerciseId)}
                      bodyweightMode={bodyweightMode}
                      getComputedSessionSetWeight={getComputedSessionSetWeight}
                      exerciseId={entry.exerciseId}
                    />

                    <Flex vertical gap={12}>
                      {entry.sets.map((set, setIndex) => (
                        <ActiveWorkoutSetCard
                          key={set.id}
                          entryId={entry.id}
                          set={set}
                          setIndex={setIndex}
                          bodyweightMode={bodyweightMode}
                          actualEquipmentOptions={actualEquipmentOptions}
                          getAssignmentLabels={getAssignmentLabels}
                          getComputedWeight={getComputedWeight}
                          onUpdateSet={onUpdateSet}
                        />
                      ))}
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

      <AddExerciseToWorkoutModal
        open={addExerciseModalOpen}
        form={entryForm}
        selectedExercise={selectedExercise}
        exerciseOptions={exerciseOptions}
        actualEquipmentOptions={actualEquipmentOptions}
        onSubmit={handleAddEntry}
        onCancel={() => {
          setAddExerciseModalOpen(false)
          resetEntryForm()
        }}
      />
    </>
  )
}
