import type {
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
  sessions: [],
  measurements: [],
  sprints: [],
}

type LegacySessionEntry = SessionEntry & {
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

  if (equipmentItem.kind === 'machine') {
    return 'machine'
  }

  if (
    equipmentItem.kind === 'plate' ||
    equipmentItem.kind === 'handle' ||
    equipmentItem.kind === 'lock' ||
    equipmentItem.kind === 'weight'
  ) {
    return 'free_weight'
  }

  if (equipmentItem.kind === 'accessory') {
    return 'accessory'
  }

  return 'other'
}

function normalizeEquipmentAssignments(
  assignments: SessionEquipmentAssignment[] | undefined,
): SessionEquipmentAssignment[] {
  return (assignments ?? [])
    .filter((assignment) => assignment.itemId)
    .map((assignment) => ({
      itemType: assignment.itemType === 'assembly' ? ('assembly' as const) : ('equipment' as const),
      itemId: assignment.itemId,
      quantity: Math.max(1, Number(assignment.quantity) || 1),
    }))
}

function normalizeSessionEntry(entry: LegacySessionEntry): SessionEntry {
  return {
    ...entry,
    equipmentAssignments: Array.isArray(entry.equipmentAssignments)
      ? normalizeEquipmentAssignments(entry.equipmentAssignments)
      : entry.dumbbellAssemblyId
        ? [
            {
              itemType: 'assembly',
              itemId: entry.dumbbellAssemblyId,
              quantity: 1,
            },
          ]
        : [],
    sets: Array.isArray(entry.sets)
      ? entry.sets.map((set) => ({
          reps: Math.max(0, Number(set.reps) || 0),
          weight: Math.max(0, Number(set.weight) || 0),
        }))
      : Array.from({ length: Math.max(1, Number(entry.sets) || 1) }, () => ({
          reps: Math.max(0, Number(entry.reps ?? 0) || 0),
          weight: Math.max(0, Number(entry.weight ?? 0) || 0),
        })),
    notes: entry.notes ?? '',
  }
}

function normalizeData(data: AppData): AppData {
  const assemblyIds = new Set((data.dumbbellAssemblies ?? []).map((item) => item.id))

  return {
    ...data,
    equipment: data.equipment.map((item) => ({
      ...item,
      kind: item.kind ?? 'accessory',
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
    })),
    dumbbellAssemblies: data.dumbbellAssemblies ?? [],
    exercises: data.exercises.map((exercise) => {
      const legacyExercise = exercise as typeof exercise & {
        equipmentIds?: string[]
      } & {
        equipmentRequirements?: Array<{
          category?: EquipmentRequirementCategory
          itemId?: string
          quantity?: number
        }>
      }

      return {
        ...exercise,
        equipmentRequirements: Array.isArray(legacyExercise.equipmentRequirements)
          ? legacyExercise.equipmentRequirements.map((requirement: {
              category?: EquipmentRequirementCategory
              itemId?: string
              quantity?: number
            }) => ({
              category: requirement.category
                ? requirement.category
                : requirement.itemId
                  ? inferRequirementCategory(requirement.itemId, data.equipment, assemblyIds)
                  : 'other',
              quantity: Math.max(1, Number(requirement.quantity) || 1),
            }))
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
      entries: template.entries.map((entry) => normalizeSessionEntry(entry as LegacySessionEntry)),
    })),
    scheduledWorkouts: (data.scheduledWorkouts ?? []).map((item) => ({ ...item })),
    sessions: (data.sessions ?? []).map((session) => ({
      ...session,
      entries: session.entries.map((entry) => normalizeSessionEntry(entry as LegacySessionEntry)),
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
