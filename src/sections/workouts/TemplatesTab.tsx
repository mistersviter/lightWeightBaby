import { DeleteOutlined, EditOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { Button, Empty, Flex, Popconfirm, Typography, Card } from 'antd'
import type { ReactNode } from 'react'
import type { WorkoutTemplate } from '../../types'

const { Paragraph, Text, Title } = Typography

type TemplatesTabProps = {
  templates: WorkoutTemplate[]
  renderEntries: (entries: WorkoutTemplate['entries']) => ReactNode
  onStart: (template: WorkoutTemplate) => void
  onSchedule: (template: WorkoutTemplate) => void
  onEdit: (template: WorkoutTemplate) => void
  onDelete: (templateId: string) => void
}

export function TemplatesTab({
  templates,
  renderEntries,
  onStart,
  onSchedule,
  onEdit,
  onDelete,
}: TemplatesTabProps) {
  return (
    <Flex vertical gap={16}>
      <div>
        <Title level={5}>Шаблоны тренировок</Title>
        <Paragraph type="secondary">
          Здесь хранятся все шаблоны. Их можно запускать сразу, назначать на дату,
          редактировать и использовать повторно.
        </Paragraph>
      </div>

      {templates.length === 0 ? (
        <Empty description="Шаблонов пока нет" />
      ) : (
        <Flex vertical gap={12}>
          {templates.map((template) => (
            <Card
              key={template.id}
              size="small"
              className="entity-item-card"
              styles={{ body: { padding: 16 } }}
            >
              <div className="entity-item-card__header">
                <div>
                  <div className="entity-item-card__title">{template.name}</div>
                  <Text type="secondary">{template.entries.length} упражнений</Text>
                </div>
                <Flex gap={4} wrap="wrap">
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => onStart(template)}
                  >
                    Начать
                  </Button>
                  <Button size="small" onClick={() => onSchedule(template)}>
                    Назначить
                  </Button>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    aria-label="Редактировать шаблон"
                    onClick={() => onEdit(template)}
                  />
                  <Popconfirm
                    title="Удалить шаблон?"
                    description="Все его назначения в календаре тоже будут удалены."
                    okText="Удалить"
                    cancelText="Отмена"
                    onConfirm={() => onDelete(template.id)}
                  >
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      aria-label="Удалить шаблон"
                    />
                  </Popconfirm>
                </Flex>
              </div>
              <Flex vertical gap={10}>
                <Text type="secondary">{template.notes || 'Без заметки'}</Text>
                {renderEntries(template.entries)}
              </Flex>
            </Card>
          ))}
        </Flex>
      )}
    </Flex>
  )
}
