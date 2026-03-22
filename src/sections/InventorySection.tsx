import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Card,
  Empty,
  Flex,
  Form,
  Modal,
  Tag,
  Tabs,
  Typography,
} from 'antd'
import { defaultEquipmentFormValues } from '../constants'
import {
  buildAllDumbbellConfigurations,
  buildDumbbellConfigurations,
  type DumbbellBuildResult,
} from '../dumbbellBuilder'
import { useAppStore } from '../store/appStore'
import type { DumbbellAssembly, EquipmentItem } from '../types'
import { AssembliesTab } from './inventory/AssembliesTab'
import { ComponentsCatalogTab } from './inventory/ComponentsCatalogTab'
import { DumbbellBuilderTab } from './inventory/DumbbellBuilderTab'
import { EquipmentFields } from './inventory/EquipmentFields'
import type { EquipmentFormValues } from './inventory/types'

const { Text } = Typography

function buildSignatureFromResult(
  handleId: string,
  lockId: string | null,
  result: DumbbellBuildResult,
) {
  return JSON.stringify({
    handleId,
    lockId,
    totalWeightKg: result.totalWeightKg,
    sideThicknessMm: result.sideThicknessMm,
    platesPerSide: result.platesPerSide
      .map((plate) => ({
        equipmentId: plate.equipmentId,
        countPerSide: plate.countPerSide,
      }))
      .sort((left, right) => left.equipmentId.localeCompare(right.equipmentId)),
  })
}

function buildSignatureFromAssembly(assembly: DumbbellAssembly) {
  return JSON.stringify({
    handleId: assembly.handleId,
    lockId: assembly.lockId,
    totalWeightKg: assembly.totalWeightKg,
    sideThicknessMm: assembly.sideThicknessMm,
    platesPerSide: assembly.platesPerSide
      .map((plate) => ({
        equipmentId: plate.equipmentId,
        countPerSide: plate.countPerSide,
      }))
      .sort((left, right) => left.equipmentId.localeCompare(right.equipmentId)),
  })
}

function formatBuildComposition(result: DumbbellBuildResult) {
  const parts: string[] = []

  if (result.lock) {
    parts.push(`замок ${result.lock.name}`)
  }

  for (const plate of result.platesPerSide) {
    parts.push(`${plate.name} × ${plate.countPerSide} на сторону`)
  }

  return parts.length > 0 ? parts.join(', ') : 'Без блинов, только рукоятка'
}

function formatPlateLine(result: DumbbellBuildResult) {
  if (result.platesPerSide.length === 0) {
    return 'Без блинов'
  }

  return result.platesPerSide
    .map((plate) => `${plate.name} × ${plate.countPerSide}/сторона`)
    .join(' • ')
}

function mapEquipmentToFormValues(item: EquipmentItem): EquipmentFormValues {
  return {
    name: item.name,
    kind: item.kind,
    unit: item.unit,
    increment: item.increment,
    quantity: item.quantity,
    weightKg: item.weightKg,
    thicknessMm: item.thicknessMm,
    diameterMm: item.diameterMm,
    sleeveLengthMm: item.sleeveLengthMm,
    gripLengthMm: item.gripLengthMm,
    mountSizeMm: item.mountSizeMm,
    notes: item.notes,
  }
}

export function InventorySection() {
  const [form] = Form.useForm<EquipmentFormValues>()
  const [editForm] = Form.useForm<EquipmentFormValues>()
  const equipment = useAppStore((state) => state.data.equipment)
  const dumbbellAssemblies = useAppStore((state) => state.data.dumbbellAssemblies)
  const saveEquipment = useAppStore((state) => state.saveEquipment)
  const updateEquipment = useAppStore((state) => state.updateEquipment)
  const deleteEquipment = useAppStore((state) => state.deleteEquipment)
  const saveDumbbellAssembly = useAppStore((state) => state.saveDumbbellAssembly)
  const deleteDumbbellAssembly = useAppStore((state) => state.deleteDumbbellAssembly)

  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null)
  const [selectedHandleId, setSelectedHandleId] = useState('')
  const [selectedLockId, setSelectedLockId] = useState('')
  const [targetWeightKg, setTargetWeightKg] = useState(12.5)
  const [bulkBuildOpen, setBulkBuildOpen] = useState(false)
  const [isSavingAllBuilds, setIsSavingAllBuilds] = useState(false)

  useEffect(() => {
    form.setFieldsValue(defaultEquipmentFormValues)
  }, [form])

  const handles = useMemo(
    () => equipment.filter((item) => item.kind === 'handle'),
    [equipment],
  )
  const plates = useMemo(
    () => equipment.filter((item) => item.kind === 'plate'),
    [equipment],
  )
  const locks = useMemo(
    () => equipment.filter((item) => item.kind === 'lock'),
    [equipment],
  )

  useEffect(() => {
    if (selectedHandleId && !handles.some((item) => item.id === selectedHandleId)) {
      setSelectedHandleId('')
    }
  }, [handles, selectedHandleId])

  useEffect(() => {
    if (selectedLockId && !locks.some((item) => item.id === selectedLockId)) {
      setSelectedLockId('')
    }
  }, [locks, selectedLockId])

  const effectiveHandleId = selectedHandleId || handles[0]?.id || ''
  const selectedHandle =
    handles.find((item) => item.id === effectiveHandleId) ?? null
  const selectedLock =
    locks.find((item) => item.id === selectedLockId) ?? null

  const buildResults = useMemo(() => {
    if (!selectedHandle || plates.length === 0) {
      return []
    }

    return buildDumbbellConfigurations({
      handle: selectedHandle,
      plates,
      lock: selectedLock,
      targetWeightKg,
    })
  }, [plates, selectedHandle, selectedLock, targetWeightKg])

  const exactResults = useMemo(
    () => buildResults.filter((result) => result.deltaKg === 0),
    [buildResults],
  )

  const nearestResults = useMemo(
    () => buildResults.filter((result) => result.deltaKg !== 0),
    [buildResults],
  )

  const allBuildResults = useMemo(() => {
    if (!selectedHandle || plates.length === 0) {
      return []
    }

    return buildAllDumbbellConfigurations({
      handle: selectedHandle,
      plates,
      lock: selectedLock,
    })
  }, [plates, selectedHandle, selectedLock])

  const existingAssemblySignatures = useMemo(
    () =>
      new Set(
        dumbbellAssemblies.map((assembly) => buildSignatureFromAssembly(assembly)),
      ),
    [dumbbellAssemblies],
  )

  const pendingAllBuildResults = useMemo(() => {
    if (!selectedHandle) {
      return []
    }

    return allBuildResults.filter(
      (result) =>
        !existingAssemblySignatures.has(
          buildSignatureFromResult(selectedHandle.id, selectedLock?.id ?? null, result),
        ),
    )
  }, [allBuildResults, existingAssemblySignatures, selectedHandle, selectedLock])

  const createAssemblyPayload = (result: DumbbellBuildResult) => {
    if (!selectedHandle) {
      return null
    }

    return {
      name: `Гантель ${result.totalWeightKg} кг`,
      handleId: selectedHandle.id,
      handleName: selectedHandle.name,
      handleWeightKg: selectedHandle.weightKg ?? 0,
      lockId: selectedLock?.id ?? null,
      lockName: selectedLock?.name ?? null,
      lockWeightKg: selectedLock?.weightKg ?? 0,
      totalWeightKg: result.totalWeightKg,
      sideThicknessMm: result.sideThicknessMm,
      mountSizeMm: selectedHandle.mountSizeMm ?? null,
      platesPerSide: result.platesPerSide,
    }
  }

  const handleCreateEquipment = async (values: EquipmentFormValues) => {
    await saveEquipment(values)
    form.resetFields()
    form.setFieldsValue(defaultEquipmentFormValues)
  }

  const handleOpenEdit = (item: EquipmentItem) => {
    setEditingItem(item)
    editForm.setFieldsValue(mapEquipmentToFormValues(item))
  }

  const handleEdit = async () => {
    const values = await editForm.validateFields()
    if (!editingItem) {
      return
    }

    await updateEquipment(editingItem.id, values)
    setEditingItem(null)
    editForm.resetFields()
  }

  const handleSaveBuild = async (result: DumbbellBuildResult) => {
    const payload = createAssemblyPayload(result)
    if (!payload) {
      return
    }

    await saveDumbbellAssembly(payload)
  }

  const handleGenerateAll = () => {
    if (!selectedHandle || plates.length === 0) {
      return
    }

    setBulkBuildOpen(true)
  }

  const handleSaveAllBuilds = async () => {
    if (!selectedHandle || pendingAllBuildResults.length === 0) {
      setBulkBuildOpen(false)
      return
    }

    setIsSavingAllBuilds(true)
    try {
      for (const result of pendingAllBuildResults) {
        const payload = createAssemblyPayload(result)
        if (payload) {
          await saveDumbbellAssembly(payload)
        }
      }
      setBulkBuildOpen(false)
    } finally {
      setIsSavingAllBuilds(false)
    }
  }

  return (
    <>
      <Tabs
        items={[
          {
            key: 'catalog',
            label: 'Каталог компонентов',
            children: (
              <ComponentsCatalogTab
                form={form}
                equipment={equipment}
                onSubmit={handleCreateEquipment}
                onEdit={handleOpenEdit}
                onDelete={(equipmentId) => void deleteEquipment(equipmentId)}
              />
            ),
          },
          {
            key: 'builder',
            label: 'Сборка гантели',
            children: (
              <DumbbellBuilderTab
                handles={handles}
                plates={plates}
                locks={locks}
                effectiveHandleId={effectiveHandleId}
                selectedHandle={selectedHandle}
                selectedLockId={selectedLockId}
                selectedLock={selectedLock}
                targetWeightKg={targetWeightKg}
                exactResults={exactResults}
                nearestResults={nearestResults}
                onHandleChange={setSelectedHandleId}
                onLockChange={setSelectedLockId}
                onTargetWeightChange={setTargetWeightKg}
                onSaveBuild={(result) => void handleSaveBuild(result)}
                onGenerateAll={handleGenerateAll}
              />
            ),
          },
          {
            key: 'assemblies',
            label: 'Сохраненные снаряды',
            children: (
              <AssembliesTab
                dumbbellAssemblies={dumbbellAssemblies}
                onDelete={(assemblyId) => void deleteDumbbellAssembly(assemblyId)}
              />
            ),
          },
        ]}
      />

      <Modal
        width={960}
        title="Сгенерированные варианты гантели"
        open={bulkBuildOpen}
        confirmLoading={isSavingAllBuilds}
        okText={
          pendingAllBuildResults.length > 0
            ? `Создать все (${pendingAllBuildResults.length})`
            : 'Закрыть'
        }
        cancelText="Отмена"
        onOk={() => void handleSaveAllBuilds()}
        onCancel={() => {
          if (!isSavingAllBuilds) {
            setBulkBuildOpen(false)
          }
        }}
      >
        <Flex vertical gap={16}>
          {selectedHandle ? (
            <Alert
              type="info"
              showIcon
              title={`Рукоятка: ${selectedHandle.name}`}
              description={
                selectedLock
                  ? `С замком ${selectedLock.name}. Показаны все допустимые конфигурации, которые помещаются на втулку и подходят по посадке.`
                  : 'Показаны все допустимые конфигурации без учета целевого веса.'
              }
            />
          ) : null}

          {allBuildResults.length === 0 ? (
            <Empty description="Для выбранной рукоятки не нашлось ни одной допустимой сборки." />
          ) : (
            <>
              <Flex gap={8} wrap="wrap">
                <Tag color="green">Будет создано: {pendingAllBuildResults.length}</Tag>
                <Tag color="default">
                  Уже сохранено: {allBuildResults.length - pendingAllBuildResults.length}
                </Tag>
                <Tag color="blue">Всего вариантов: {allBuildResults.length}</Tag>
              </Flex>

              <div style={{ maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
                <Flex vertical gap={12}>
                  {allBuildResults.map((result, index) => {
                    const isAlreadySaved =
                      !selectedHandle ||
                      existingAssemblySignatures.has(
                        buildSignatureFromResult(
                          selectedHandle.id,
                          selectedLock?.id ?? null,
                          result,
                        ),
                      )

                    return (
                      <Card
                        key={`bulk-build-${index}`}
                        size="small"
                        className="entity-item-card bulk-build-card"
                      >
                        <Flex vertical gap={12}>
                          <div className="bulk-build-card__header">
                            <div>
                              <div className="bulk-build-card__weight">
                                {result.totalWeightKg} кг
                              </div>
                              <Text type="secondary">{formatPlateLine(result)}</Text>
                            </div>
                            <Tag color={isAlreadySaved ? 'default' : 'green'}>
                              {isAlreadySaved ? 'Уже сохранено' : 'Будет создано'}
                            </Tag>
                          </div>

                          <div className="bulk-build-card__metrics">
                            <div className="bulk-build-card__metric">
                              <span className="bulk-build-card__metric-label">Толщина</span>
                              <span>{result.sideThicknessMm} мм на сторону</span>
                            </div>
                            <div className="bulk-build-card__metric">
                              <span className="bulk-build-card__metric-label">Состав</span>
                              <span>{formatBuildComposition(result)}</span>
                            </div>
                          </div>

                          <div className="bulk-build-card__details">
                            {result.lock ? (
                              <div className="bulk-build-card__detail-row">
                                <span className="bulk-build-card__detail-name">Замок</span>
                                <span className="bulk-build-card__detail-value">
                                  1 шт на сторону • {result.lock.weightKg} кг • {result.lock.thicknessMm} мм
                                </span>
                              </div>
                            ) : null}

                            {result.platesPerSide.length > 0 ? (
                              result.platesPerSide.map((plate) => (
                                <div
                                  key={plate.equipmentId}
                                  className="bulk-build-card__detail-row"
                                >
                                  <span className="bulk-build-card__detail-name">{plate.name}</span>
                                  <span className="bulk-build-card__detail-value">
                                    {plate.countPerSide} шт на сторону • {plate.weightKg} кг •{' '}
                                    {plate.thicknessMm} мм
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="bulk-build-card__detail-row">
                                <span className="bulk-build-card__detail-name">Блины</span>
                                <span className="bulk-build-card__detail-value">Не используются</span>
                              </div>
                            )}
                          </div>
                        </Flex>
                      </Card>
                    )
                  })}
                </Flex>
              </div>
            </>
          )}
        </Flex>
      </Modal>

      <Modal
        title="Редактировать элемент"
        open={Boolean(editingItem)}
        okText="Сохранить"
        cancelText="Отмена"
        onOk={() => void handleEdit()}
        onCancel={() => {
          setEditingItem(null)
          editForm.resetFields()
        }}
      >
        <Form form={editForm} layout="vertical">
          <EquipmentFields form={editForm} />
        </Form>
      </Modal>
    </>
  )
}
