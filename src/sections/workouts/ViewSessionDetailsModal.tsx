import { Card, Descriptions, Empty, Flex, Modal, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import type { WorkoutSession } from '../../types'
import { formatDate } from '../../utils'

const { Text } = Typography

type ViewSessionDetailsModalProps = {
  open: boolean
  session: WorkoutSession | null
  renderEntries: (entries: WorkoutSession['entries']) => ReactNode
  onClose: () => void
}

const sourceTypeLabels: Record<WorkoutSession['sourceType'], string> = {
  manual: 'Вручную',
  template: 'Из шаблона',
  scheduled: 'Из календаря',
}

export function ViewSessionDetailsModal({
  open,
  session,
  renderEntries,
  onClose,
}: ViewSessionDetailsModalProps) {
  return (
    <Modal
      title="Детали тренировки"
      open={open}
      onCancel={onClose}
      onOk={onClose}
      okText="Закрыть"
      cancelButtonProps={{ style: { display: 'none' } }}
      width={1080}
    >
      {session ? (
        <Flex vertical gap={16}>
          <Descriptions
            bordered
            size="small"
            column={{ xs: 1, md: 2 }}
            items={[
              { key: 'title', label: 'Тренировка', children: session.title },
              {
                key: 'date',
                label: 'Дата',
                children: formatDate(session.date),
              },
              {
                key: 'source',
                label: 'Источник',
                children: <Tag>{sourceTypeLabels[session.sourceType]}</Tag>,
              },
              {
                key: 'notes',
                label: 'Заметка',
                children: session.notes || 'Без заметки',
              },
            ]}
          />

          <Flex gap={16} wrap="wrap" align="stretch">
            <Card
              title="План"
              className="entity-item-card"
              styles={{ body: { minHeight: 160 } }}
              style={{ flex: 1, minWidth: 320 }}
            >
              {session.plannedEntries && session.plannedEntries.length > 0 ? (
                renderEntries(session.plannedEntries)
              ) : (
                <Empty description="План тренировки не сохранен" />
              )}
            </Card>

            <Card
              title="Факт"
              className="entity-item-card"
              styles={{ body: { minHeight: 160 } }}
              style={{ flex: 1, minWidth: 320 }}
            >
              {session.entries.length > 0 ? (
                renderEntries(session.entries)
              ) : (
                <Empty description="Нет выполненных подходов" />
              )}
            </Card>
          </Flex>

          <Text type="secondary">
            Здесь можно сравнить, что было запланировано в шаблоне или активной
            тренировке, и что в итоге реально было выполнено.
          </Text>
        </Flex>
      ) : null}
    </Modal>
  )
}
