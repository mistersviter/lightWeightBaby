import { useEffect, useMemo, useState } from 'react'
import { Form, Modal, Tabs } from 'antd'
import { defaultEquipmentFormValues } from '../constants'
import {
  buildDumbbellConfigurations,
  type DumbbellBuildResult,
} from '../dumbbellBuilder'
import { useAppStore } from '../store/appStore'
import type { EquipmentItem } from '../types'
import { AssembliesTab } from './inventory/AssembliesTab'
import { ComponentsCatalogTab } from './inventory/ComponentsCatalogTab'
import { DumbbellBuilderTab } from './inventory/DumbbellBuilderTab'
import { EquipmentFields } from './inventory/EquipmentFields'
import type { EquipmentFormValues } from './inventory/types'

export function InventorySection() {
  const [form] = Form.useForm<EquipmentFormValues>()
  const [editForm] = Form.useForm<EquipmentFormValues>()
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null)
  const [selectedHandleId, setSelectedHandleId] = useState('')
  const [selectedLockId, setSelectedLockId] = useState('')
  const [targetWeightKg, setTargetWeightKg] = useState(10)

  const equipment = useAppStore((state) => state.data.equipment)
  const dumbbellAssemblies = useAppStore((state) => state.data.dumbbellAssemblies)
  const saveEquipment = useAppStore((state) => state.saveEquipment)
  const updateEquipment = useAppStore((state) => state.updateEquipment)
  const deleteEquipment = useAppStore((state) => state.deleteEquipment)
  const saveDumbbellAssembly = useAppStore((state) => state.saveDumbbellAssembly)

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

  const effectiveHandleId = selectedHandleId || handles[0]?.id || ''
  const selectedHandle =
    handles.find((item) => item.id === effectiveHandleId) ?? null
  const selectedLock = locks.find((item) => item.id === selectedLockId) ?? null

  const buildResults = useMemo(() => {
    if (!selectedHandle || targetWeightKg <= 0) {
      return []
    }

    return buildDumbbellConfigurations({
      handle: selectedHandle,
      plates,
      lock: selectedLock,
      targetWeightKg,
    })
  }, [plates, selectedHandle, selectedLock, targetWeightKg])

  const exactResults = buildResults.filter(
    (result) => Math.abs(result.deltaKg) < 0.01,
  )
  const nearestResults = buildResults.filter(
    (result) => Math.abs(result.deltaKg) >= 0.01,
  )

  const handleCreateEquipment = async (values: EquipmentFormValues) => {
    await saveEquipment(values)
    form.resetFields()
    form.setFieldsValue(defaultEquipmentFormValues)
  }

  const openEditModal = (item: EquipmentItem) => {
    setEditingItem(item)
    editForm.setFieldsValue({
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
    })
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
    if (!selectedHandle) {
      return
    }

    await saveDumbbellAssembly({
      name: `Гантель ${result.totalWeightKg} кг`,
      handleId: selectedHandle.id,
      handleName: selectedHandle.name,
      handleWeightKg: selectedHandle.weightKg ?? 0,
      lockId: result.lock?.equipmentId ?? null,
      lockName: result.lock?.name ?? null,
      lockWeightKg: result.lock?.weightKg ?? 0,
      totalWeightKg: result.totalWeightKg,
      sideThicknessMm: result.sideThicknessMm,
      mountSizeMm: selectedHandle.mountSizeMm,
      platesPerSide: result.platesPerSide,
    })
  }

  const handleHandleChange = (handleId: string) => {
    setSelectedHandleId(handleId)
    const nextHandle = handles.find((item) => item.id === handleId)
    if (nextHandle?.weightKg) {
      setTargetWeightKg(nextHandle.weightKg)
    }
  }

  return (
    <>
      <Tabs
        items={[
          {
            key: 'catalog',
            label: 'Компоненты',
            children: (
              <ComponentsCatalogTab
                form={form}
                equipment={equipment}
                onSubmit={handleCreateEquipment}
                onEdit={openEditModal}
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
                onHandleChange={handleHandleChange}
                onLockChange={setSelectedLockId}
                onTargetWeightChange={setTargetWeightKg}
                onSaveBuild={(result) => void handleSaveBuild(result)}
              />
            ),
          },
          {
            key: 'assemblies',
            label: 'Сохраненные снаряды',
            children: <AssembliesTab dumbbellAssemblies={dumbbellAssemblies} />,
          },
        ]}
      />

      <Modal
        title="Редактировать компонент"
        open={Boolean(editingItem)}
        onOk={() => void handleEdit()}
        onCancel={() => {
          setEditingItem(null)
          editForm.resetFields()
        }}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={editForm} layout="vertical">
          <EquipmentFields form={editForm} />
        </Form>
      </Modal>
    </>
  )
}
