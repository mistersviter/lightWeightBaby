import {
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Popconfirm,
  Tag,
  Typography,
  type FormInstance,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { EquipmentItem } from '../../types'
import { EquipmentFields } from './EquipmentFields'
import { formatEquipmentSummary, formatEquipmentTitle, getKindLabel } from './helpers'
import type { EquipmentFormValues } from './types'

const { Text, Title } = Typography

type ComponentsCatalogTabProps = {
  form: FormInstance<EquipmentFormValues>
  equipment: EquipmentItem[]
  onSubmit: (values: EquipmentFormValues) => Promise<void>
  onEdit: (item: EquipmentItem) => void
  onDelete: (equipmentId: string) => void
}

export function ComponentsCatalogTab({
  form,
  equipment,
  onSubmit,
  onEdit,
  onDelete,
}: ComponentsCatalogTabProps) {
  return (
    <Flex vertical gap={24}>
      <Card size="small" className="entity-item-card">
        <Title level={5}>Каталог компонентов</Title>
        <Text type="secondary">
          Для разборной гантели лучше заносить по отдельности блины, рукоятки и
          замки, чтобы потом собирать реальные конфигурации по весу и габаритам.
        </Text>
        <div style={{ marginTop: 16 }}>
          <Form form={form} layout="vertical" onFinish={onSubmit}>
            <EquipmentFields form={form} />
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              Сохранить компонент
            </Button>
          </Form>
        </div>
      </Card>

      {equipment.length === 0 ? (
        <Empty description="Инвентарь пока не добавлен" />
      ) : (
        <Flex vertical gap={12}>
          {equipment.map((item) => (
            <Card
              key={item.id}
              size="small"
              className="entity-item-card"
              styles={{ body: { padding: 16 } }}
            >
              <div className="entity-item-card__header">
                <div>
                  <div className="entity-item-card__title">
                    {formatEquipmentTitle(item)}
                  </div>
                  <Flex gap={8} wrap="wrap">
                    <Tag>{getKindLabel(item.kind)}</Tag>
                    {item.mountSizeMm ? (
                      <Tag color="blue">{item.mountSizeMm} мм</Tag>
                    ) : null}
                  </Flex>
                  <Text type="secondary">{formatEquipmentSummary(item)}</Text>
                </div>
                <Flex gap={4}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    aria-label="Редактировать компонент"
                    onClick={() => onEdit(item)}
                  />
                  <Popconfirm
                    title="Удалить компонент?"
                    description={
                      item.kind === 'plate'
                        ? 'Сборщик гантели перестанет учитывать этот блин.'
                        : 'Компонент будет удален из каталога.'
                    }
                    okText="Удалить"
                    cancelText="Отмена"
                    onConfirm={() => onDelete(item.id)}
                  >
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      aria-label="Удалить компонент"
                    />
                  </Popconfirm>
                </Flex>
              </div>
              <Text type="secondary">{item.notes || 'Без комментария'}</Text>
            </Card>
          ))}
        </Flex>
      )}
    </Flex>
  )
}
