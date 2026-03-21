import type { EquipmentKind } from '../../types'

export type EquipmentFormValues = {
  name: string
  kind: EquipmentKind
  unit?: string
  increment?: number
  quantity?: number
  weightKg?: number | null
  thicknessMm?: number | null
  diameterMm?: number | null
  sleeveLengthMm?: number | null
  gripLengthMm?: number | null
  mountSizeMm?: number | null
  notes?: string
}
