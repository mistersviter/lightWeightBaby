import { PlusOutlined } from '@ant-design/icons'
import { Button, Col, Flex, Form, Input, Modal, Row, type FormInstance } from 'antd'
import type { Exercise } from '../../types'
import { EntryEditorCard } from './EntryEditorCard'
import type {
  EditSessionFormValues,
  EquipmentOptions,
} from './types'

type EditSessionModalProps = {
  form: FormInstance<EditSessionFormValues>
  open: boolean
  exerciseMap: Map<string, Exercise>
  exerciseOptions: Array<{ label: string; value: string }>
  actualEquipmentOptions: EquipmentOptions
  onSubmit: () => void
  onCancel: () => void
}

export function EditSessionModal({
  form,
  open,
  exerciseMap,
  exerciseOptions,
  actualEquipmentOptions,
  onSubmit,
  onCancel,
}: EditSessionModalProps) {
  return (
    <Modal
      title="Редактировать тренировку"
      open={open}
      forceRender
      onOk={onSubmit}
      onCancel={onCancel}
      okText="Сохранить"
      cancelText="Отмена"
      width={960}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Дата"
              name="date"
              rules={[{ required: true, message: 'Укажите дату' }]}
            >
              <Input type="date" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Название тренировки"
              name="title"
              rules={[{ required: true, message: 'Укажите название тренировки' }]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="Общая заметка" name="notes">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.List name="entries">
          {(fields, { add, remove }) => (
            <Flex vertical gap={12}>
              {fields.map((field, index) => {
                const exerciseId = form.getFieldValue([
                  'entries',
                  field.name,
                  'exerciseId',
                ]) as string | undefined
                const exercise = exerciseId ? exerciseMap.get(exerciseId) : undefined
                return (
                  <EntryEditorCard
                    key={field.key}
                    fieldName={field.name}
                    labelPrefix={index === 0}
                    exerciseOptions={exerciseOptions}
                    exercise={exercise}
                    options={actualEquipmentOptions}
                    onRemove={() => remove(field.name)}
                  />
                )
              })}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() =>
                  add({
                    exerciseId: '',
                    sets: [{ reps: 10, weightKg: null, equipmentAssignments: [] }],
                    notes: '',
                  })
                }
              >
                Добавить запись
              </Button>
            </Flex>
          )}
        </Form.List>
      </Form>
    </Modal>
  )
}
