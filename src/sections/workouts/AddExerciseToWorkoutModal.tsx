import { PlusOutlined } from '@ant-design/icons'
import { Button, Col, Flex, Form, Input, Modal, Row, Select, Tag, Typography, type FormInstance } from 'antd'
import type { Exercise } from '../../types'
import { SessionSetsFields } from './SessionSetsFields'
import type { EntryFormValues, EquipmentOptions } from './types'
import { formatExerciseRequirements, isBodyweightExercise } from './utils'

const { Text } = Typography

type AddExerciseToWorkoutModalProps = {
  open: boolean
  form: FormInstance<EntryFormValues>
  selectedExercise: Exercise | undefined
  exerciseOptions: Array<{ label: string; value: string }>
  actualEquipmentOptions: EquipmentOptions
  onSubmit: (values: EntryFormValues) => void
  onCancel: () => void
}

export function AddExerciseToWorkoutModal({
  open,
  form,
  selectedExercise,
  exerciseOptions,
  actualEquipmentOptions,
  onSubmit,
  onCancel,
}: AddExerciseToWorkoutModalProps) {
  return (
    <Modal
      title="Добавить упражнение в тренировку"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={860}
      destroyOnHidden
    >
      <Flex vertical gap={16}>
        <Flex align="center" justify="space-between" gap={12} wrap>
          <Text type="secondary">
            Выбери упражнение, задай подходы и добавь его в текущую тренировку.
          </Text>
          {selectedExercise ? <Tag color="cyan">{selectedExercise.name}</Tag> : null}
        </Flex>

        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          initialValues={{
            exerciseId: '',
            sets: [{ reps: 10, weightKg: null, equipmentAssignments: [] }],
            notes: '',
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Упражнение"
                name="exerciseId"
                rules={[{ required: true, message: 'Выберите упражнение' }]}
              >
                <Select options={exerciseOptions} placeholder="Выберите упражнение" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <div className="workout-builder-hint">
                <Text type="secondary">
                  Требования упражнения: {formatExerciseRequirements(selectedExercise)}
                </Text>
              </div>
            </Col>
            <Col span={24}>
              <div className="workout-builder-sets-section">
                <div className="workout-builder-sets-section__header">
                  <Text strong>Подходы</Text>
                  <Text type="secondary">
                    Здесь задается стартовый набор подходов для нового упражнения.
                  </Text>
                </div>
                <Form.Item style={{ marginBottom: 0 }}>
                  <SessionSetsFields
                    name="sets"
                    options={actualEquipmentOptions}
                    bodyweightMode={isBodyweightExercise(selectedExercise)}
                  />
                </Form.Item>
              </div>
            </Col>
            <Col span={24}>
              <Form.Item label="Комментарий" name="notes">
                <Input.TextArea rows={2} placeholder="Необязательно" />
              </Form.Item>
            </Col>
          </Row>
          <div className="workout-builder-actions">
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              Добавить в тренировку
            </Button>
            <Button onClick={onCancel}>Отмена</Button>
          </div>
        </Form>
      </Flex>
    </Modal>
  )
}
