import { PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Form, Input, Modal, type FormInstance } from 'antd'
import type { Exercise } from '../../types'
import { EntryEditorCard } from './EntryEditorCard'
import type { EditTemplateFormValues, EquipmentOptions } from './types'

type EditTemplateModalProps = {
  form: FormInstance<EditTemplateFormValues>
  open: boolean
  exerciseMap: Map<string, Exercise>
  exerciseOptions: Array<{ label: string; value: string }>
  actualEquipmentOptions: EquipmentOptions
  onSubmit: () => void
  onCancel: () => void
}

export function EditTemplateModal({
  form,
  open,
  exerciseMap,
  exerciseOptions,
  actualEquipmentOptions,
  onSubmit,
  onCancel,
}: EditTemplateModalProps) {
  return (
    <Modal
      title="Редактировать шаблон"
      open={open}
      forceRender
      onOk={onSubmit}
      onCancel={onCancel}
      okText="Сохранить"
      cancelText="Отмена"
      width={960}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Название шаблона"
          name="name"
          rules={[{ required: true, message: 'Укажите название шаблона' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Заметка" name="notes">
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
