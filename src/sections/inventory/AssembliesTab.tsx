import { Card, Empty, Flex, Tag, Typography } from 'antd'
import type { DumbbellAssembly } from '../../types'

const { Text } = Typography

type AssembliesTabProps = {
  dumbbellAssemblies: DumbbellAssembly[]
}

export function AssembliesTab({ dumbbellAssemblies }: AssembliesTabProps) {
  if (dumbbellAssemblies.length === 0) {
    return <Empty description="Пока нет сохраненных сборок гантели" />
  }

  return (
    <Flex vertical gap={12}>
      {dumbbellAssemblies.map((assembly) => (
        <Card key={assembly.id} size="small" className="entity-item-card">
          <div className="entity-item-card__title">{assembly.name}</div>
          <Flex gap={8} wrap="wrap">
            <Tag color="blue">{assembly.totalWeightKg} кг</Tag>
            <Tag color="geekblue">
              толщина на сторону {assembly.sideThicknessMm} мм
            </Tag>
            {assembly.mountSizeMm ? (
              <Tag color="purple">посадка {assembly.mountSizeMm} мм</Tag>
            ) : null}
          </Flex>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">
              {`Рукоятка: ${assembly.handleName}${
                assembly.lockName ? ` | Замок: ${assembly.lockName}` : ''
              }`}
            </Text>
          </div>
        </Card>
      ))}
    </Flex>
  )
}
