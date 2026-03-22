import { DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Card, Empty, Flex, Popconfirm, Typography } from 'antd'
import type { ReactNode } from 'react'
import type { WorkoutSession } from '../../types'
import { formatDate } from '../../utils'

const { Text } = Typography

type HistoryTabProps = {
  sessions: WorkoutSession[]
  renderEntries: (entries: WorkoutSession['entries']) => ReactNode
  onEdit: (session: WorkoutSession) => void
  onDelete: (sessionId: string) => void
}

export function HistoryTab({
  sessions,
  renderEntries,
  onEdit,
  onDelete,
}: HistoryTabProps) {
  if (sessions.length === 0) {
    return <Empty description="Выполненных тренировок пока нет" />
  }

  return (
    <Flex vertical gap={12}>
      {sessions.slice(0, 5).map((session) => (
        <Card
          key={session.id}
          size="small"
          className="entity-item-card"
          styles={{ body: { padding: 16 } }}
        >
          <div className="entity-item-card__header">
            <div>
              <div className="entity-item-card__title">{session.title}</div>
              <Text type="secondary">
                {formatDate(session.date)} · {session.entries.length} упражнений
              </Text>
            </div>
            <Flex gap={4}>
              <Button
                type="text"
                icon={<EditOutlined />}
                aria-label="Редактировать тренировку"
                onClick={() => onEdit(session)}
              />
              <Popconfirm
                title="Удалить тренировку?"
                description="Тренировка будет удалена из календаря и истории."
                okText="Удалить"
                cancelText="Отмена"
                onConfirm={() => onDelete(session.id)}
              >
                <Button
                  danger
                  type="text"
                  icon={<DeleteOutlined />}
                  aria-label="Удалить тренировку"
                />
              </Popconfirm>
            </Flex>
          </div>
          <Flex vertical gap={10}>
            <Text type="secondary">{session.notes || 'Без заметки'}</Text>
            {renderEntries(session.entries)}
          </Flex>
        </Card>
      ))}
    </Flex>
  )
}
