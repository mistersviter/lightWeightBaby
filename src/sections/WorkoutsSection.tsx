import { useEffect } from 'react'
import { Button, Card, Empty, Flex, Form, Input, InputNumber, Row, Col, Select, Typography } from 'antd'
import { appFormDefaults, useAppStore } from '../store/appStore'
import { initialEntryForm } from '../constants'
import { useDashboardData } from '../hooks/useDashboardData'
import { formatDate } from '../utils'

const { Text } = Typography

type EntryFormValues = {
  exerciseId: string
  dumbbellAssemblyId?: string
  sets: number
  reps: number
  weight: number
  notes?: string
}

type SessionFormValues = {
  date: string
  title: string
  notes?: string
}

export function WorkoutsSection() {
  const [entryForm] = Form.useForm<EntryFormValues>()
  const [sessionForm] = Form.useForm<SessionFormValues>()
  const sessionDraft = useAppStore((state) => state.sessionDraft)
  const addDraftEntry = useAppStore((state) => state.addDraftEntry)
  const removeDraftEntry = useAppStore((state) => state.removeDraftEntry)
  const saveSession = useAppStore((state) => state.saveSession)
  const { exerciseOptions, dumbbellAssemblyOptions, recentSessions } = useDashboardData()
  const exercises = useAppStore((state) => state.data.exercises)
  const dumbbellAssemblies = useAppStore((state) => state.data.dumbbellAssemblies)

  useEffect(() => {
    entryForm.setFieldsValue(initialEntryForm)
    sessionForm.setFieldsValue(appFormDefaults.session)
  }, [entryForm, sessionForm])

  const handleAddEntry = (values: EntryFormValues) => {
    addDraftEntry({
      exerciseId: values.exerciseId,
      dumbbellAssemblyId: values.dumbbellAssemblyId ?? null,
      sets: values.sets ?? 0,
      reps: values.reps ?? 0,
      weight: values.weight ?? 0,
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

  const getExerciseName = (exerciseId: string) =>
    exercises.find((exercise) => exercise.id === exerciseId)?.name ?? 'Упражнение'

  const getAssemblyName = (assemblyId: string | null) =>
    dumbbellAssemblies.find((assembly) => assembly.id === assemblyId)?.name ?? null

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
            <Form.Item label="Название тренировки" name="title" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Общая заметка" name="notes">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Button type="primary" htmlType="submit">
          Сохранить тренировку
        </Button>
      </Form>

      <Card type="inner" title={`Черновик тренировки: ${sessionDraft.length}`}>
        <Form form={entryForm} layout="vertical" onFinish={handleAddEntry}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Упражнение" name="exerciseId" rules={[{ required: true }]}>
                <Select options={exerciseOptions} placeholder="Выберите упражнение" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Собранный снаряд" name="dumbbellAssemblyId">
                <Select
                  allowClear
                  options={dumbbellAssemblyOptions}
                  placeholder="Можно выбрать сохраненную гантель"
                  onChange={(value) => {
                    const selected = dumbbellAssemblies.find((assembly) => assembly.id === value)
                    if (selected) {
                      entryForm.setFieldValue('weight', selected.totalWeightKg)
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item label="Подходы" name="sets" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item label="Повторения" name="reps" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item label="Вес" name="weight" rules={[{ required: true }]}>
                <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
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
                  <div>
                    <div className="entity-item-card__title">
                      {getExerciseName(entry.exerciseId)}
                    </div>
                    <Text type="secondary">
                      {entry.sets} x {entry.reps} · {entry.weight} кг
                    </Text>
                    {getAssemblyName(entry.dumbbellAssemblyId) ? (
                      <div>
                        <Text type="secondary">
                          Снаряд: {getAssemblyName(entry.dumbbellAssemblyId)}
                        </Text>
                      </div>
                    ) : null}
                  </div>
                  <Button danger type="link" onClick={() => removeDraftEntry(entry.id)}>
                    Удалить
                  </Button>
                </div>
              </Card>
            ))}
          </Flex>
        )}
      </Card>

      {recentSessions.length === 0 ? (
        <Empty description="Тренировок пока нет" />
      ) : (
        <Flex vertical gap={12}>
          {recentSessions.slice(0, 5).map((session) => (
            <Card key={session.id} size="small" className="entity-item-card">
              <div className="entity-item-card__title">{session.title}</div>
              <Text type="secondary">
                {formatDate(session.date)} · {session.entries.length} упражнений
              </Text>
              <div>
                <Text type="secondary">{session.notes || 'Без заметки'}</Text>
              </div>
            </Card>
          ))}
        </Flex>
      )}
    </Flex>
  )
}
