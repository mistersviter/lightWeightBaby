import { Button, Card, Col, Empty, Flex, InputNumber, Row, Select, Tag, Typography } from 'antd'
import type { DumbbellBuildResult } from '../../dumbbellBuilder'
import type { EquipmentItem } from '../../types'

const { Text, Title } = Typography

type DumbbellBuilderTabProps = {
  handles: EquipmentItem[]
  plates: EquipmentItem[]
  locks: EquipmentItem[]
  effectiveHandleId: string
  selectedHandle: EquipmentItem | null
  selectedLockId: string
  selectedLock: EquipmentItem | null
  targetWeightKg: number
  exactResults: DumbbellBuildResult[]
  nearestResults: DumbbellBuildResult[]
  onHandleChange: (handleId: string) => void
  onLockChange: (lockId: string) => void
  onTargetWeightChange: (weight: number) => void
  onSaveBuild: (result: DumbbellBuildResult) => void
  onGenerateAll: () => void
}

function BuildResultCard({
  result,
  exact,
  onSave,
}: {
  result: DumbbellBuildResult
  exact: boolean
  onSave: (result: DumbbellBuildResult) => void
}) {
  return (
    <Card size="small">
      <div className="entity-item-card__header">
        <div>
          <div className="entity-item-card__title">{result.totalWeightKg} кг</div>
          <Text type="secondary">
            {exact
              ? `Толщина на сторону: ${result.sideThicknessMm} мм`
              : `Отклонение: ${result.deltaKg > 0 ? '+' : ''}${result.deltaKg} кг · толщина на сторону ${result.sideThicknessMm} мм`}
          </Text>
        </div>
        <Flex gap={8} align="center">
          <Tag color={exact ? 'green' : 'gold'}>{exact ? 'Точно' : 'Близко'}</Tag>
          <Button size="small" type={exact ? 'primary' : 'default'} onClick={() => onSave(result)}>
            Создать снаряд
          </Button>
        </Flex>
      </div>
      <Flex vertical gap={4}>
        {result.lock ? (
          <Text>
            Замок: 1 шт на сторону ({result.lock.weightKg} кг, {result.lock.thicknessMm} мм)
          </Text>
        ) : null}
        {result.platesPerSide.map((plate) => (
          <Text key={plate.equipmentId}>
            {plate.name}: {plate.countPerSide} шт на сторону ({plate.weightKg} кг, {plate.thicknessMm} мм)
          </Text>
        ))}
      </Flex>
    </Card>
  )
}

function BuildResultGroup({
  title,
  results,
  exact,
  onSaveBuild,
}: {
  title: string
  results: DumbbellBuildResult[]
  exact: boolean
  onSaveBuild: (result: DumbbellBuildResult) => void
}) {
  if (results.length === 0) {
    return null
  }

  return (
    <Card size="small" className="entity-item-card">
      <Title level={5}>{title}</Title>
      <Flex vertical gap={12}>
        {results.map((result, index) => (
          <BuildResultCard
            key={`${exact ? 'exact' : 'near'}-${index}`}
            result={result}
            exact={exact}
            onSave={onSaveBuild}
          />
        ))}
      </Flex>
    </Card>
  )
}

export function DumbbellBuilderTab({
  handles,
  plates,
  locks,
  effectiveHandleId,
  selectedHandle,
  selectedLockId,
  selectedLock,
  targetWeightKg,
  exactResults,
  nearestResults,
  onHandleChange,
  onLockChange,
  onTargetWeightChange,
  onSaveBuild,
  onGenerateAll,
}: DumbbellBuilderTabProps) {
  return (
    <Flex vertical gap={24}>
      <Card size="small" className="entity-item-card">
        <Title level={5}>Подбор конфигурации</Title>
        <Text type="secondary">
          Сборка считается для одной разборной гантели. Приложение учитывает симметричную
          развесовку, доступное количество блинов, посадочный размер и суммарную толщину
          блинов на каждой втулке.
        </Text>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <div className="inventory-helper-label">Рукоятка</div>
            <Select
              style={{ width: '100%' }}
              value={effectiveHandleId || undefined}
              options={handles.map((item) => ({
                value: item.id,
                label: `${item.name} · втулка ${item.sleeveLengthMm ?? 0} мм`,
              }))}
              placeholder="Выберите рукоятку"
              onChange={onHandleChange}
            />
          </Col>
          <Col xs={24} md={12}>
            <div className="inventory-helper-label">Замок</div>
            <Select
              allowClear
              style={{ width: '100%' }}
              value={selectedLockId || undefined}
              options={locks.map((item) => ({
                value: item.id,
                label: `${item.name} · ${item.weightKg ?? 0} кг`,
              }))}
              placeholder="Без замка"
              onChange={(value) => onLockChange(value ?? '')}
            />
          </Col>
          <Col xs={24} md={12}>
            <div className="inventory-helper-label">Целевой вес, кг</div>
            <InputNumber
              min={0}
              step={0.25}
              style={{ width: '100%' }}
              value={targetWeightKg}
              onChange={(value) => onTargetWeightChange(value ?? 0)}
            />
          </Col>
          <Col xs={24} md={12}>
            <div className="inventory-helper-label">Все возможные конфигурации</div>
            <Button block onClick={onGenerateAll} disabled={!selectedHandle || plates.length === 0}>
              Сгенерировать все варианты
            </Button>
          </Col>
        </Row>
      </Card>

      {!selectedHandle || plates.length === 0 ? (
        <Empty description="Чтобы собирать гантель, добавьте хотя бы одну рукоятку и набор блинов" />
      ) : (
        <>
          <Card size="small" className="entity-item-card">
            <Title level={5}>Ограничения выбранной рукоятки</Title>
            <Flex gap={8} wrap="wrap">
              <Tag color="blue">Вес рукоятки: {selectedHandle.weightKg ?? 0} кг</Tag>
              <Tag color="geekblue">
                Длина втулки: {selectedHandle.sleeveLengthMm ?? 0} мм на сторону
              </Tag>
              {selectedHandle.mountSizeMm ? (
                <Tag color="purple">Посадка: {selectedHandle.mountSizeMm} мм</Tag>
              ) : null}
              {selectedLock ? (
                <Tag color="gold">
                  Замок: {selectedLock.name} · {selectedLock.weightKg ?? 0} кг · {selectedLock.thicknessMm ?? 0} мм
                </Tag>
              ) : null}
            </Flex>
          </Card>

          {exactResults.length === 0 && nearestResults.length === 0 ? (
            <Empty description="Не удалось найти ни одной допустимой сборки под текущие ограничения" />
          ) : (
            <Flex vertical gap={16}>
              <BuildResultGroup title="Точные совпадения" results={exactResults} exact onSaveBuild={onSaveBuild} />
              <BuildResultGroup
                title="Ближайшие варианты"
                results={nearestResults.slice(0, 6)}
                exact={false}
                onSaveBuild={onSaveBuild}
              />
            </Flex>
          )}
        </>
      )}
    </Flex>
  )
}
