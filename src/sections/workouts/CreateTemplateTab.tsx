import { PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  Row,
  Select,
  Tag,
  Typography,
  type FormInstance,
} from 'antd'
import type { ReactNode } from 'react'
import type { Exercise, SessionEntry } from '../../types'
import { SessionSetsFields } from './SessionSetsFields'
import type { EntryFormValues, EquipmentOptions, TemplateFormValues } from './types'
import { formatExerciseRequirements, isBodyweightExercise } from './utils'

const { Text, Title } = Typography

type CreateTemplateTabProps = {
  templateForm: FormInstance<TemplateFormValues>
  entryForm: FormInstance<EntryFormValues>
  exerciseOptions: Array<{ label: string; value: string }>
  actualEquipmentOptions: EquipmentOptions
  selectedExercise: Exercise | undefined
  sessionDraft: SessionEntry[]
  renderEntries: (entries: SessionEntry[]) => ReactNode
  onAddEntry: (values: EntryFormValues) => void
  onRemoveDraftEntry: (entryId: string) => void
  onSaveTemplate: () => void
  onOpenLogWorkout: () => void
}

export function CreateTemplateTab({
  templateForm,
  entryForm,
  exerciseOptions,
  actualEquipmentOptions,
  selectedExercise,
  sessionDraft,
  renderEntries,
  onAddEntry,
  onRemoveDraftEntry,
  onSaveTemplate,
  onOpenLogWorkout,
}: CreateTemplateTabProps) {
  return (
    <Flex vertical gap={16}>
      <Card className="entity-item-card workout-builder-card">
        <Flex vertical gap={16}>
          <div className="workout-builder-card__header">
            <div>
              <Tag color="blue">Шаг 1</Tag>
              <Title level={5}>Назови шаблон</Title>
              <Text type="secondary">Дай тренировке короткое и понятное имя.</Text>
            </div>
          </div>

          <Form form={templateForm} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Название шаблона"
                  name="name"
                  rules={[{ required: true, message: 'Укажите название шаблона' }]}
                >
                  <Input placeholder="Например, Верх тела" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="Заметка" name="notes">
              <Input.TextArea rows={3} placeholder="Необязательно" />
            </Form.Item>
          </Form>
        </Flex>
      </Card>

      <Card className="entity-item-card workout-builder-card">
        <Flex vertical gap={16}>
          <div className="workout-builder-card__header">
            <div>
              <Tag color="cyan">Шаг 2</Tag>
              <Title level={5}>Добавь упражнение</Title>
              <Text type="secondary">
                Выбери упражнение, заполни подходы и добавь его в черновик.
              </Text>
            </div>
            {selectedExercise ? <Tag>{selectedExercise.name}</Tag> : null}
          </div>

          <Form form={entryForm} layout="vertical" onFinish={onAddEntry}>
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
                      Заполни повторы и нужный инвентарь для каждого подхода.
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
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              Добавить в шаблон
            </Button>
          </Form>
        </Flex>
      </Card>

      <Card className="entity-item-card workout-builder-card">
        <Flex vertical gap={16}>
          <div className="workout-builder-card__header">
            <div>
              <Tag color="gold">Шаг 3</Tag>
              <Title level={5}>Проверь черновик и сохрани</Title>
              <Text type="secondary">Когда все упражнения добавлены, сохрани шаблон.</Text>
            </div>
            <Tag color={sessionDraft.length > 0 ? 'green' : 'default'}>
              {sessionDraft.length} упр.
            </Tag>
          </div>

          {sessionDraft.length === 0 ? (
            <Empty description="Черновик пока пуст. Сначала добавь хотя бы одно упражнение." />
          ) : (
            <Flex vertical gap={12}>
              {sessionDraft.map((entry) => (
                <Card key={entry.id} size="small" className="entity-item-card">
                  <div className="entity-item-card__header">
                    <div style={{ flex: 1 }}>{renderEntries([entry])}</div>
                    <Button danger type="link" onClick={() => onRemoveDraftEntry(entry.id)}>
                      Удалить
                    </Button>
                  </div>
                </Card>
              ))}
            </Flex>
          )}

          <div className="workout-builder-actions">
            <Button type="primary" disabled={sessionDraft.length === 0} onClick={onSaveTemplate}>
              Сохранить шаблон
            </Button>
            <Button disabled={sessionDraft.length === 0} onClick={onOpenLogWorkout}>
              Сохранить как выполненную тренировку
            </Button>
          </div>
        </Flex>
      </Card>
    </Flex>
  )
}
