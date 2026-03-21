import type { AppData } from './types'

const DB_NAME = 'lightWeightBaby'
const STORE_NAME = 'kv'
const DATA_KEY = 'app-data'

export const defaultData: AppData = {
  activeUserId: null,
  users: [],
  equipment: [],
  dumbbellAssemblies: [],
  exercises: [],
  sessions: [],
  measurements: [],
  sprints: [],
}

function normalizeData(data: AppData): AppData {
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
      }

      return {
        ...exercise,
        equipmentRequirements:
          Array.isArray(exercise.equipmentRequirements)
            ? exercise.equipmentRequirements.map((requirement) => ({
                itemId: requirement.itemId,
                quantity: Math.max(1, Number(requirement.quantity) || 1),
              }))
            : Array.isArray(legacyExercise.equipmentIds)
              ? legacyExercise.equipmentIds.map((itemId: string) => ({
                  itemId,
                  quantity: 1,
                }))
              : [],
        notes: exercise.notes ?? '',
      }
    }),
    sessions: data.sessions.map((session) => ({
      ...session,
      entries: session.entries.map((entry) => ({
        ...entry,
        dumbbellAssemblyId: entry.dumbbellAssemblyId ?? null,
      })),
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
