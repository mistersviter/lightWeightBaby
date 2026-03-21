import { useEffect, useMemo, useState } from 'react'
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
  Popconfirm,
  Row,
  Select,
  Tabs,
  Typography,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { equipmentRequirementCategoryOptions, initialEntryForm } from '../constants'
import { useDashboardData } from '../hooks/useDashboardData'
import { appFormDefaults, useAppStore } from '../store/appStore'
import type {
  Exercise,
  SessionEntry,
  SessionEquipmentAssignment,
  SessionSet,
  WorkoutSession,
  WorkoutTemplate,
} from '../types'
import { formatDate, toDateInput } from '../utils'

const { Paragraph, Text, Title } = Typography

type AssignmentFormValue = {
  itemKey?: string
  quantity?: number
}

type EntryFormValues = {
  exerciseId: string
  equipmentAssignments?: AssignmentFormValue[]
  sets: SessionSet[]
  notes?: string
}

type TemplateFormValues = {
  name: string
  notes?: string
}

type SessionFormValues = {
  date: string
  title: string
  notes?: string
}

type EditableEntryFormValue = {
  id?: string
  exerciseId: string
  equipmentAssignments?: AssignmentFormValue[]
  sets: SessionSet[]
  notes?: string
}

type EditSessionFormValues = SessionFormValues & {
  entries: EditableEntryFormValue[]
}

type EditTemplateFormValues = {
  name: string
  notes?: string
  entries: EditableEntryFormValue[]
}

type ScheduleFormValues = {
  date: string
}

type SessionSetsFieldsProps = {
  name: string | number | (string | number)[]
}

type EquipmentAssignmentsFieldsProps = {
  name: string | number | (string | number)[]
  options: Array<{
    label: string
    options: Array<{ label: string; value: string }>
  }>
}

function isAssignmentFormValue(
  assignment: AssignmentFormValue | SessionEquipmentAssignment,
): assignment is AssignmentFormValue {
  return 'itemKey' in assignment
}

function normalizeSets(sets: SessionSet[] | undefined) {
  const normalized = (sets ?? []).map((set) => ({
    reps: Math.max(0, Number(set.reps) || 0),
    weight: Math.max(0, Number(set.weight) || 0),
  }))

  return normalized.length > 0 ? normalized : [{ reps: 0, weight: 0 }]
}

function parseEquipmentKey(itemKey: string | undefined): SessionEquipmentAssignment | null {
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

function normalizeAssignments(
  assignments: AssignmentFormValue[] | SessionEquipmentAssignment[] | undefined,
) {
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

function toAssignmentFormValues(assignments: SessionEquipmentAssignment[] | undefined) {
  return (assignments ?? []).map((assignment) => ({
    itemKey: `${assignment.itemType}:${assignment.itemId}`,
    quantity: assignment.quantity,
  }))
}

function formatExerciseRequirements(exercise: Exercise | undefined) {
  if (!exercise || exercise.equipmentRequirements.length === 0) {
    return 'Требования к инвентарю не указаны'
  }

  const categoryLabels = new Map(
    equipmentRequirementCategoryOptions.flatMap((group) =>
      group.options.map((option) => [option.value, option.label] as const),
    ),
  )

  return exercise.equipmentRequirements
    .map((requirement) => {
      const label = categoryLabels.get(requirement.category) ?? 'Другое'
      return `${label} × ${requirement.quantity}`
    })
    .join(', ')
}

function WorkoutEntrySummary({
  exerciseName,
  sets,
  assignmentLabels,
}: {
  exerciseName: string
  sets: SessionSet[]
  assignmentLabels: string[]
}) {
  return (
    <div className="workout-entry-summary">
      <div className="workout-entry-summary__title">{exerciseName}</div>
      {assignmentLabels.length > 0 ? (
        <Text type="secondary">Инвентарь: {assignmentLabels.join(', ')}</Text>
      ) : (
        <Text type="secondary">Конкретный инвентарь не выбран</Text>
      )}
      <div className="workout-entry-summary__sets">
        {sets.map((set, index) => (
          <div key={`${exerciseName}-${index}`} className="workout-entry-summary__set">
            <Text type="secondary">
              Подход {index + 1}: {set.reps} повт. × {set.weight} кг
            </Text>
          </div>
        ))}
      </div>
    </div>
  )
}

function SessionSetsFields({ name }: SessionSetsFieldsProps) {
  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <Flex vertical gap={12}>
          {fields.map((field, index) => (
            <Row key={field.key} gutter={12} align="bottom">
              <Col xs={24} md={10}>
                <Form.Item
                  label={index === 0 ? 'Повторения' : ' '}
                  name={[field.name, 'reps']}
                  rules={[{ required: true, message: 'Укажите повторения' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={10}>
                <Form.Item
                  label={index === 0 ? 'Вес, кг' : ' '}
                  name={[field.name, 'weight']}
                  rules={[{ required: true, message: 'Укажите вес' }]}
                >
                  <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={4}>
                <Form.Item label=" ">
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    aria-label="Удалить подход"
                    disabled={fields.length === 1}
                    onClick={() => remove(field.name)}
                  />
                </Form.Item>
              </Col>
            </Row>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => add({ reps: 10, weight: 0 })}
          >
            Добавить подход
          </Button>
        </Flex>
      )}
    </Form.List>
  )
}

function EquipmentAssignmentsFields({
  name,
  options,
}: EquipmentAssignmentsFieldsProps) {
  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <Flex vertical gap={12}>
          {fields.length === 0 ? (
            <Text type="secondary">
              Можно оставить пусто, если конкретный снаряд заранее не важен.
            </Text>
          ) : null}

          {fields.map((field, index) => (
            <Row key={field.key} gutter={12} align="bottom">
              <Col xs={24} md={15}>
                <Form.Item
                  label={index === 0 ? 'Фактический инвентарь' : ' '}
                  name={[field.name, 'itemKey']}
                  rules={[{ required: true, message: 'Выберите инвентарь' }]}
                >
                  <Select
                    options={options}
                    placeholder="Например, гантель 21.5 кг"
                  />
                </Form.Item>
              </Col>
              <Col xs={16} md={5}>
                <Form.Item
                  label={index === 0 ? 'Количество' : ' '}
                  name={[field.name, 'quantity']}
                  rules={[{ required: true, message: 'Укажите количество' }]}
                >
                  <InputNumber min={1} precision={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={8} md={4}>
                <Form.Item label=" ">
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    aria-label="Удалить привязку инвентаря"
                    onClick={() => remove(field.name)}
                  />
                </Form.Item>
              </Col>
            </Row>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => add({ itemKey: undefined, quantity: 1 })}
          >
            Добавить инвентарь
          </Button>
        </Flex>
      )}
    </Form.List>
  )
}

function toEditableEntry(entry: SessionEntry): EditableEntryFormValue {
  return {
    id: entry.id,
    exerciseId: entry.exerciseId,
    equipmentAssignments: toAssignmentFormValues(entry.equipmentAssignments),
    sets: normalizeSets(entry.sets),
    notes: entry.notes,
  }
}

export function WorkoutsSection() {
  const [entryForm] = Form.useForm<EntryFormValues>()
  const [templateForm] = Form.useForm<TemplateFormValues>()
  const [sessionForm] = Form.useForm<SessionFormValues>()
  const [editForm] = Form.useForm<EditSessionFormValues>()
  const [templateEditForm] = Form.useForm<EditTemplateFormValues>()
  const [scheduleForm] = Form.useForm<ScheduleFormValues>()
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null)
  const [schedulingTemplate, setSchedulingTemplate] = useState<WorkoutTemplate | null>(
    null,
  )
  const [logWorkoutOpen, setLogWorkoutOpen] = useState(false)

  const data = useAppStore((state) => state.data)
  const sessionDraft = useAppStore((state) => state.sessionDraft)
  const addDraftEntry = useAppStore((state) => state.addDraftEntry)
  const removeDraftEntry = useAppStore((state) => state.removeDraftEntry)
  const saveSession = useAppStore((state) => state.saveSession)
  const updateSession = useAppStore((state) => state.updateSession)
  const deleteSession = useAppStore((state) => state.deleteSession)
  const saveWorkoutTemplate = useAppStore((state) => state.saveWorkoutTemplate)
  const updateWorkoutTemplate = useAppStore((state) => state.updateWorkoutTemplate)
  const deleteWorkoutTemplate = useAppStore((state) => state.deleteWorkoutTemplate)
  const scheduleWorkoutTemplate = useAppStore(
    (state) => state.scheduleWorkoutTemplate,
  )
  const { actualEquipmentOptions, exerciseOptions, recentSessions, recentWorkoutTemplates } =
    useDashboardData()

  useEffect(() => {
    entryForm.setFieldsValue(initialEntryForm)
    templateForm.setFieldsValue({ name: '', notes: '' })
    sessionForm.setFieldsValue(appFormDefaults.session)
  }, [entryForm, sessionForm, templateForm])

  const exerciseMap = useMemo(
    () => new Map(data.exercises.map((exercise) => [exercise.id, exercise])),
    [data.exercises],
  )

  const assignmentLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    data.equipment.forEach((item) => map.set(`equipment:${item.id}`, item.name))
    data.dumbbellAssemblies.forEach((assembly) => {
      map.set(`assembly:${assembly.id}`, assembly.name)
    })
    return map
  }, [data.dumbbellAssemblies, data.equipment])

  const getExerciseName = (exerciseId: string) =>
    exerciseMap.get(exerciseId)?.name ?? 'Упражнение'

  const getAssignmentLabels = (assignments: SessionEquipmentAssignment[]) =>
    assignments.map((assignment) => {
      const key = `${assignment.itemType}:${assignment.itemId}`
      const label = assignmentLabelMap.get(key) ?? 'Неизвестный инвентарь'
      return `${label} × ${assignment.quantity}`
    })

  const handleAddEntry = (values: EntryFormValues) => {
    addDraftEntry({
      exerciseId: values.exerciseId,
      equipmentAssignments: normalizeAssignments(values.equipmentAssignments),
      sets: normalizeSets(values.sets),
      notes: values.notes?.trim() || '',
    })

    entryForm.setFieldsValue({
      ...initialEntryForm,
      exerciseId: values.exerciseId,
    })
  }

  const handleSaveTemplate = async () => {
    const values = await templateForm.validateFields()
    if (sessionDraft.length === 0) {
      return
    }

    await saveWorkoutTemplate({
      name: values.name,
      notes: values.notes,
      entries: sessionDraft,
    })
  }

  const handleOpenLogWorkout = async () => {
    const values = await templateForm.validateFields()
    sessionForm.setFieldsValue({
      date: toDateInput(new Date()),
      title: values.name || appFormDefaults.session.title,
      notes: values.notes || '',
    })
    setLogWorkoutOpen(true)
  }

  const handleSaveSession = async (values: SessionFormValues) => {
    const saved = await saveSession(values)
    if (!saved) {
      return
    }

    sessionForm.setFieldsValue(appFormDefaults.session)
    setLogWorkoutOpen(false)
  }

  const openEditSessionModal = (session: WorkoutSession) => {
    setEditingSession(session)
    editForm.setFieldsValue({
      date: session.date,
      title: session.title,
      notes: session.notes,
      entries: session.entries.map(toEditableEntry),
    })
  }

  const openTemplateEditModal = (template: WorkoutTemplate) => {
    setEditingTemplate(template)
    templateEditForm.setFieldsValue({
      name: template.name,
      notes: template.notes,
      entries: template.entries.map(toEditableEntry),
    })
  }

  const openScheduleModal = (template: WorkoutTemplate) => {
    setSchedulingTemplate(template)
    scheduleForm.setFieldsValue({ date: toDateInput(new Date()) })
  }

  const handleEditSession = async () => {
    const values = await editForm.validateFields()
    if (!editingSession) {
      return
    }

    await updateSession(editingSession.id, {
      ...values,
      entries: values.entries.map((entry) => ({
        ...entry,
        equipmentAssignments: normalizeAssignments(entry.equipmentAssignments),
        sets: normalizeSets(entry.sets),
        notes: entry.notes ?? '',
      })),
    })

    setEditingSession(null)
    editForm.resetFields()
  }

  const handleEditTemplate = async () => {
    const values = await templateEditForm.validateFields()
    if (!editingTemplate) {
      return
    }

    await updateWorkoutTemplate(editingTemplate.id, {
      ...values,
      entries: values.entries.map((entry) => ({
        ...entry,
        equipmentAssignments: normalizeAssignments(entry.equipmentAssignments),
        sets: normalizeSets(entry.sets),
        notes: entry.notes ?? '',
      })),
    })

    setEditingTemplate(null)
    templateEditForm.resetFields()
  }

  const handleScheduleTemplate = async () => {
    const values = await scheduleForm.validateFields()
    if (!schedulingTemplate) {
      return
    }

    await scheduleWorkoutTemplate(schedulingTemplate.id, values.date)
    setSchedulingTemplate(null)
    scheduleForm.resetFields()
  }

  const selectedExerciseId = Form.useWatch('exerciseId', entryForm)
  const selectedExercise = exerciseMap.get(selectedExerciseId)

  const renderEntries = (
    entries: Array<{
      id: string
      exerciseId: string
      equipmentAssignments: SessionEquipmentAssignment[]
      sets: SessionSet[]
    }>,
  ) => (
    <div className="workout-session-summary">
      {entries.map((entry) => (
        <WorkoutEntrySummary
          key={entry.id}
          exerciseName={getExerciseName(entry.exerciseId)}
          sets={entry.sets}
          assignmentLabels={getAssignmentLabels(entry.equipmentAssignments)}
        />
      ))}
    </div>
  )

  const createTab = (
    <Flex vertical gap={24}>
      <Card className="entity-item-card">
        <Title level={5}>Создать шаблон тренировки</Title>
        <Paragraph type="secondary">
          Здесь мы собираем переиспользуемую тренировку: задаем название, добавляем
          упражнения, а конкретный инвентарь выбираем уже на уровне записи тренировки.
        </Paragraph>
        <Form form={templateForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Название шаблона"
                name="name"
                rules={[{ required: true, message: 'Укажите название шаблона' }]}
              >
                <Input placeholder="Например, Верх тела" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Заметка" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Card>

      <Card type="inner" title={`Черновик шаблона: ${sessionDraft.length}`}>
        <Form form={entryForm} layout="vertical" onFinish={handleAddEntry}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Упражнение"
                name="exerciseId"
                rules={[{ required: true, message: 'Выберите упражнение' }]}
              >
                <Select
                  options={exerciseOptions}
                  placeholder="Выберите упражнение"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Text type="secondary">
                Требования упражнения: {formatExerciseRequirements(selectedExercise)}
              </Text>
            </Col>
            <Col span={24}>
              <Form.Item label="Фактический инвентарь">
                <EquipmentAssignmentsFields
                  name="equipmentAssignments"
                  options={actualEquipmentOptions}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Подходы">
                <SessionSetsFields name="sets" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Комментарий" name="notes">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
          <Button htmlType="submit">Добавить упражнение в шаблон</Button>
        </Form>

        {sessionDraft.length === 0 ? (
          <Empty description="Черновик пока пуст" />
        ) : (
          <Flex vertical gap={12}>
            {sessionDraft.map((entry) => (
              <Card key={entry.id} size="small" className="entity-item-card">
                <div className="entity-item-card__header">
                  <WorkoutEntrySummary
                    exerciseName={getExerciseName(entry.exerciseId)}
                    sets={entry.sets}
                    assignmentLabels={getAssignmentLabels(entry.equipmentAssignments)}
                  />
                  <Button danger type="link" onClick={() => removeDraftEntry(entry.id)}>
                    Удалить
                  </Button>
                </div>
              </Card>
            ))}
          </Flex>
        )}
      </Card>

      <Flex gap={8} wrap="wrap">
        <Button
          type="primary"
          disabled={sessionDraft.length === 0}
          onClick={() => void handleSaveTemplate()}
        >
          Сохранить шаблон
        </Button>
        <Button
          disabled={sessionDraft.length === 0}
          onClick={() => void handleOpenLogWorkout()}
        >
          Сохранить как выполненную тренировку
        </Button>
      </Flex>
    </Flex>
  )

  const templatesTab = (
    <Card className="entity-item-card">
      <Title level={5}>Шаблоны тренировок</Title>
      <Paragraph type="secondary">
        Здесь живут все заготовленные тренировки. Их можно редактировать, назначать на
        дату и использовать повторно сколько угодно раз.
      </Paragraph>
      {recentWorkoutTemplates.length === 0 ? (
        <Empty description="Шаблонов пока нет" />
      ) : (
        <Flex vertical gap={12}>
          {recentWorkoutTemplates.map((template) => (
            <Card key={template.id} size="small" className="entity-item-card">
              <div className="entity-item-card__header">
                <div>
                  <div className="entity-item-card__title">{template.name}</div>
                  <Text type="secondary">{template.entries.length} упражнений</Text>
                </div>
                <Flex gap={4}>
                  <Button size="small" onClick={() => openScheduleModal(template)}>
                    Назначить
                  </Button>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    aria-label="Редактировать шаблон"
                    onClick={() => openTemplateEditModal(template)}
                  />
                  <Popconfirm
                    title="Удалить шаблон?"
                    description="Все его назначения в календаре тоже будут удалены."
                    okText="Удалить"
                    cancelText="Отмена"
                    onConfirm={() => void deleteWorkoutTemplate(template.id)}
                  >
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      aria-label="Удалить шаблон"
                    />
                  </Popconfirm>
                </Flex>
              </div>
              <Flex vertical gap={10}>
                <Text type="secondary">{template.notes || 'Без заметки'}</Text>
                {renderEntries(template.entries)}
              </Flex>
            </Card>
          ))}
        </Flex>
      )}
    </Card>
  )

  const historyTab =
    recentSessions.length === 0 ? (
      <Empty description="Выполненных тренировок пока нет" />
    ) : (
      <Flex vertical gap={12}>
        {recentSessions.slice(0, 5).map((session) => (
          <Card
            key={session.id}
            size="small"
            className="entity-item-card"
            styles={{ body: { padding: 16 } }}
          >
            <div className="entity-item-card__header">
              <div>
                <div className="entity-item-card__title">{session.title}</div>
                <Text type="secondary">
                  {formatDate(session.date)} · {session.entries.length} упражнений
                </Text>
              </div>
              <Flex gap={4}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  aria-label="Редактировать тренировку"
                  onClick={() => openEditSessionModal(session)}
                />
                <Popconfirm
                  title="Удалить тренировку?"
                  description="Тренировка будет удалена из календаря и истории."
                  okText="Удалить"
                  cancelText="Отмена"
                  onConfirm={() => void deleteSession(session.id)}
                >
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    aria-label="Удалить тренировку"
                  />
                </Popconfirm>
              </Flex>
            </div>
            <Flex vertical gap={10}>
              <Text type="secondary">{session.notes || 'Без заметки'}</Text>
              {renderEntries(session.entries)}
            </Flex>
          </Card>
        ))}
      </Flex>
    )

  return (
    <>
      <Tabs
        items={[
          { key: 'create', label: 'Создать шаблон', children: createTab },
          { key: 'templates', label: 'Шаблоны', children: templatesTab },
          { key: 'history', label: 'История', children: historyTab },
        ]}
      />

      <Modal
        title="Сохранить как выполненную тренировку"
        open={logWorkoutOpen}
        onOk={() => void sessionForm.submit()}
        onCancel={() => {
          setLogWorkoutOpen(false)
          sessionForm.resetFields()
          sessionForm.setFieldsValue(appFormDefaults.session)
        }}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={sessionForm} layout="vertical" onFinish={handleSaveSession}>
          <Form.Item
            label="Дата"
            name="date"
            rules={[{ required: true, message: 'Укажите дату' }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item
            label="Название тренировки"
            name="title"
            rules={[{ required: true, message: 'Укажите название тренировки' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Заметка" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Редактировать тренировку"
        open={Boolean(editingSession)}
        onOk={() => void handleEditSession()}
        onCancel={() => {
          setEditingSession(null)
          editForm.resetFields()
        }}
        okText="Сохранить"
        cancelText="Отмена"
        width={960}
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Дата"
                name="date"
                rules={[{ required: true, message: 'Укажите дату' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Название тренировки"
                name="title"
                rules={[{ required: true, message: 'Укажите название тренировки' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Общая заметка" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.List name="entries">
            {(fields, { add, remove }) => (
              <Flex vertical gap={12}>
                {fields.map((field, index) => (
                  <Card key={field.key} size="small">
                    <Row gutter={12}>
                      <Col span={24}>
                        <Form.Item name={[field.name, 'id']} hidden>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label={index === 0 ? 'Упражнение' : ' '}
                          name={[field.name, 'exerciseId']}
                          rules={[{ required: true, message: 'Выберите упражнение' }]}
                        >
                          <Select
                            options={exerciseOptions}
                            placeholder="Выберите упражнение"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label={index === 0 ? 'Фактический инвентарь' : ' '}>
                          <EquipmentAssignmentsFields
                            name={[field.name, 'equipmentAssignments']}
                            options={actualEquipmentOptions}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label={index === 0 ? 'Подходы' : ' '}>
                          <SessionSetsFields name={[field.name, 'sets']} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          label={index === 0 ? 'Комментарий' : ' '}
                          name={[field.name, 'notes']}
                        >
                          <Input.TextArea rows={2} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          aria-label="Удалить запись тренировки"
                          onClick={() => remove(field.name)}
                        >
                          Удалить запись
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      exerciseId: '',
                      equipmentAssignments: [],
                      sets: [{ reps: 10, weight: 0 }],
                      notes: '',
                    })
                  }
                >
                  Добавить запись
                </Button>
              </Flex>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title="Редактировать шаблон"
        open={Boolean(editingTemplate)}
        onOk={() => void handleEditTemplate()}
        onCancel={() => {
          setEditingTemplate(null)
          templateEditForm.resetFields()
        }}
        okText="Сохранить"
        cancelText="Отмена"
        width={960}
      >
        <Form form={templateEditForm} layout="vertical">
          <Form.Item
            label="Название шаблона"
            name="name"
            rules={[{ required: true, message: 'Укажите название шаблона' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Заметка" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.List name="entries">
            {(fields, { add, remove }) => (
              <Flex vertical gap={12}>
                {fields.map((field, index) => (
                  <Card key={field.key} size="small">
                    <Row gutter={12}>
                      <Col span={24}>
                        <Form.Item name={[field.name, 'id']} hidden>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item
                          label={index === 0 ? 'Упражнение' : ' '}
                          name={[field.name, 'exerciseId']}
                          rules={[{ required: true, message: 'Выберите упражнение' }]}
                        >
                          <Select
                            options={exerciseOptions}
                            placeholder="Выберите упражнение"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label={index === 0 ? 'Фактический инвентарь' : ' '}>
                          <EquipmentAssignmentsFields
                            name={[field.name, 'equipmentAssignments']}
                            options={actualEquipmentOptions}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label={index === 0 ? 'Подходы' : ' '}>
                          <SessionSetsFields name={[field.name, 'sets']} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          label={index === 0 ? 'Комментарий' : ' '}
                          name={[field.name, 'notes']}
                        >
                          <Input.TextArea rows={2} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Button
                          danger
                          type="text"
                          icon={<DeleteOutlined />}
                          aria-label="Удалить запись шаблона"
                          onClick={() => remove(field.name)}
                        >
                          Удалить запись
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      exerciseId: '',
                      equipmentAssignments: [],
                      sets: [{ reps: 10, weight: 0 }],
                      notes: '',
                    })
                  }
                >
                  Добавить запись
                </Button>
              </Flex>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title={
          schedulingTemplate
            ? `Назначить: ${schedulingTemplate.name}`
            : 'Назначить шаблон'
        }
        open={Boolean(schedulingTemplate)}
        onOk={() => void handleScheduleTemplate()}
        onCancel={() => {
          setSchedulingTemplate(null)
          scheduleForm.resetFields()
        }}
        okText="Назначить"
        cancelText="Отмена"
      >
        <Form form={scheduleForm} layout="vertical">
          <Form.Item
            label="Дата"
            name="date"
            rules={[{ required: true, message: 'Укажите дату' }]}
          >
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
