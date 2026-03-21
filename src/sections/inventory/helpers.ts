import { equipmentKindOptions } from '../../constants'
import type { EquipmentItem, EquipmentKind } from '../../types'

export function getKindLabel(kind: EquipmentKind) {
  for (const group of equipmentKindOptions) {
    const option = group.options.find((item) => item.value === kind)
    if (option) {
      return option.label
    }
  }

  return 'Элемент инвентаря'
}

export function formatEquipmentTitle(item: EquipmentItem) {
  if (
    (item.kind === 'plate' ||
      item.kind === 'handle' ||
      item.kind === 'lock' ||
      item.kind === 'barbell_bar' ||
      item.kind === 'kettlebell') &&
    item.weightKg
  ) {
    return `${item.name} · ${item.weightKg} кг`
  }

  return item.name
}

export function formatEquipmentSummary(item: EquipmentItem) {
  if (item.kind === 'plate') {
    return `${item.quantity} шт · ${item.thicknessMm ?? 0} мм толщины`
  }

  if (item.kind === 'handle') {
    return `${item.quantity} шт · втулка ${item.sleeveLengthMm ?? 0} мм`
  }

  if (item.kind === 'lock') {
    return `${item.quantity} шт · ${item.thicknessMm ?? 0} мм толщины`
  }

  if (item.kind === 'barbell_bar') {
    return `${item.quantity} шт · втулка ${item.sleeveLengthMm ?? 0} мм`
  }

  if (item.kind === 'kettlebell') {
    return `${item.quantity} шт`
  }

  return `${getKindLabel(item.kind)} · ${item.quantity} шт`
}
