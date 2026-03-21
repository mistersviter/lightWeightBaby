import { useEffect, useState } from 'react'
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
  Typography,
} from 'antd'
import type { FormInstance } from 'antd/es/form'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { initialEntryForm } from '../constants'
import { useDashboardData } from '../hooks/useDashboardData'
import { appFormDefaults, useAppStore } from '../store/appStore'
import type { SessionSet, WorkoutSession, WorkoutTemplate } from '../types'
import { formatDate, toDateInput } from '../utils'

const { Text, Title } = Typography

type EntryFormValues = {
  exerciseId: string
  dumbbellAssemblyId?: string
  sets: SessionSet[]
  notes?: string
}

type SessionFormValues = {
  date: string
  title: string
  notes?: string
}

type EditSessionFormValues = SessionFormValues & {
  entries: Array<{
    id?: string
    exerciseId: string
    dumbbellAssemblyId?: string | null
    sets: SessionSet[]
    notes?: string
  }>
}

type EditTemplateFormValues = {
  name: string
  notes?: string
  entries: Array<{
    id?: string
    exerciseId: string
    dumbbellAssemblyId?: string | null
    sets: SessionSet[]
    notes?: string
  }>
}

type ScheduleFormValues = {
  date: string
}

type SessionSetsFieldsProps = {
  name: string | number | (string | number)[]
}

function normalizeSets(sets: SessionSet[] | undefined) {
  const normalized = (sets ?? []).map((set) => ({
    reps: Math.max(0, Number(set.reps) || 0),
    weight: Math.max(0, Number(set.weight) || 0),
  }))

  return normalized.length > 0 ? normalized : [{ reps: 0, weight: 0 }]
}

function WorkoutEntrySummary({
  exerciseName,
  sets,
  assemblyName,
}: {
  exerciseName: string
  sets: SessionSet[]
  assemblyName?: string | null
}) {
  return (
    <div className="workout-entry-summary">
      <div className="workout-entry-summary__title">{exerciseName}</div>
      {assemblyName ? <Text type="secondary">Снаряд: {assemblyName}</Text> : null}
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
                <Form.Item label={index === 0 ? ' ' : ' '}>
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

export function WorkoutsSection() {
  const [entryForm] = Form.useForm<EntryFormValues>()
  const [sessionForm] = Form.useForm<SessionFormValues>()
  const [editForm] = Form.useForm<EditSessionFormValues>()
  const [templateEditForm] = Form.useForm<EditTemplateFormValues>()
  const [scheduleForm] = Form.useForm<ScheduleFormValues>()
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null)
  const [schedulingTemplate, setSchedulingTemplate] = useState<WorkoutTemplate | null>(
    null,
  )

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
  const exercises = useAppStore((state) => state.data.exercises)
  const dumbbellAssemblies = useAppStore((state) => state.data.dumbbellAssemblies)
  const {
    exerciseOptions,
    dumbbellAssemblyOptions,
    recentSessions,
    recentWorkoutTemplates,
  } = useDashboardData()

  useEffect(() => {
    entryForm.setFieldsValue(initialEntryForm)
    sessionForm.setFieldsValue(appFormDefaults.session)
  }, [entryForm, sessionForm])

  const fillSetWeights = <T,>(
    form: FormInstance<T>,
    path: Parameters<FormInstance<T>['getFieldValue']>[0],
    weight: number,
  ) => {
    const sets = normalizeSets(form.getFieldValue(path))
    form.setFieldValue(
      path,
      sets.map((set) => ({ ...set, weight })),
    )
  }

  const getExerciseName = (exerciseId: string) =>
    exercises.find((exercise) => exercise.id === exerciseId)?.name ??
    'Упражнение'

  const getAssemblyName = (assemblyId: string | null | undefined) =>
    dumbbellAssemblies.find((assembly) => assembly.id === assemblyId)?.name ?? null

  const handleAddEntry = (values: EntryFormValues) => {
    addDraftEntry({
      exerciseId: values.exerciseId,
      dumbbellAssemblyId: values.dumbbellAssemblyId ?? null,
      sets: normalizeSets(values.sets),
      notes: values.notes?.trim() || '',
    })

    entryForm.setFieldsValue({
      ...initialEntryForm,
      exerciseId: values.exerciseId,
      dumbbellAssemblyId: undefined,
    })
  }

  const handleSaveSession = async (values: SessionFormValues) => {
    const saved = await saveSession(values)
    if (saved) {
      sessionForm.setFieldsValue(appFormDefaults.session)
    }
  }

  const handleSaveTemplate = async () => {
    const values = await sessionForm.validateFields()
    if (sessionDraft.length === 0) {
      return
    }

    await saveWorkoutTemplate({
      name: values.title,
      notes: values.notes,
      entries: sessionDraft,
    })
  }

  const openEditModal = (session: WorkoutSession) => {
    setEditingSession(session)
    editForm.setFieldsValue({
      date: session.date,
      title: session.title,
      notes: session.notes,
      entries: session.entries.map((entry) => ({
        id: entry.id,
        exerciseId: entry.exerciseId,
        dumbbellAssemblyId: entry.dumbbellAssemblyId,
        sets: normalizeSets(entry.sets),
        notes: entry.notes,
      })),
    })
  }

  const openTemplateEditModal = (template: WorkoutTemplate) => {
    setEditingTemplate(template)
    templateEditForm.setFieldsValue({
      name: template.name,
      notes: template.notes,
      entries: template.entries.map((entry) => ({
        id: entry.id,
        exerciseId: entry.exerciseId,
        dumbbellAssemblyId: entry.dumbbellAssemblyId,
        sets: normalizeSets(entry.sets),
        notes: entry.notes,
      })),
    })
  }

  const openScheduleModal = (template: WorkoutTemplate) => {
    setSchedulingTemplate(template)
    scheduleForm.setFieldsValue({
      date: toDateInput(new Date()),
    })
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
        dumbbellAssemblyId: entry.dumbbellAssemblyId ?? null,
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
        dumbbellAssemblyId: entry.dumbbellAssemblyId ?? null,
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

  return (
    <Flex vertical gap={24} style={{ width: '100%' }}>
      <Form form={sessionForm} layout="vertical" onFinish={handleSaveSession}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Дата" name="date" rules={[{ required: true }]}>
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Название тренировки"
              name="title"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Общая заметка" name="notes">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Flex gap={8} wrap="wrap">
          <Button type="primary" htmlType="submit">
            Сохранить выполненную тренировку
          </Button>
          <Button disabled={sessionDraft.length === 0} onClick={() => void handleSaveTemplate()}>
            Сохранить как шаблон
          </Button>
        </Flex>
      </Form>

      <Card type="inner" title={`Черновик тренировки: ${sessionDraft.length}`}>
        <Form form={entryForm} layout="vertical" onFinish={handleAddEntry}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Упражнение"
                name="exerciseId"
                rules={[{ required: true }]}
              >
                <Select
                  options={exerciseOptions}
                  placeholder="Выберите упражнение"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Собранный снаряд" name="dumbbellAssemblyId">
                <Select
                  allowClear
                  options={dumbbellAssemblyOptions}
                  placeholder="Можно выбрать сохраненную гантель"
                  onChange={(value) => {
                    const selected = dumbbellAssemblies.find(
                      (assembly) => assembly.id === value,
                    )
                    if (selected) {
                      fillSetWeights(entryForm, ['sets'], selected.totalWeightKg)
                    }
                  }}
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
          <Button htmlType="submit">Добавить в черновик</Button>
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
                    assemblyName={getAssemblyName(entry.dumbbellAssemblyId)}
                  />
                  <Button
                    danger
                    type="link"
                    onClick={() => removeDraftEntry(entry.id)}
                  >
                    Удалить
                  </Button>
                </div>
              </Card>
            ))}
          </Flex>
        )}
      </Card>

      <Card className="entity-item-card">
        <Title level={5}>Шаблоны тренировок</Title>
        {recentWorkoutTemplates.length === 0 ? (
          <Empty description="Шаблонов пока нет" />
        ) : (
          <Flex vertical gap={12}>
            {recentWorkoutTemplates.map((template) => (
              <Card key={template.id} size="small" className="entity-item-card">
                <div className="entity-item-card__header">
                  <div>
                    <div className="entity-item-card__title">{template.name}</div>
                    <Text type="secondary">
                      {template.entries.length} упражнений
                    </Text>
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
                  <div className="workout-session-summary">
                    {template.entries.map((entry) => (
                      <WorkoutEntrySummary
                        key={entry.id}
                        exerciseName={getExerciseName(entry.exerciseId)}
                        sets={entry.sets}
                        assemblyName={getAssemblyName(entry.dumbbellAssemblyId)}
                      />
                    ))}
                  </div>
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
      </Card>

      {recentSessions.length === 0 ? (
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
                    onClick={() => openEditModal(session)}
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
                <div className="workout-session-summary">
                  {session.entries.map((entry) => (
                    <WorkoutEntrySummary
                      key={entry.id}
                      exerciseName={getExerciseName(entry.exerciseId)}
                      sets={entry.sets}
                      assemblyName={getAssemblyName(entry.dumbbellAssemblyId)}
                    />
                  ))}
                </div>
              </Flex>
            </Card>
          ))}
        </Flex>
      )}

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
        width={900}
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Дата" name="date" rules={[{ required: true }]}>
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Название тренировки"
                name="title"
                rules={[{ required: true }]}
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
                      <Col xs={24} md={10}>
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
                      <Col xs={24} md={10}>
                        <Form.Item
                          label={index === 0 ? 'Снаряд' : ' '}
                          name={[field.name, 'dumbbellAssemblyId']}
                        >
                          <Select
                            allowClear
                            options={dumbbellAssemblyOptions}
                            placeholder="Не выбран"
                            onChange={(value) => {
                              const selected = dumbbellAssemblies.find(
                                (assembly) => assembly.id === value,
                              )
                              if (selected) {
                                fillSetWeights(
                                  editForm,
                                  ['entries', field.name, 'sets'],
                                  selected.totalWeightKg,
                                )
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={4}>
                        <Form.Item label={index === 0 ? ' ' : ' '}>
                          <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            aria-label="Удалить запись тренировки"
                            onClick={() => remove(field.name)}
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
                    </Row>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      exerciseId: '',
                      dumbbellAssemblyId: null,
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
        width={900}
      >
        <Form form={templateEditForm} layout="vertical">
          <Form.Item label="Название шаблона" name="name" rules={[{ required: true }]}>
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
                      <Col xs={24} md={10}>
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
                      <Col xs={24} md={10}>
                        <Form.Item
                          label={index === 0 ? 'Снаряд' : ' '}
                          name={[field.name, 'dumbbellAssemblyId']}
                        >
                          <Select
                            allowClear
                            options={dumbbellAssemblyOptions}
                            placeholder="Не выбран"
                            onChange={(value) => {
                              const selected = dumbbellAssemblies.find(
                                (assembly) => assembly.id === value,
                              )
                              if (selected) {
                                fillSetWeights(
                                  templateEditForm,
                                  ['entries', field.name, 'sets'],
                                  selected.totalWeightKg,
                                )
                              }
                            }}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={4}>
                        <Form.Item label={index === 0 ? ' ' : ' '}>
                          <Button
                            danger
                            type="text"
                            icon={<DeleteOutlined />}
                            aria-label="Удалить запись шаблона"
                            onClick={() => remove(field.name)}
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
                    </Row>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      exerciseId: '',
                      dumbbellAssemblyId: null,
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
        title={schedulingTemplate ? `Назначить: ${schedulingTemplate.name}` : 'Назначить шаблон'}
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
          <Form.Item label="Дата" name="date" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  )
}
