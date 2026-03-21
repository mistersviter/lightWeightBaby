export type EquipmentKind =
  | 'weight'
  | 'plate'
  | 'handle'
  | 'lock'
  | 'machine'
  | 'accessory'

export interface UserProfile {
  id: string
  login: string
  createdAt: string
}

export interface EquipmentItem {
  id: string
  name: string
  kind: EquipmentKind
  unit: string
  increment: number
  quantity: number
  weightKg: number | null
  thicknessMm: number | null
  diameterMm: number | null
  sleeveLengthMm: number | null
  gripLengthMm: number | null
  mountSizeMm: number | null
  notes: string
  createdAt: string
}

export interface Exercise {
  id: string
  name: string
  primaryMuscleGroup: string
  equipmentRequirements: ExerciseEquipmentRequirement[]
  notes: string
  createdAt: string
}

export interface ExerciseEquipmentRequirement {
  itemId: string
  quantity: number
}

export interface SessionEntry {
  id: string
  exerciseId: string
  dumbbellAssemblyId: string | null
  sets: number
  reps: number
  weight: number
  notes: string
}

export interface DumbbellAssemblyPlateLoad {
  equipmentId: string
  name: string
  countPerSide: number
  weightKg: number
  thicknessMm: number
}

export interface DumbbellAssembly {
  id: string
  name: string
  handleId: string
  handleName: string
  handleWeightKg: number
  lockId: string | null
  lockName: string | null
  lockWeightKg: number
  totalWeightKg: number
  sideThicknessMm: number
  mountSizeMm: number | null
  platesPerSide: DumbbellAssemblyPlateLoad[]
  createdAt: string
}

export interface WorkoutSession {
  id: string
  date: string
  title: string
  notes: string
  entries: SessionEntry[]
  createdAt: string
}

export interface MeasurementRecord {
  id: string
  date: string
  bodyWeight: number
  chest: number
  waist: number
  hips: number
  arm: number
  thigh: number
  notes: string
  createdAt: string
}

export interface Sprint {
  id: string
  name: string
  startDate: string
  durationDays: number
  goal: string
  focus: string
  createdAt: string
}

export interface AppData {
  activeUserId: string | null
  users: UserProfile[]
  equipment: EquipmentItem[]
  dumbbellAssemblies: DumbbellAssembly[]
  exercises: Exercise[]
  sessions: WorkoutSession[]
  measurements: MeasurementRecord[]
  sprints: Sprint[]
}
