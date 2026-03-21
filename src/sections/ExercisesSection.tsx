import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Typography,
} from 'antd'
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../store/appStore'
import { useDashboardData } from '../hooks/useDashboardData'
import type {
  Exercise,
  ExerciseEquipmentRequirement,
} from '../types'

const { Text } = Typography

type ExerciseFormValues = {
  name: string
  primaryMuscleGroup?: string
  equipmentRequirements?: ExerciseEquipmentRequirement[]
  notes?: string
}

type ExercisesSectionProps = {
  onExerciseCreated?: (exerciseId: string) => void
}

type EquipmentRequirementsFieldsProps = {
  equipmentOptions: {
    label: string
    options: { label: string; value: string }[]
  }[]
}

function EquipmentRequirementsFields({
  equipmentOptions,
}: EquipmentRequirementsFieldsProps) {
  return (
    <Form.List name="equipmentRequirements">
      {(fields, { add, remove }) => (
        <Flex vertical gap={12}>
          {fields.length === 0 ? (
            <Text type="secondary">
              Можно привязать к упражнению конкретные компоненты или сохраненные
              снаряды и указать, сколько их нужно.
            </Text>
          ) : null}

          {fields.map((field, index) => (
            <Row key={field.key} gutter={12} align="bottom">
              <Col xs={24} md={15}>
                <Form.Item
                  label={index === 0 ? 'Инвентарь' : ' '}
                  name={[field.name, 'itemId']}
                  rules={[{ required: true, message: 'Выберите снаряд' }]}
                >
                  <Select
                    options={equipmentOptions}
                    placeholder="Выберите компонент или сохраненный снаряд"
                  />
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
                <Form.Item label={index === 0 ? ' ' : ' '}>
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    aria-label="Удалить привязку инвентаря"
                    onClick={() => remove(field.name)}
                  />
                </Form.Item>
              </Col>
            </Row>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => add({ itemId: undefined, quantity: 1 })}
          >
            Добавить инвентарь
          </Button>
        </Flex>
      )}
    </Form.List>
  )
}

export function ExercisesSection({ onExerciseCreated }: ExercisesSectionProps) {
  const [form] = Form.useForm<ExerciseFormValues>()
  const [editForm] = Form.useForm<ExerciseFormValues>()
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const data = useAppStore((state) => state.data)
  const exercises = data.exercises
  const saveExercise = useAppStore((state) => state.saveExercise)
  const updateExercise = useAppStore((state) => state.updateExercise)
  const deleteExercise = useAppStore((state) => state.deleteExercise)
  const { equipmentOptions } = useDashboardData()

  const inventoryLabelMap = useMemo(() => {
    const entries = [
      ...data.equipment.map((item) => [item.id, item.name] as const),
      ...data.dumbbellAssemblies.map(
        (assembly) =>
          [assembly.id, `${assembly.name} · ${assembly.totalWeightKg} кг`] as const,
      ),
    ]

    return new Map<string, string>(entries)
  }, [data.dumbbellAssemblies, data.equipment])

  const formatRequirements = (requirements: ExerciseEquipmentRequirement[]) => {
    if (requirements.length === 0) {
      return 'Инвентарь не привязан'
    }

    return requirements
      .map((requirement) => {
        const label =
          inventoryLabelMap.get(requirement.itemId) ?? 'Неизвестный снаряд'
        return `${label} × ${requirement.quantity}`
      })
      .join(', ')
  }

  const handleFinish = async (values: ExerciseFormValues) => {
    const created = await saveExercise(values)
    form.resetFields()
    onExerciseCreated?.(created.id)
  }

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise)
    editForm.setFieldsValue({
      name: exercise.name,
      primaryMuscleGroup: exercise.primaryMuscleGroup,
      equipmentRequirements: exercise.equipmentRequirements,
      notes: exercise.notes,
    })
  }

  const handleEdit = async () => {
    const values = await editForm.validateFields()
    if (!editingExercise) {
      return
    }

    await updateExercise(editingExercise.id, values)
    setEditingExercise(null)
    editForm.resetFields()
  }

  return (
    <Flex vertical gap={24} style={{ width: '100%' }}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Название упражнения"
              name="name"
              rules={[{ required: true }]}
            >
              <Input placeholder="Жим лежа" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Мышечная группа" name="primaryMuscleGroup">
              <Input placeholder="Грудь" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Инвентарь">
              <EquipmentRequirementsFields equipmentOptions={equipmentOptions} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Заметка" name="notes">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
        <Button type="primary" htmlType="submit">
          Создать упражнение
        </Button>
      </Form>

      {exercises.length === 0 ? (
        <Empty description="Упражнения пока не созданы" />
      ) : (
        <Flex vertical gap={12}>
          {exercises.map((exercise) => (
            <Card
              key={exercise.id}
              size="small"
              className="entity-item-card"
              styles={{ body: { padding: 16 } }}
            >
              <div className="entity-item-card__header">
                <div>
                  <div className="entity-item-card__title">{exercise.name}</div>
                  <Text type="secondary">
                    {exercise.primaryMuscleGroup || 'Без группы'}
                  </Text>
                </div>
                <Flex gap={4}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    aria-label="Редактировать упражнение"
                    onClick={() => openEditModal(exercise)}
                  />
                  <Popconfirm
                    title="Удалить упражнение?"
                    description="История тренировок сохранится, но упражнение исчезнет из справочника."
                    okText="Удалить"
                    cancelText="Отмена"
                    onConfirm={() => void deleteExercise(exercise.id)}
                  >
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      aria-label="Удалить упражнение"
                    />
                  </Popconfirm>
                </Flex>
              </div>
              <Flex vertical gap={6}>
                <Text type="secondary">
                  {formatRequirements(exercise.equipmentRequirements)}
                </Text>
                <Text type="secondary">{exercise.notes || 'Без заметки'}</Text>
              </Flex>
            </Card>
          ))}
        </Flex>
      )}

      <Modal
        title="Редактировать упражнение"
        open={Boolean(editingExercise)}
        onOk={() => void handleEdit()}
        onCancel={() => {
          setEditingExercise(null)
          editForm.resetFields()
        }}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="Название упражнения"
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Мышечная группа" name="primaryMuscleGroup">
            <Input />
          </Form.Item>
          <Form.Item label="Инвентарь">
            <EquipmentRequirementsFields equipmentOptions={equipmentOptions} />
          </Form.Item>
          <Form.Item label="Заметка" name="notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  )
}
