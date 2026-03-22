import { PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Collapse,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Tag,
  Typography,
  type FormInstance,
} from 'antd'
import type { Exercise } from '../../types'
import { EntryEditorCard } from './EntryEditorCard'
import { formatExerciseRequirements } from './utils'
import type { EditTemplateFormValues, EquipmentOptions } from './types'

const { Text, Title } = Typography

type EditTemplateModalProps = {
  form: FormInstance<EditTemplateFormValues>
  open: boolean
  exerciseMap: Map<string, Exercise>
  exerciseOptions: Array<{ label: string; value: string }>
  actualEquipmentOptions: EquipmentOptions
  onSubmit: () => void
  onCancel: () => void
}

function formatSetCount(count: number) {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} подход`
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} подхода`
  }

  return `${count} подходов`
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
  const entries = Form.useWatch('entries', form) ?? []
  const activeKeys = entries.map((_, index) => String(index))

  return (
    <Modal
      title="Редактировать шаблон"
      open={open}
      forceRender
      onOk={onSubmit}
      onCancel={onCancel}
      okText="Сохранить"
      cancelText="Отмена"
      width={860}
    >
      <Flex vertical gap={16}>
        <Card size="small" className="entity-item-card">
          <Flex vertical gap={12}>
            <div>
              <Tag color="blue">Шаг 1</Tag>
              <Title level={5} style={{ marginTop: 8, marginBottom: 4 }}>
                Общая информация
              </Title>
              <Text type="secondary">
                Здесь меняется только название и общая заметка шаблона.
              </Text>
            </div>

            <Form form={form} layout="vertical">
              <Form.Item
                label="Название шаблона"
                name="name"
                rules={[{ required: true, message: 'Укажите название шаблона' }]}
              >
                <Input placeholder="Например, Верх тела" />
              </Form.Item>
              <Form.Item label="Заметка" name="notes">
                <Input.TextArea rows={3} placeholder="Необязательно" />
              </Form.Item>
            </Form>
          </Flex>
        </Card>

        <Card size="small" className="entity-item-card">
          <Flex vertical gap={12}>
            <div className="workout-builder-card__header">
              <div>
                <Tag color="cyan">Шаг 2</Tag>
                <Title level={5} style={{ marginTop: 8, marginBottom: 4 }}>
                  Упражнения шаблона
                </Title>
                <Text type="secondary">
                  Каждое упражнение редактируется в отдельном раскрывающемся блоке.
                </Text>
              </div>
              <Tag color={entries.length > 0 ? 'green' : 'default'}>
                {entries.length} упр.
              </Tag>
            </div>

            <Form form={form} layout="vertical">
              <Form.List name="entries">
                {(fields, { add, remove }) => (
                  <Flex vertical gap={12}>
                    {fields.length === 0 ? (
                      <Empty description="В шаблоне пока нет упражнений" />
                    ) : (
                      <Collapse
                        className="template-entry-collapse"
                        ghost
                        defaultActiveKey={activeKeys}
                        items={fields.map((field, index) => {
                          const exerciseId = form.getFieldValue([
                            'entries',
                            field.name,
                            'exerciseId',
                          ]) as string | undefined
                          const exercise = exerciseId
                            ? exerciseMap.get(exerciseId)
                            : undefined
                          const sets =
                            (form.getFieldValue([
                              'entries',
                              field.name,
                              'sets',
                            ]) as EditTemplateFormValues['entries'][number]['sets'] | undefined) ??
                            []

                          return {
                            key: String(index),
                            label: (
                              <div className="template-entry-collapse__label">
                                <div>
                                  <div className="template-entry-collapse__title">
                                    {exercise?.name || `Упражнение ${index + 1}`}
                                  </div>
                                  <Text type="secondary">
                                    {exercise
                                      ? formatExerciseRequirements(exercise)
                                      : 'Сначала выберите упражнение'}
                                  </Text>
                                </div>
                                <Tag>{formatSetCount(sets.length)}</Tag>
                              </div>
                            ),
                            children: (
                              <EntryEditorCard
                                fieldName={field.name}
                                exerciseOptions={exerciseOptions}
                                exercise={exercise}
                                options={actualEquipmentOptions}
                                onRemove={() => remove(field.name)}
                              />
                            ),
                          }
                        })}
                      />
                    )}

                    <div className="workout-builder-inline-action">
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
                        Добавить упражнение
                      </Button>
                    </div>
                  </Flex>
                )}
              </Form.List>
            </Form>
          </Flex>
        </Card>
      </Flex>
    </Modal>
  )
}
