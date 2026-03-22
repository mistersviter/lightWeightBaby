import type {
  ActiveWorkout,
  AppData,
  EquipmentItem,
  EquipmentRequirementCategory,
  SessionEntry,
  SessionEquipmentAssignment,
} from './types'

const DB_NAME = 'lightWeightBaby'
const STORE_NAME = 'kv'
const DATA_KEY = 'app-data'

export const defaultData: AppData = {
  activeUserId: null,
  users: [],
  equipment: [],
  dumbbellAssemblies: [],
  exercises: [],
  workoutTemplates: [],
  scheduledWorkouts: [],
  activeWorkout: null,
  sessions: [],
  measurements: [],
  sprints: [],
}

type LegacyEquipmentKind = EquipmentItem['kind'] | 'weight' | 'accessory'
type LegacyRequirementCategory =
  | EquipmentRequirementCategory
  | 'free_weight'
  | 'accessory'

type LegacyExerciseRequirement = {
  category?: LegacyRequirementCategory
  itemId?: string
  quantity?: number
}

type LegacySessionEntry = SessionEntry & {
  equipmentAssignments?: SessionEquipmentAssignment[]
  dumbbellAssemblyId?: string
  reps?: number
  weight?: number
}

function inferRequirementCategory(
  itemId: string,
  equipment: EquipmentItem[],
  assemblyIds: Set<string>,
): EquipmentRequirementCategory {
  if (assemblyIds.has(itemId)) {
    return 'dumbbell'
  }

  const equipmentItem = equipment.find((item) => item.id === itemId)
  if (!equipmentItem) {
    return 'other'
  }

  switch (equipmentItem.kind) {
    case 'machine':
      return 'machine'
    case 'cable_station':
      return 'cable_station'
    case 'band':
      return 'band'
    case 'kettlebell':
      return 'kettlebell'
    case 'bench':
      return 'bench'
    case 'pullup_bar':
      return 'pullup_bar'
    case 'dip_bars':
      return 'dip_bars'
    case 'rack':
      return 'rack'
    case 'barbell_bar':
      return 'barbell'
    case 'plate':
    case 'handle':
    case 'lock':
      return 'dumbbell'
    default:
      return 'other'
  }
}

function normalizeEquipmentAssignments(
  assignments: SessionEquipmentAssignment[] | undefined,
): SessionEquipmentAssignment[] {
  return (assignments ?? [])
    .filter((assignment) => assignment.itemId)
    .map((assignment) => ({
      itemType:
        assignment.itemType === 'assembly'
          ? ('assembly' as const)
          : ('equipment' as const),
      itemId: assignment.itemId,
      quantity: Math.max(1, Number(assignment.quantity) || 1),
    }))
}

function normalizeSessionEntry(entry: LegacySessionEntry): SessionEntry {
  const legacyAssignments = Array.isArray(entry.equipmentAssignments)
    ? normalizeEquipmentAssignments(entry.equipmentAssignments)
    : entry.dumbbellAssemblyId
      ? [
          {
            itemType: 'assembly' as const,
            itemId: entry.dumbbellAssemblyId,
            quantity: 1,
          },
        ]
      : []

  return {
    ...entry,
    sets: Array.isArray(entry.sets)
      ? entry.sets.map((set) => ({
          reps: Math.max(0, Number(set.reps) || 0),
          weightKg:
            'weightKg' in set && set.weightKg !== undefined && set.weightKg !== null
              ? Math.max(0, Number(set.weightKg) || 0)
              : 'weight' in set && set.weight !== undefined && set.weight !== null
                ? Math.max(0, Number(set.weight) || 0)
                : null,
          equipmentAssignments:
            'equipmentAssignments' in set && Array.isArray(set.equipmentAssignments)
              ? normalizeEquipmentAssignments(set.equipmentAssignments)
              : legacyAssignments,
        }))
      : Array.from({ length: Math.max(1, Number(entry.sets) || 1) }, () => ({
          reps: Math.max(0, Number(entry.reps ?? 0) || 0),
          weightKg:
            entry.weight !== undefined && entry.weight !== null
              ? Math.max(0, Number(entry.weight) || 0)
              : null,
          equipmentAssignments: legacyAssignments,
        })),
    notes: entry.notes ?? '',
  }
}

function normalizeActiveWorkout(activeWorkout: ActiveWorkout | null | undefined) {
  if (!activeWorkout) {
    return null
  }

  return {
    ...activeWorkout,
    sourceType:
      activeWorkout.sourceType === 'scheduled' ? ('scheduled' as const) : ('template' as const),
    sourceScheduledWorkoutId: activeWorkout.sourceScheduledWorkoutId ?? null,
    entries: (activeWorkout.entries ?? []).map((entry) => ({
      ...entry,
      notes: entry.notes ?? '',
      sets: (entry.sets ?? []).map((set) => ({
        ...set,
        plannedReps: Math.max(0, Number(set.plannedReps) || 0),
        actualReps: Math.max(0, Number(set.actualReps ?? set.plannedReps) || 0),
        plannedWeightKg:
          set.plannedWeightKg === undefined || set.plannedWeightKg === null
            ? null
            : Math.max(0, Number(set.plannedWeightKg) || 0),
        actualWeightKg:
          set.actualWeightKg === undefined || set.actualWeightKg === null
            ? null
            : Math.max(0, Number(set.actualWeightKg) || 0),
        plannedEquipmentAssignments: normalizeEquipmentAssignments(
          set.plannedEquipmentAssignments,
        ),
        actualEquipmentAssignments: normalizeEquipmentAssignments(
          set.actualEquipmentAssignments,
        ),
        notes: set.notes ?? '',
        status:
          set.status === 'completed' || set.status === 'skipped'
            ? set.status
            : ('pending' as const),
      })),
    })),
  }
}

function normalizeData(data: AppData): AppData {
  const assemblyIds = new Set((data.dumbbellAssemblies ?? []).map((item) => item.id))

  return {
    ...data,
    equipment: data.equipment.map((item) => {
      const legacyKind = item.kind as LegacyEquipmentKind

      return {
        ...item,
        kind:
          legacyKind === 'weight' || legacyKind === 'accessory'
            ? 'accessory_other'
            : item.kind ?? 'accessory_other',
        unit: item.unit ?? 'кг',
        increment: item.increment ?? 0,
        quantity: item.quantity ?? 1,
        weightKg: item.weightKg ?? null,
        thicknessMm:
          ('thicknessMm' in item && item.thicknessMm !== undefined
            ? item.thicknessMm
            : 'thicknessCm' in item && item.thicknessCm !== undefined
              ? Number(item.thicknessCm) * 10
              : null) ?? null,
        diameterMm:
          ('diameterMm' in item && item.diameterMm !== undefined
            ? item.diameterMm
            : 'diameterCm' in item && item.diameterCm !== undefined
              ? Number(item.diameterCm) * 10
              : null) ?? null,
        sleeveLengthMm:
          ('sleeveLengthMm' in item && item.sleeveLengthMm !== undefined
            ? item.sleeveLengthMm
            : 'sleeveLengthCm' in item && item.sleeveLengthCm !== undefined
              ? Number(item.sleeveLengthCm) * 10
              : null) ?? null,
        gripLengthMm:
          ('gripLengthMm' in item && item.gripLengthMm !== undefined
            ? item.gripLengthMm
            : 'gripLengthCm' in item && item.gripLengthCm !== undefined
              ? Number(item.gripLengthCm) * 10
              : null) ?? null,
        mountSizeMm:
          ('mountSizeMm' in item && item.mountSizeMm !== undefined
            ? item.mountSizeMm
            : 'mountStandard' in item && item.mountStandard !== undefined
              ? Number.parseFloat(String(item.mountStandard).replace(',', '.'))
              : null) ?? null,
        notes: item.notes ?? '',
      }
    }),
    dumbbellAssemblies: data.dumbbellAssemblies ?? [],
    exercises: data.exercises.map((exercise) => {
      const legacyExercise = exercise as typeof exercise & {
        equipmentIds?: string[]
        equipmentRequirements?: Array<LegacyExerciseRequirement>
      }

      return {
        ...exercise,
        equipmentRequirements: Array.isArray(legacyExercise.equipmentRequirements)
          ? legacyExercise.equipmentRequirements.map((requirement: LegacyExerciseRequirement) => {
              const legacyCategory = requirement.category

              return {
                category: legacyCategory
                  ? legacyCategory === 'free_weight'
                    ? 'dumbbell'
                    : legacyCategory === 'accessory'
                      ? 'other'
                      : legacyCategory
                  : requirement.itemId
                    ? inferRequirementCategory(requirement.itemId, data.equipment, assemblyIds)
                    : 'other',
                quantity: Math.max(1, Number(requirement.quantity) || 1),
              }
            })
          : Array.isArray(legacyExercise.equipmentIds)
            ? legacyExercise.equipmentIds.map((itemId) => ({
                category: inferRequirementCategory(itemId, data.equipment, assemblyIds),
                quantity: 1,
              }))
            : [],
        notes: exercise.notes ?? '',
      }
    }),
    workoutTemplates: (data.workoutTemplates ?? []).map((template) => ({
      ...template,
      notes: template.notes ?? '',
      entries: template.entries.map((entry) =>
        normalizeSessionEntry(entry as LegacySessionEntry),
      ),
    })),
    scheduledWorkouts: (data.scheduledWorkouts ?? []).map((item) => ({ ...item })),
    activeWorkout: normalizeActiveWorkout(data.activeWorkout),
    sessions: (data.sessions ?? []).map((session) => ({
      ...session,
      entries: session.entries.map((entry) =>
        normalizeSessionEntry(entry as LegacySessionEntry),
      ),
    })),
  }
}

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function readAppData() {
  const db = await openDb()

  return new Promise<AppData>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(DATA_KEY)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = request.result as AppData | undefined
      resolve(result ? normalizeData(result) : defaultData)
    }
  })
}

export async function writeAppData(data: AppData) {
  const db = await openDb()

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(data, DATA_KEY)

    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}
