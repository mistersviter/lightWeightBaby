import { Button, Card, Col, Flex, Form, InputNumber, Row, Tag, Typography } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import { EquipmentAssignmentsFields } from './EquipmentAssignmentsFields'
import type { EquipmentOptions, SetFormValue } from './types'

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
  const form = Form.useFormInstance()
  const fieldPath = Array.isArray(name) ? name : [name]
  const sets = (Form.useWatch(name) as SetFormValue[] | undefined) ?? []

  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <Flex vertical gap={16}>
          {fields.map((field, index) => (
            <Card key={field.key} size="small">
              <div className="workout-set-card__header">
                <Tag color="blue" className="workout-set-card__tag">
                  Подход {index + 1}
                </Tag>
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  aria-label="Удалить подход"
                  disabled={fields.length === 1}
                  onClick={() => remove(field.name)}
                >
                  Удалить подход
                </Button>
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
          <Form.ErrorList errors={form.getFieldError(fieldPath)} />
          <div className="workout-builder-inline-action">
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => {
                const previousSet = sets[sets.length - 1]

                add({
                  reps: previousSet?.reps ?? 10,
                  weightKg: previousSet?.weightKg ?? null,
                  equipmentAssignments:
                    previousSet?.equipmentAssignments?.map((assignment) => ({
                      itemKey: assignment.itemKey,
                      quantity: assignment.quantity,
                    })) ?? [],
                })
              }}
            >
              Добавить подход
            </Button>
          </div>
        </Flex>
      )}
    </Form.List>
  )
}
