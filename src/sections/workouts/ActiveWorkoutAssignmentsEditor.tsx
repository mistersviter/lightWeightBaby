import { DeleteOutlined, ToolOutlined } from '@ant-design/icons'
import { Button, Col, Flex, InputNumber, Row, Select } from 'antd'
import type { SessionEquipmentAssignment } from '../../types'
import type { EquipmentOptions } from './types'
import { parseEquipmentKey } from './utils'

type ActiveWorkoutAssignmentsEditorProps = {
  value: SessionEquipmentAssignment[]
  options: EquipmentOptions
  onChange: (value: SessionEquipmentAssignment[]) => void
}

export function ActiveWorkoutAssignmentsEditor({
  value,
  options,
  onChange,
}: ActiveWorkoutAssignmentsEditorProps) {
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
