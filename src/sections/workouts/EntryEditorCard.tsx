import { Button, Card, Col, Form, Input, Row, Select, Typography } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import type { Exercise } from '../../types'
import type { EquipmentOptions } from './types'
import { SessionSetsFields } from './SessionSetsFields'
import { formatExerciseRequirements, isBodyweightExercise } from './utils'

const { Text } = Typography

type EntryEditorCardProps = {
  fieldName: number
  labelPrefix: boolean
  exerciseOptions: Array<{ label: string; value: string }>
  exercise: Exercise | undefined
  options: EquipmentOptions
  onRemove: () => void
}

export function EntryEditorCard({
  fieldName,
  labelPrefix,
  exerciseOptions,
  exercise,
  options,
  onRemove,
}: EntryEditorCardProps) {
  return (
    <Card size="small">
      <Row gutter={12}>
        <Col span={24}>
          <Form.Item name={[fieldName, 'id']} hidden>
            <Input />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            label={labelPrefix ? 'Упражнение' : ' '}
            name={[fieldName, 'exerciseId']}
            rules={[{ required: true, message: 'Выберите упражнение' }]}
          >
            <Select options={exerciseOptions} placeholder="Выберите упражнение" />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Text type="secondary">
            Требования упражнения: {formatExerciseRequirements(exercise)}
          </Text>
        </Col>
        <Col span={24}>
          <Form.Item label={labelPrefix ? 'Подходы' : ' '}>
            <SessionSetsFields
              name={[fieldName, 'sets']}
              options={options}
              bodyweightMode={isBodyweightExercise(exercise)}
            />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Form.Item label={labelPrefix ? 'Комментарий' : ' '} name={[fieldName, 'notes']}>
            <Input.TextArea rows={2} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            aria-label="Удалить запись"
            onClick={onRemove}
          >
            Удалить запись
          </Button>
        </Col>
      </Row>
    </Card>
  )
}
