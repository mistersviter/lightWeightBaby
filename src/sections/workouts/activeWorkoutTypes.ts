import type { SessionEquipmentAssignment } from '../../types'

export type ActiveWorkoutSetUpdateValues = Partial<{
  actualReps: number
  actualWeightKg: number | null
  actualEquipmentAssignments: SessionEquipmentAssignment[]
  notes: string
  status: 'pending' | 'completed' | 'skipped'
}>
