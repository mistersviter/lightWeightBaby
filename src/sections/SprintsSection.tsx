import { useEffect } from 'react'
import { Button, Card, Empty, Flex, Form, Input, InputNumber, Progress, Row, Col, Typography } from 'antd'
import { appFormDefaults, useAppStore } from '../store/appStore'
import { useDashboardData } from '../hooks/useDashboardData'
import { formatDate, getSprintEndDate, getSprintSnapshot, toDateInput, getSprintProgress } from '../utils'

const { Text } = Typography

type SprintFormValues = {
  name: string
  startDate: string
  durationDays: number
  goal?: string
  focus?: string
}

export function SprintsSection() {
  const [form] = Form.useForm<SprintFormValues>()
  const saveSprint = useAppStore((state) => state.saveSprint)
  const sessions = useAppStore((state) => state.data.sessions)
  const measurements = useAppStore((state) => state.data.measurements)
  const { recentSprints, today } = useDashboardData()

  useEffect(() => {
    form.setFieldsValue(appFormDefaults.sprint)
  }, [form])

  const handleFinish = async (values: SprintFormValues) => {
    await saveSprint(values)
    form.resetFields()
    form.setFieldsValue(appFormDefaults.sprint)
  }

  return (
    <Flex vertical gap={24} style={{ width: '100%' }}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item label="Название спринта" name="name" rules={[{ required: true }]}>
              <Input placeholder="Спринт силы" />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item label="Старт" name="startDate" rules={[{ required: true }]}>
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col xs={24} md={6}>
            <Form.Item
              label="Длительность, дней"
              name="durationDays"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Фокус" name="focus">
              <Input placeholder="Жим, техника, дефицит" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Цель" name="goal">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" htmlType="submit">
          Создать спринт
        </Button>
      </Form>

      {recentSprints.length === 0 ? (
        <Empty description="Спринтов пока нет" />
      ) : (
        <Flex vertical gap={12}>
          {recentSprints.map((sprint) => {
            const snapshot = getSprintSnapshot(sprint, sessions, measurements)
            return (
              <Card key={sprint.id} size="small" className="entity-item-card">
                <div className="entity-item-card__header">
                  <div>
                    <div className="entity-item-card__title">{sprint.name}</div>
                    <Text type="secondary">
                      {formatDate(sprint.startDate)} -{' '}
                      {formatDate(toDateInput(getSprintEndDate(sprint)))}
                    </Text>
                  </div>
                </div>
                <Flex vertical gap={8}>
                  <Text>{sprint.focus || 'Без фокуса'}</Text>
                  <Progress percent={getSprintProgress(sprint, today)} size="small" />
                  <Text type="secondary">
                    {snapshot.workouts} тренировок · {snapshot.totalSets} подходов · вес{' '}
                    {snapshot.weightDelta >= 0 ? '+' : ''}
                    {snapshot.weightDelta} кг
                  </Text>
                </Flex>
              </Card>
            )
          })}
        </Flex>
      )}
    </Flex>
  )
}
