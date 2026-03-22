import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  Popconfirm,
  Tag,
  Typography,
  type FormInstance,
} from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type { EquipmentItem } from '../../types'
import { EquipmentFields } from './EquipmentFields'
import {
  formatEquipmentSummary,
  formatEquipmentTitle,
  getKindLabel,
} from './helpers'
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
  const [searchValue, setSearchValue] = useState('')

  const filteredEquipment = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) {
      return equipment
    }

    return equipment.filter((item) => {
      const searchableText = [
        formatEquipmentTitle(item),
        formatEquipmentSummary(item),
        getKindLabel(item.kind),
        item.notes,
      ]
        .join(' ')
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [equipment, searchValue])

  return (
    <Flex vertical gap={24}>
      <Card size="small" className="entity-item-card">
        <Title level={5}>Каталог инвентаря</Title>
        <Text type="secondary">
          Здесь мы храним не только детали для сборки гантелей, но и все, что
          может понадобиться упражнениям: скамьи, турники, стойки, тренажеры и
          другие опорные или нагрузочные снаряды.
        </Text>
        <div style={{ marginTop: 16 }}>
          <Form form={form} layout="vertical" onFinish={onSubmit}>
            <EquipmentFields form={form} />
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              Сохранить элемент
            </Button>
          </Form>
        </div>
      </Card>

      <Input.Search
        allowClear
        placeholder="Поиск по каталогу компонентов"
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
      />

      {equipment.length === 0 ? (
        <Empty description="Инвентарь пока не добавлен" />
      ) : filteredEquipment.length === 0 ? (
        <Empty description="Ничего не найдено" />
      ) : (
        <Flex vertical gap={12}>
          {filteredEquipment.map((item) => (
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
                    {item.mountSizeMm ? <Tag color="blue">{item.mountSizeMm} мм</Tag> : null}
                  </Flex>
                  <Text type="secondary">{formatEquipmentSummary(item)}</Text>
                </div>
                <Flex gap={4}>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    aria-label="Редактировать элемент"
                    onClick={() => onEdit(item)}
                  />
                  <Popconfirm
                    title="Удалить элемент?"
                    description={
                      item.kind === 'plate'
                        ? 'Сборщик гантели перестанет учитывать этот блин.'
                        : 'Элемент будет удален из каталога.'
                    }
                    okText="Удалить"
                    cancelText="Отмена"
                    onConfirm={() => onDelete(item.id)}
                  >
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      aria-label="Удалить элемент"
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
