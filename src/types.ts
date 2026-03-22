export type EquipmentKind =
  | 'plate'
  | 'handle'
  | 'lock'
  | 'barbell_bar'
  | 'kettlebell'
  | 'bench'
  | 'pullup_bar'
  | 'dip_bars'
  | 'rack'
  | 'machine'
  | 'cable_station'
  | 'band'
  | 'accessory_other'

export type EquipmentRequirementCategory =
  | 'dumbbell'
  | 'barbell'
  | 'kettlebell'
  | 'bench'
  | 'pullup_bar'
  | 'dip_bars'
  | 'rack'
  | 'machine'
  | 'cable_station'
  | 'band'
  | 'bodyweight'
  | 'other'

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
  category: EquipmentRequirementCategory
  quantity: number
}

export interface SessionEntry {
  id: string
  exerciseId: string
  sets: SessionSet[]
  notes: string
}

export interface SessionSet {
  reps: number
  weightKg: number | null
  equipmentAssignments: SessionEquipmentAssignment[]
}

export interface SessionEquipmentAssignment {
  itemType: 'equipment' | 'assembly'
  itemId: string
  quantity: number
}

export type ActiveWorkoutSetStatus = 'pending' | 'completed' | 'skipped'

export interface ActiveWorkoutSet {
  id: string
  plannedReps: number
  actualReps: number
  plannedWeightKg: number | null
  actualWeightKg: number | null
  plannedEquipmentAssignments: SessionEquipmentAssignment[]
  actualEquipmentAssignments: SessionEquipmentAssignment[]
  notes: string
  status: ActiveWorkoutSetStatus
}

export interface ActiveWorkoutEntry {
  id: string
  exerciseId: string
  exerciseName: string
  notes: string
  sets: ActiveWorkoutSet[]
}

export interface ActiveWorkout {
  id: string
  date: string
  title: string
  notes: string
  sourceType: 'manual' | 'template' | 'scheduled'
  sourceTemplateId: string | null
  sourceScheduledWorkoutId: string | null
  startedAt: string
  updatedAt: string
  entries: ActiveWorkoutEntry[]
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
  plannedEntries: SessionEntry[] | null
  sourceType: 'manual' | 'template' | 'scheduled'
  sourceTemplateId: string | null
  createdAt: string
}

export interface WorkoutTemplate {
  id: string
  name: string
  notes: string
  entries: SessionEntry[]
  createdAt: string
}

export interface ScheduledWorkout {
  id: string
  date: string
  templateId: string
  templateName: string
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
  workoutTemplates: WorkoutTemplate[]
  scheduledWorkouts: ScheduledWorkout[]
  activeWorkout: ActiveWorkout | null
  sessions: WorkoutSession[]
  measurements: MeasurementRecord[]
  sprints: Sprint[]
}

export interface UserScopedData {
  equipment: EquipmentItem[]
  dumbbellAssemblies: DumbbellAssembly[]
  exercises: Exercise[]
  workoutTemplates: WorkoutTemplate[]
  scheduledWorkouts: ScheduledWorkout[]
  activeWorkout: ActiveWorkout | null
  sessions: WorkoutSession[]
  measurements: MeasurementRecord[]
  sprints: Sprint[]
}

export interface RootData {
  activeUserId: string | null
  users: UserProfile[]
  userDataById: Record<string, UserScopedData>
}
