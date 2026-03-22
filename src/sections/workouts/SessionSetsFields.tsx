import { Button, Card, Col, Flex, Form, InputNumber, Row, Tag, Typography } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { EquipmentAssignmentsFields } from './EquipmentAssignmentsFields'
import type { EquipmentOptions } from './types'

const { Text } = Typography

type SessionSetsFieldsProps = {
  name: string | number | (string | number)[]
  options: EquipmentOptions
  bodyweightMode: boolean
}

export function SessionSetsFields({
  name,
  options,
  bodyweightMode,
}: SessionSetsFieldsProps) {
  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <Flex vertical gap={16}>
          {fields.map((field, index) => (
            <Card key={field.key} size="small">
              <div className="workout-set-card__badge">
                <Tag color="blue" className="workout-set-card__tag">
                  Подход {index + 1}
                </Tag>
              </div>
              <Flex vertical gap={12}>
                <Row gutter={12}>
                  <Col xs={24} md={bodyweightMode ? 8 : 10}>
                    <Form.Item
                      label="Повторения"
                      name={[field.name, 'reps']}
                      rules={[{ required: true, message: 'Укажите повторения' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  {bodyweightMode ? (
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Дополнительный вес, кг"
                        name={[field.name, 'weightKg']}
                      >
                        <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  ) : null}
                  <Col xs={24} md={bodyweightMode ? 8 : 14}>
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
                  <Col span={24}>
                    <Form.Item label="Инвентарь этого подхода">
                      <EquipmentAssignmentsFields
                        name={[field.name, 'equipmentAssignments']}
                        options={options}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Text type="secondary">
                      {bodyweightMode
                        ? 'Для упражнений с собственным весом это поле нужно только для дополнительной нагрузки. Ниже можно указать турник, резину, пояс с весом и другой инвентарь подхода.'
                        : 'Для обычных силовых упражнений нагрузка задается выбранным инвентарем этого подхода.'}
                    </Text>
                  </Col>
                </Row>
              </Flex>
            </Card>
          ))}
          <div className="workout-builder-inline-action">
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => add({ reps: 10, weightKg: null, equipmentAssignments: [] })}
            >
              Добавить подход
            </Button>
          </div>
        </Flex>
      )}
    </Form.List>
  )
}
