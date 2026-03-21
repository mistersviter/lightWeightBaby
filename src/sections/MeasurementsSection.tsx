import { useEffect } from 'react'
import { Button, Card, Empty, Flex, Form, Input, InputNumber, Row, Col, Typography } from 'antd'
import { appFormDefaults, useAppStore } from '../store/appStore'
import { useDashboardData } from '../hooks/useDashboardData'
import { formatDate } from '../utils'

const { Text } = Typography

type MeasurementFormValues = {
  date: string
  bodyWeight?: number
  chest?: number
  waist?: number
  hips?: number
  arm?: number
  thigh?: number
  notes?: string
}

export function MeasurementsSection() {
  const [form] = Form.useForm<MeasurementFormValues>()
  const saveMeasurement = useAppStore((state) => state.saveMeasurement)
  const { recentMeasurements } = useDashboardData()

  useEffect(() => {
    form.setFieldsValue(appFormDefaults.measurement)
  }, [form])

  const handleFinish = async (values: MeasurementFormValues) => {
    await saveMeasurement(values)
    form.resetFields()
    form.setFieldsValue(appFormDefaults.measurement)
  }

  return (
    <Flex vertical gap={24} style={{ width: '100%' }}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Дата" name="date" rules={[{ required: true }]}>
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item label="Вес тела" name="bodyWeight">
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item label="Грудь" name="chest">
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item label="Талия" name="waist">
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item label="Бедра" name="hips">
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item label="Рука" name="arm">
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item label="Бедро" name="thigh">
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Комментарий" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" htmlType="submit">
          Зафиксировать замер
        </Button>
      </Form>

      {recentMeasurements.length === 0 ? (
        <Empty description="Замеров пока нет" />
      ) : (
        <Flex vertical gap={12}>
          {recentMeasurements.slice(0, 5).map((measurement) => (
            <Card key={measurement.id} size="small" className="entity-item-card">
              <div className="entity-item-card__title">{formatDate(measurement.date)}</div>
              <Text type="secondary">
                Вес {measurement.bodyWeight} кг · талия {measurement.waist} см
              </Text>
              <div>
                <Text type="secondary">{measurement.notes || 'Без заметки'}</Text>
              </div>
            </Card>
          ))}
        </Flex>
      )}
    </Flex>
  )
}
