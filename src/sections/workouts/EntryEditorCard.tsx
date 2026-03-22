import { DeleteOutlined } from '@ant-design/icons'
import { Button, Card, Col, Form, Input, Row, Select, Typography } from 'antd'
import type { Exercise } from '../../types'
import type { EquipmentOptions } from './types'
import { SessionSetsFields } from './SessionSetsFields'
import { formatExerciseRequirements, isBodyweightExercise } from './utils'

const { Text } = Typography

type EntryEditorCardProps = {
  fieldName: number
  exerciseOptions: Array<{ label: string; value: string }>
  exercise: Exercise | undefined
  options: EquipmentOptions
  onRemove: () => void
}

export function EntryEditorCard({
  fieldName,
  exerciseOptions,
  exercise,
  options,
  onRemove,
}: EntryEditorCardProps) {
  return (
    <Card size="small" className="entity-item-card template-entry-editor-card">
      <Row gutter={[12, 12]}>
        <Col span={24}>
          <Form.Item name={[fieldName, 'id']} hidden>
            <Input />
          </Form.Item>
        </Col>

        <Col xs={24} lg={14}>
          <Form.Item
            label="Упражнение"
            name={[fieldName, 'exerciseId']}
            rules={[{ required: true, message: 'Выберите упражнение' }]}
          >
            <Select options={exerciseOptions} placeholder="Выберите упражнение" />
          </Form.Item>
        </Col>

        <Col xs={24} lg={10}>
          <div className="workout-builder-hint template-entry-editor-card__hint">
            <Text type="secondary">
              Требования упражнения: {formatExerciseRequirements(exercise)}
            </Text>
          </div>
        </Col>

        <Col span={24}>
          <div className="workout-builder-sets-section">
            <div className="workout-builder-sets-section__header">
              <Text strong>Подходы</Text>
              <Text type="secondary">
                Настраиваются только внутри этого упражнения и не мешают остальным.
              </Text>
            </div>
            <Form.Item style={{ marginBottom: 0 }}>
              <SessionSetsFields
                name={[fieldName, 'sets']}
                options={options}
                bodyweightMode={isBodyweightExercise(exercise)}
              />
            </Form.Item>
          </div>
        </Col>

        <Col span={24}>
          <Form.Item label="Комментарий" name={[fieldName, 'notes']}>
            <Input.TextArea rows={2} placeholder="Необязательно" />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            aria-label="Удалить упражнение из шаблона"
            onClick={onRemove}
          >
            Удалить упражнение
          </Button>
        </Col>
      </Row>
    </Card>
  )
}
