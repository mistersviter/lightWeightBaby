import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Flex, Popconfirm, Typography } from 'antd'
import type { ReactNode } from 'react'
import type { WorkoutTemplate } from '../../types'

const { Paragraph, Text, Title } = Typography

type TemplatesTabProps = {
  templates: WorkoutTemplate[]
  renderEntries: (entries: WorkoutTemplate['entries']) => ReactNode
  onSchedule: (template: WorkoutTemplate) => void
  onEdit: (template: WorkoutTemplate) => void
  onDelete: (templateId: string) => void
}

export function TemplatesTab({
  templates,
  renderEntries,
  onSchedule,
  onEdit,
  onDelete,
}: TemplatesTabProps) {
  return (
    <Card className="entity-item-card">
      <Title level={5}>Шаблоны тренировок</Title>
      <Paragraph type="secondary">
        Здесь хранятся все шаблоны. Их можно редактировать, назначать на дату и
        использовать повторно.
      </Paragraph>
      {templates.length === 0 ? (
        <Empty description="Шаблонов пока нет" />
      ) : (
        <Flex vertical gap={12}>
          {templates.map((template) => (
            <Card key={template.id} size="small" className="entity-item-card">
              <div className="entity-item-card__header">
                <div>
                  <div className="entity-item-card__title">{template.name}</div>
                  <Text type="secondary">{template.entries.length} упражнений</Text>
                </div>
                <Flex gap={4}>
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
    </Card>
  )
}
