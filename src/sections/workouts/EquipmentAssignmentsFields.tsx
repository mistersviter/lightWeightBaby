import { Button, Col, Flex, Form, InputNumber, Row, Select, Typography } from 'antd'
import { DeleteOutlined, ToolOutlined } from '@ant-design/icons'
import type { EquipmentOptions } from './types'

const { Text } = Typography

type EquipmentAssignmentsFieldsProps = {
  name: string | number | (string | number)[]
  options: EquipmentOptions
}

export function EquipmentAssignmentsFields({
  name,
  options,
}: EquipmentAssignmentsFieldsProps) {
  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <Flex vertical gap={12}>
          {fields.length === 0 ? (
            <Text type="secondary">
              Можно оставить пусто, если подход не привязан к конкретному снаряду.
            </Text>
          ) : null}
          {fields.map((field, index) => (
            <Row key={field.key} gutter={12} align="bottom">
              <Col xs={24} md={15}>
                <Form.Item
                  label={index === 0 ? 'Инвентарь подхода' : ' '}
                  name={[field.name, 'itemKey']}
                  rules={[{ required: true, message: 'Выберите инвентарь' }]}
                >
                  <Select options={options} placeholder="Например, гантель 21.5 кг" />
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
                    aria-label="Удалить инвентарь подхода"
                    onClick={() => remove(field.name)}
                  />
                </Form.Item>
              </Col>
            </Row>
          ))}
          <div className="workout-builder-inline-action">
            <Button
              size="small"
              icon={<ToolOutlined />}
              onClick={() => add({ itemKey: undefined, quantity: 1 })}
            >
              Добавить инвентарь
            </Button>
          </div>
        </Flex>
      )}
    </Form.List>
  )
}
