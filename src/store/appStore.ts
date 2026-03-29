import { create } from 'zustand'
import {
  composeAppData,
  defaultData,
  defaultRootData,
  defaultUserScopedData,
  readAppData,
  writeAppData,
} from '../db'
import {
  defaultMeasurementFormValues,
  defaultSprintFormValues,
  defaultSessionFormValues,
  type CalendarMode,
  todayInput,
} from '../constants'
import type {
  ActiveWorkout,
  ActiveWorkoutEntry,
  ActiveWorkoutSet,
  ActiveWorkoutSetStatus,
  AppData,
  DumbbellAssembly,
  EquipmentItem,
  EquipmentKind,
  Exercise,
  ExerciseEquipmentRequirement,
  MeasurementRecord,
  ScheduledWorkout,
  SessionEntry,
  SessionEquipmentAssignment,
  SessionSet,
  Sprint,
  WorkoutTemplate,
  WorkoutSession,
  RootData,
  UserScopedData,
} from '../types'
import { addDays, createId, parseDateInput, toDateInput } from '../utils'

type EquipmentInput = {
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

type ExerciseInput = {
  name: string
  primaryMuscleGroup?: string
  equipmentRequirements?: ExerciseEquipmentRequirement[]
  notes?: string
}

type SessionInput = {
  date: string
  title: string
  notes?: string
}

type WorkoutTemplateInput = {
  name: string
  notes?: string
  entries: SessionEntryInput[]
}

type SessionEntryInput = Omit<SessionEntry, 'id'> & {
  id?: string
}

type MeasurementInput = {
  date: string
  bodyWeight?: number
  chest?: number
  waist?: number
  hips?: number
  arm?: number
  thigh?: number
  notes?: string
}

type SprintInput = {
  name: string
  startDate: string
  durationDays: number
  goal?: string
  focus?: string
}

type AppStore = {
  data: AppData
  isReady: boolean
  error: string
  calendarMode: CalendarMode
  anchorDate: string
  sessionDraft: SessionEntry[]
  activeWorkout: ActiveWorkout | null
  load: () => Promise<void>
  clearError: () => void
  loginUser: (login: string) => void
  switchUser: (userId: string) => void
  renameActiveUser: (login: string) => Promise<boolean>
  logout: () => void
  saveEquipment: (values: EquipmentInput) => Promise<void>
  updateEquipment: (equipmentId: string, values: EquipmentInput) => Promise<void>
  deleteEquipment: (equipmentId: string) => Promise<void>
  saveDumbbellAssembly: (assembly: Omit<DumbbellAssembly, 'id' | 'createdAt'>) => Promise<void>
  deleteDumbbellAssembly: (assemblyId: string) => Promise<void>
  saveExercise: (values: ExerciseInput) => Promise<Exercise>
  updateExercise: (exerciseId: string, values: ExerciseInput) => Promise<void>
  deleteExercise: (exerciseId: string) => Promise<void>
  addDraftEntry: (entry: Omit<SessionEntry, 'id'>) => void
  removeDraftEntry: (entryId: string) => void
  clearDraft: () => void
  saveSession: (values: SessionInput) => Promise<boolean>
  updateSession: (
    sessionId: string,
    values: SessionInput & { entries: SessionEntryInput[] },
  ) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  saveWorkoutTemplate: (values: WorkoutTemplateInput) => Promise<WorkoutTemplate>
  updateWorkoutTemplate: (
    templateId: string,
    values: WorkoutTemplateInput,
  ) => Promise<void>
  deleteWorkoutTemplate: (templateId: string) => Promise<void>
  scheduleWorkoutTemplate: (templateId: string, date: string) => Promise<void>
  deleteScheduledWorkout: (scheduledWorkoutId: string) => Promise<void>
  completeScheduledWorkout: (scheduledWorkoutId: string) => Promise<void>
  startQuickWorkoutFromExercise: (exerciseId: string, date?: string) => Promise<void>
  startWorkoutFromTemplate: (templateId: string, date?: string) => Promise<void>
  startScheduledWorkout: (scheduledWorkoutId: string) => Promise<void>
  addActiveWorkoutEntry: (entry: Omit<SessionEntry, 'id'>) => Promise<void>
  addActiveWorkoutSet: (entryId: string) => Promise<void>
  updateActiveWorkoutMeta: (values: Partial<SessionInput>) => Promise<void>
  updateActiveWorkoutSet: (
    entryId: string,
    setId: string,
    values: Partial<{
      actualReps: number
      actualWeightKg: number | null
      actualEquipmentAssignments: SessionEquipmentAssignment[]
      notes: string
      status: ActiveWorkoutSetStatus
    }>,
  ) => Promise<void>
  finishActiveWorkout: () => Promise<void>
  discardActiveWorkout: () => Promise<void>
  saveMeasurement: (values: MeasurementInput) => Promise<void>
  saveSprint: (values: SprintInput) => Promise<void>
  setCalendarMode: (mode: CalendarMode) => void
  resetCalendar: () => void
  moveCalendar: (direction: -1 | 1) => void
}

function extractScopedData(data: AppData): UserScopedData {
  return {
    equipment: data.equipment,
    dumbbellAssemblies: data.dumbbellAssemblies,
    exercises: data.exercises,
    workoutTemplates: data.workoutTemplates,
    scheduledWorkouts: data.scheduledWorkouts,
    activeWorkout: data.activeWorkout,
    sessions: data.sessions,
    measurements: data.measurements,
    sprints: data.sprints,
  }
}

function syncRootData(rootData: RootData, data: AppData): RootData {
  if (!data.activeUserId) {
    return {
      ...rootData,
      activeUserId: null,
      users: data.users,
    }
  }

  return {
    ...rootData,
    activeUserId: data.activeUserId,
    users: data.users,
    userDataById: {
      ...rootData.userDataById,
      [data.activeUserId]: extractScopedData(data),
    },
  }
}

async function persistRootData(rootData: RootData, setError: (error: string) => void) {
  try {
    await writeAppData(rootData)
  } catch {
    setError('РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РёР·РјРµРЅРµРЅРёСЏ РІ IndexedDB.')
  }
}

async function persistData(data: AppData, setError: (error: string) => void) {
  try {
    const rootData = await readAppData()
    await writeAppData(syncRootData(rootData, data))
  } catch {
    setError('Не удалось сохранить изменения в IndexedDB.')
  }
}

function normalizeExerciseRequirements(
  requirements: ExerciseEquipmentRequirement[] | undefined,
) {
  return (requirements ?? [])
    .filter((requirement) => requirement.category)
    .map((requirement) => ({
      category: requirement.category,
      quantity: Math.max(1, Number(requirement.quantity) || 1),
    }))
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

function normalizeSessionSets(sets: SessionSet[] | undefined) {
  const normalized = (sets ?? []).map((set) => ({
    reps: Math.max(0, Number(set.reps) || 0),
    weightKg:
      set.weightKg === undefined || set.weightKg === null
        ? null
        : Math.max(0, Number(set.weightKg) || 0),
    equipmentAssignments: normalizeEquipmentAssignments(set.equipmentAssignments),
  }))

  return normalized.length > 0
    ? normalized
    : [{ reps: 0, weightKg: null, equipmentAssignments: [] }]
}

function normalizeSessionEntries(entries: SessionEntryInput[]): SessionEntry[] {
  return entries.map((entry) => ({
    ...entry,
    id: entry.id ?? createId('entry'),
    sets: normalizeSessionSets(entry.sets),
    notes: entry.notes?.trim() || '',
  }))
}

function cloneAssignments(assignments: SessionEquipmentAssignment[]) {
  return assignments.map((assignment) => ({ ...assignment }))
}

function buildActiveWorkoutEntries(
  entries: SessionEntry[],
  exercises: Exercise[],
): ActiveWorkoutEntry[] {
  return entries.map((entry) => ({
    id: createId('active-entry'),
    exerciseId: entry.exerciseId,
    exerciseName:
      exercises.find((exercise) => exercise.id === entry.exerciseId)?.name ??
      'Упражнение',
    notes: entry.notes,
    sets: entry.sets.map<ActiveWorkoutSet>((set) => ({
      id: createId('active-set'),
      plannedReps: set.reps,
      actualReps: set.reps,
      plannedWeightKg: set.weightKg,
      actualWeightKg: set.weightKg,
      plannedEquipmentAssignments: cloneAssignments(set.equipmentAssignments),
      actualEquipmentAssignments: cloneAssignments(set.equipmentAssignments),
      notes: '',
      status: 'pending',
    })),
  }))
}

function buildActiveWorkout(
  template: WorkoutTemplate,
  exercises: Exercise[],
  options: {
    date: string
    sourceType: 'manual' | 'template' | 'scheduled'
    sourceTemplateId: string | null
    sourceScheduledWorkoutId: string | null
  },
): ActiveWorkout {
  const now = new Date().toISOString()

  return {
    id: createId('active-workout'),
    date: options.date,
    title: template.name,
    notes: template.notes,
    sourceType: options.sourceType,
    sourceTemplateId: options.sourceTemplateId,
    sourceScheduledWorkoutId: options.sourceScheduledWorkoutId,
    startedAt: now,
    updatedAt: now,
    entries: buildActiveWorkoutEntries(template.entries, exercises),
  }
}

function toSessionEntriesFromActiveWorkout(activeWorkout: ActiveWorkout): SessionEntry[] {
  return activeWorkout.entries
    .map<SessionEntry | null>((entry) => {
      const sets = entry.sets
        .filter((set) => set.status !== 'skipped')
        .map((set) => ({
          reps: Math.max(0, Number(set.actualReps) || 0),
          weightKg:
            set.actualWeightKg === undefined || set.actualWeightKg === null
              ? null
              : Math.max(0, Number(set.actualWeightKg) || 0),
          equipmentAssignments: normalizeEquipmentAssignments(
            set.actualEquipmentAssignments,
          ),
        }))

      if (sets.length === 0) {
        return null
      }

      return {
        id: createId('entry'),
        exerciseId: entry.exerciseId,
        sets,
        notes: entry.notes?.trim() || '',
      }
    })
    .filter((entry): entry is SessionEntry => Boolean(entry))
}

function toPlannedSessionEntriesFromActiveWorkout(
  activeWorkout: ActiveWorkout,
): SessionEntry[] {
  return activeWorkout.entries.map((entry) => ({
    id: createId('planned-entry'),
    exerciseId: entry.exerciseId,
    sets: entry.sets.map((set) => ({
      reps: Math.max(0, Number(set.plannedReps) || 0),
      weightKg:
        set.plannedWeightKg === undefined || set.plannedWeightKg === null
          ? null
          : Math.max(0, Number(set.plannedWeightKg) || 0),
      equipmentAssignments: normalizeEquipmentAssignments(
        set.plannedEquipmentAssignments,
      ),
    })),
    notes: entry.notes?.trim() || '',
  }))
}

export const useAppStore = create<AppStore>((set, get) => ({
  data: defaultData,
  isReady: false,
  error: '',
  calendarMode: 'week',
  anchorDate: todayInput,
  sessionDraft: [],
  activeWorkout: null,

  load: async () => {
    try {
      const loaded = composeAppData(await readAppData())
      set({ data: loaded, activeWorkout: loaded.activeWorkout, isReady: true, error: '' })
    } catch {
      set({
        isReady: true,
        error: 'Не удалось открыть локальную базу данных IndexedDB.',
      })
    }
  },

  clearError: () => set({ error: '' }),

  loginUser: (login) => {
    const normalized = login.trim().toLowerCase()
    if (!normalized) {
      return
    }

    void (async () => {
      const rootData = await readAppData().catch(() => defaultRootData)
      const existing = rootData.users.find((user) => user.login === normalized)
      const newUserId = createId('user')
      const nextRootData = existing
        ? {
            ...rootData,
            activeUserId: existing.id,
          }
        : {
            ...rootData,
            activeUserId: newUserId,
            users: [
              ...rootData.users,
              {
                id: newUserId,
                login: normalized,
                createdAt: new Date().toISOString(),
              },
            ],
            userDataById: {
              ...rootData.userDataById,
              [newUserId]: defaultUserScopedData,
            },
          }

      const nextData = composeAppData(nextRootData)
      set({ data: nextData, activeWorkout: nextData.activeWorkout, sessionDraft: [] })
      await persistRootData(nextRootData, (error) => set({ error }))
    })()
  },

  switchUser: (userId) => {
    void (async () => {
      const rootData = await readAppData().catch(() => defaultRootData)
      const nextRootData = { ...rootData, activeUserId: userId }
      const nextData = composeAppData(nextRootData)
      set({ data: nextData, activeWorkout: nextData.activeWorkout, sessionDraft: [] })
      await persistRootData(nextRootData, (error) => set({ error }))
    })()
  },

  renameActiveUser: async (login) => {
    const normalized = login.trim().toLowerCase()
    if (!normalized) {
      set({ error: 'Введите логин профиля.' })
      return false
    }

    const rootData = await readAppData().catch(() => defaultRootData)
    const activeUserId = rootData.activeUserId
    if (!activeUserId) {
      set({ error: 'Сначала войдите в профиль.' })
      return false
    }

    const duplicate = rootData.users.find(
      (user) => user.id !== activeUserId && user.login === normalized,
    )
    if (duplicate) {
      set({ error: 'Профиль с таким логином уже существует.' })
      return false
    }

    const nextRootData: RootData = {
      ...rootData,
      users: rootData.users.map((user) =>
        user.id === activeUserId
          ? {
              ...user,
              login: normalized,
            }
          : user,
      ),
    }

    const nextData = composeAppData(nextRootData)
    set({ data: nextData, activeWorkout: nextData.activeWorkout, error: '' })
    await persistRootData(nextRootData, (error) => set({ error }))
    return true
  },

  logout: () => {
    void (async () => {
      const rootData = await readAppData().catch(() => defaultRootData)
      const nextRootData = { ...rootData, activeUserId: null }
      const nextData = composeAppData(nextRootData)
      set({ data: nextData, activeWorkout: null, sessionDraft: [] })
      await persistRootData(nextRootData, (error) => set({ error }))
    })()
  },

  saveEquipment: async (values) => {
    const nextItem: EquipmentItem = {
      id: createId('equipment'),
      name: values.name.trim(),
      kind: values.kind,
      unit: values.unit?.trim() || 'кг',
      increment: values.increment ?? 0,
      quantity: values.quantity ?? 1,
      weightKg: values.weightKg ?? null,
      thicknessMm: values.thicknessMm ?? null,
      diameterMm: values.diameterMm ?? null,
      sleeveLengthMm: values.sleeveLengthMm ?? null,
      gripLengthMm: values.gripLengthMm ?? null,
      mountSizeMm: values.mountSizeMm ?? null,
      notes: values.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    }

    const nextData = {
      ...get().data,
      equipment: [nextItem, ...get().data.equipment],
    }
    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
  },

  updateEquipment: async (equipmentId, values) => {
    const { data } = get()
    const nextData = {
      ...data,
      equipment: data.equipment.map((item) =>
        item.id === equipmentId
          ? {
              ...item,
              name: values.name.trim(),
              kind: values.kind,
              unit: values.unit?.trim() || 'кг',
              increment: values.increment ?? 0,
              quantity: values.quantity ?? 1,
              weightKg: values.weightKg ?? null,
              thicknessMm: values.thicknessMm ?? null,
              diameterMm: values.diameterMm ?? null,
              sleeveLengthMm: values.sleeveLengthMm ?? null,
              gripLengthMm: values.gripLengthMm ?? null,
              mountSizeMm: values.mountSizeMm ?? null,
              notes: values.notes?.trim() || '',
            }
          : item,
      ),
    }

    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
  },

  deleteEquipment: async (equipmentId) => {
    const { data, activeWorkout } = get()
    const nextActiveWorkout = activeWorkout
      ? {
          ...activeWorkout,
          updatedAt: new Date().toISOString(),
          entries: activeWorkout.entries.map((entry) => ({
            ...entry,
            sets: entry.sets.map((set) => ({
              ...set,
              plannedEquipmentAssignments: set.plannedEquipmentAssignments.filter(
                (assignment) =>
                  !(assignment.itemType === 'equipment' && assignment.itemId === equipmentId),
              ),
              actualEquipmentAssignments: set.actualEquipmentAssignments.filter(
                (assignment) =>
                  !(assignment.itemType === 'equipment' && assignment.itemId === equipmentId),
              ),
            })),
          })),
        }
      : null
    const nextData = {
      ...data,
      equipment: data.equipment.filter((item) => item.id !== equipmentId),
      workoutTemplates: data.workoutTemplates.map((template) => ({
        ...template,
        entries: template.entries.map((entry) => ({
          ...entry,
          sets: entry.sets.map((set) => ({
            ...set,
            equipmentAssignments: set.equipmentAssignments.filter(
              (assignment) =>
                !(assignment.itemType === 'equipment' && assignment.itemId === equipmentId),
            ),
          })),
        })),
      })),
      sessions: data.sessions.map((session) => ({
        ...session,
        entries: session.entries.map((entry) => ({
          ...entry,
          sets: entry.sets.map((set) => ({
            ...set,
            equipmentAssignments: set.equipmentAssignments.filter(
              (assignment) =>
                !(assignment.itemType === 'equipment' && assignment.itemId === equipmentId),
            ),
          })),
        })),
      })),
      activeWorkout: nextActiveWorkout,
    }

    set({ data: nextData, activeWorkout: nextActiveWorkout })
    await persistData(nextData, (error) => set({ error }))
  },

  saveDumbbellAssembly: async (assembly) => {
    const nextAssembly: DumbbellAssembly = {
      ...assembly,
      id: createId('assembly'),
      createdAt: new Date().toISOString(),
    }

    const nextData = {
      ...get().data,
      dumbbellAssemblies: [nextAssembly, ...get().data.dumbbellAssemblies],
    }
    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
  },

  deleteDumbbellAssembly: async (assemblyId) => {
    const { data, activeWorkout } = get()
    const nextActiveWorkout = activeWorkout
      ? {
          ...activeWorkout,
          updatedAt: new Date().toISOString(),
          entries: activeWorkout.entries.map((entry) => ({
            ...entry,
            sets: entry.sets.map((set) => ({
              ...set,
              plannedEquipmentAssignments: set.plannedEquipmentAssignments.filter(
                (assignment) =>
                  !(assignment.itemType === 'assembly' && assignment.itemId === assemblyId),
              ),
              actualEquipmentAssignments: set.actualEquipmentAssignments.filter(
                (assignment) =>
                  !(assignment.itemType === 'assembly' && assignment.itemId === assemblyId),
              ),
            })),
          })),
        }
      : null

    const nextData = {
      ...data,
      dumbbellAssemblies: data.dumbbellAssemblies.filter(
        (assembly) => assembly.id !== assemblyId,
      ),
      workoutTemplates: data.workoutTemplates.map((template) => ({
        ...template,
        entries: template.entries.map((entry) => ({
          ...entry,
          sets: entry.sets.map((set) => ({
            ...set,
            equipmentAssignments: set.equipmentAssignments.filter(
              (assignment) =>
                !(assignment.itemType === 'assembly' && assignment.itemId === assemblyId),
            ),
          })),
        })),
      })),
      sessions: data.sessions.map((session) => ({
        ...session,
        entries: session.entries.map((entry) => ({
          ...entry,
          sets: entry.sets.map((set) => ({
            ...set,
            equipmentAssignments: set.equipmentAssignments.filter(
              (assignment) =>
                !(assignment.itemType === 'assembly' && assignment.itemId === assemblyId),
            ),
          })),
        })),
        plannedEntries: session.plannedEntries
          ? session.plannedEntries.map((entry) => ({
              ...entry,
              sets: entry.sets.map((set) => ({
                ...set,
                equipmentAssignments: set.equipmentAssignments.filter(
                  (assignment) =>
                    !(assignment.itemType === 'assembly' && assignment.itemId === assemblyId),
                ),
              })),
            }))
          : null,
      })),
      activeWorkout: nextActiveWorkout,
    }

    set({ data: nextData, activeWorkout: nextActiveWorkout })
    await persistData(nextData, (error) => set({ error }))
  },

  saveExercise: async (values) => {
    const nextExercise: Exercise = {
      id: createId('exercise'),
      name: values.name.trim(),
      primaryMuscleGroup: values.primaryMuscleGroup?.trim() || '',
      equipmentRequirements: normalizeExerciseRequirements(
        values.equipmentRequirements,
      ),
      notes: values.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    }

    const nextData = {
      ...get().data,
      exercises: [nextExercise, ...get().data.exercises],
    }
    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
    return nextExercise
  },

  updateExercise: async (exerciseId, values) => {
    const { data } = get()
    const nextData = {
      ...data,
      exercises: data.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              name: values.name.trim(),
              primaryMuscleGroup: values.primaryMuscleGroup?.trim() || '',
              equipmentRequirements: normalizeExerciseRequirements(
                values.equipmentRequirements,
              ),
              notes: values.notes?.trim() || '',
            }
          : exercise,
      ),
    }

    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
  },

  deleteExercise: async (exerciseId) => {
    const { data, sessionDraft, activeWorkout } = get()
    const nextActiveWorkout = activeWorkout
      ? {
          ...activeWorkout,
          updatedAt: new Date().toISOString(),
          entries: activeWorkout.entries.filter((entry) => entry.exerciseId !== exerciseId),
        }
      : null
    const nextData = {
      ...data,
      exercises: data.exercises.filter((exercise) => exercise.id !== exerciseId),
      workoutTemplates: data.workoutTemplates.map((template) => ({
        ...template,
        entries: template.entries.filter((entry) => entry.exerciseId !== exerciseId),
      })),
      activeWorkout: nextActiveWorkout,
    }

    set({
      data: nextData,
      activeWorkout: nextActiveWorkout,
      sessionDraft: sessionDraft.filter((entry) => entry.exerciseId !== exerciseId),
    })
    await persistData(nextData, (error) => set({ error }))
  },

  addDraftEntry: (entry) => {
    const nextEntry: SessionEntry = {
      ...entry,
      id: createId('entry'),
      sets: normalizeSessionSets(entry.sets),
      notes: entry.notes?.trim() || '',
    }
    set({ sessionDraft: [...get().sessionDraft, nextEntry] })
  },

  removeDraftEntry: (entryId) => {
    set({
      sessionDraft: get().sessionDraft.filter((entry) => entry.id !== entryId),
    })
  },

  clearDraft: () => set({ sessionDraft: [] }),

  saveSession: async (values) => {
    const { sessionDraft } = get()
    if (sessionDraft.length === 0) {
      return false
    }

    const nextSession: WorkoutSession = {
      id: createId('session'),
      date: values.date,
      title: values.title.trim() || 'Тренировка',
      notes: values.notes?.trim() || '',
        entries: sessionDraft,
        plannedEntries: normalizeSessionEntries(sessionDraft),
        sourceType: 'manual',
        sourceTemplateId: null,
        createdAt: new Date().toISOString(),
    }

    const nextData = {
      ...get().data,
      sessions: [nextSession, ...get().data.sessions],
    }
    set({ data: nextData, sessionDraft: [] })
    await persistData(nextData, (error) => set({ error }))
    return true
  },

  updateSession: async (sessionId, values) => {
    const { data } = get()
    const nextData = {
      ...data,
      sessions: data.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              date: values.date,
              title: values.title.trim() || 'Тренировка',
              notes: values.notes?.trim() || '',
                entries: normalizeSessionEntries(values.entries),
                plannedEntries:
                  session.plannedEntries ?? normalizeSessionEntries(values.entries),
              }
          : session,
      ),
    }

    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
  },

  deleteSession: async (sessionId) => {
    const { data } = get()
    const nextData = {
      ...data,
      sessions: data.sessions.filter((session) => session.id !== sessionId),
    }

    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
  },

  saveWorkoutTemplate: async (values) => {
    const nextTemplate: WorkoutTemplate = {
      id: createId('template'),
      name: values.name.trim(),
      notes: values.notes?.trim() || '',
      entries: normalizeSessionEntries(values.entries),
      createdAt: new Date().toISOString(),
    }

    const nextData = {
      ...get().data,
      workoutTemplates: [nextTemplate, ...get().data.workoutTemplates],
    }
    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
    return nextTemplate
  },

  updateWorkoutTemplate: async (templateId, values) => {
    const { data } = get()
    const nextData = {
      ...data,
      workoutTemplates: data.workoutTemplates.map((template) =>
        template.id === templateId
          ? {
              ...template,
              name: values.name.trim(),
              notes: values.notes?.trim() || '',
              entries: normalizeSessionEntries(values.entries),
            }
          : template,
      ),
      scheduledWorkouts: data.scheduledWorkouts.map((item) =>
        item.templateId === templateId
          ? {
              ...item,
              templateName: values.name.trim(),
            }
          : item,
      ),
    }
    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
  },

  deleteWorkoutTemplate: async (templateId) => {
    const { data } = get()
    const nextData = {
      ...data,
      workoutTemplates: data.workoutTemplates.filter(
        (template) => template.id !== templateId,
      ),
      scheduledWorkouts: data.scheduledWorkouts.filter(
        (item) => item.templateId !== templateId,
      ),
    }
    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
  },

  scheduleWorkoutTemplate: async (templateId, date) => {
    const { data } = get()
    const template = data.workoutTemplates.find((item) => item.id === templateId)
    if (!template) {
      return
    }

    const nextScheduledWorkout: ScheduledWorkout = {
      id: createId('scheduled-workout'),
      date,
      templateId: template.id,
      templateName: template.name,
      createdAt: new Date().toISOString(),
    }

    const nextData = {
      ...data,
      scheduledWorkouts: [nextScheduledWorkout, ...data.scheduledWorkouts],
    }
    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
  },

  deleteScheduledWorkout: async (scheduledWorkoutId) => {
    const { data } = get()
    const nextData = {
      ...data,
      scheduledWorkouts: data.scheduledWorkouts.filter(
        (item) => item.id !== scheduledWorkoutId,
      ),
    }
    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
  },

  completeScheduledWorkout: async (scheduledWorkoutId) => {
    const { data } = get()
    const scheduled = data.scheduledWorkouts.find((item) => item.id === scheduledWorkoutId)
    if (!scheduled) {
      return
    }

    const template = data.workoutTemplates.find((item) => item.id === scheduled.templateId)
    if (!template) {
      return
    }

    const nextSession: WorkoutSession = {
      id: createId('session'),
      date: scheduled.date,
      title: template.name,
      notes: template.notes,
        entries: normalizeSessionEntries(template.entries),
        plannedEntries: normalizeSessionEntries(template.entries),
        sourceType: 'scheduled',
        sourceTemplateId: template.id,
        createdAt: new Date().toISOString(),
    }

    const nextData = {
      ...data,
      sessions: [nextSession, ...data.sessions],
      scheduledWorkouts: data.scheduledWorkouts.filter(
        (item) => item.id !== scheduledWorkoutId,
      ),
    }
    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
  },

  startQuickWorkoutFromExercise: async (exerciseId, date = toDateInput(new Date())) => {
    const { data } = get()
    const exercise = data.exercises.find((item) => item.id === exerciseId)
    if (!exercise) {
      return
    }

    const nextActiveWorkout: ActiveWorkout = {
      id: createId('active-workout'),
      date,
      title: exercise.name,
      notes: '',
      sourceType: 'manual',
      sourceTemplateId: null,
      sourceScheduledWorkoutId: null,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entries: [
        {
          id: createId('active-entry'),
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          notes: '',
          sets: [
            {
              id: createId('active-set'),
              plannedReps: 10,
              actualReps: 10,
              plannedWeightKg: null,
              actualWeightKg: null,
              plannedEquipmentAssignments: [],
              actualEquipmentAssignments: [],
              notes: '',
              status: 'pending',
            },
          ],
        },
      ],
    }

    const nextData = {
      ...data,
      activeWorkout: nextActiveWorkout,
    }

    set({ data: nextData, activeWorkout: nextActiveWorkout })
    await persistData(nextData, (error) => set({ error }))
  },

  startWorkoutFromTemplate: async (templateId, date = toDateInput(new Date())) => {
    const { data } = get()
    const template = data.workoutTemplates.find((item) => item.id === templateId)
    if (!template) {
      return
    }

    const nextActiveWorkout = buildActiveWorkout(template, data.exercises, {
      date,
      sourceTemplateId: template.id,
      sourceType: 'template',
      sourceScheduledWorkoutId: null,
    })
    const nextData = {
      ...data,
      activeWorkout: nextActiveWorkout,
    }

    set({ data: nextData, activeWorkout: nextActiveWorkout })
    await persistData(nextData, (error) => set({ error }))
  },

  startScheduledWorkout: async (scheduledWorkoutId) => {
    const { data } = get()
    const scheduled = data.scheduledWorkouts.find((item) => item.id === scheduledWorkoutId)
    if (!scheduled) {
      return
    }

    const template = data.workoutTemplates.find((item) => item.id === scheduled.templateId)
    if (!template) {
      return
    }

    const nextActiveWorkout = buildActiveWorkout(template, data.exercises, {
      date: scheduled.date,
      sourceTemplateId: template.id,
      sourceType: 'scheduled',
      sourceScheduledWorkoutId: scheduled.id,
    })
    const nextData = {
      ...data,
      activeWorkout: nextActiveWorkout,
    }

    set({ data: nextData, activeWorkout: nextActiveWorkout })
    await persistData(nextData, (error) => set({ error }))
  },

  addActiveWorkoutEntry: async (entry) => {
    const { data, activeWorkout } = get()
    if (!activeWorkout) {
      return
    }

    const exercise = data.exercises.find((item) => item.id === entry.exerciseId)
    const nextEntry: ActiveWorkoutEntry = {
      id: createId('active-entry'),
      exerciseId: entry.exerciseId,
      exerciseName: exercise?.name ?? 'Упражнение',
      notes: entry.notes?.trim() || '',
      sets: normalizeSessionSets(entry.sets).map<ActiveWorkoutSet>((set) => ({
        id: createId('active-set'),
        plannedReps: set.reps,
        actualReps: set.reps,
        plannedWeightKg: set.weightKg,
        actualWeightKg: set.weightKg,
        plannedEquipmentAssignments: cloneAssignments(set.equipmentAssignments),
        actualEquipmentAssignments: cloneAssignments(set.equipmentAssignments),
        notes: '',
        status: 'pending',
      })),
    }

    const nextActiveWorkout: ActiveWorkout = {
      ...activeWorkout,
      updatedAt: new Date().toISOString(),
      entries: [...activeWorkout.entries, nextEntry],
    }

    const nextData = {
      ...data,
      activeWorkout: nextActiveWorkout,
    }

    set({ data: nextData, activeWorkout: nextActiveWorkout })
    await persistData(nextData, (error) => set({ error }))
  },

  addActiveWorkoutSet: async (entryId) => {
    const { data, activeWorkout } = get()
    if (!activeWorkout) {
      return
    }

    const nextActiveWorkout: ActiveWorkout = {
      ...activeWorkout,
      updatedAt: new Date().toISOString(),
      entries: activeWorkout.entries.map((entry) => {
        if (entry.id !== entryId) {
          return entry
        }

        const previousSet = entry.sets[entry.sets.length - 1]
        const nextSet: ActiveWorkoutSet = previousSet
          ? {
              ...previousSet,
              id: createId('active-set'),
              plannedEquipmentAssignments: cloneAssignments(
                previousSet.plannedEquipmentAssignments,
              ),
              actualEquipmentAssignments: cloneAssignments(
                previousSet.actualEquipmentAssignments,
              ),
              notes: previousSet.notes ?? '',
              status: 'pending',
            }
          : {
              id: createId('active-set'),
              plannedReps: 10,
              actualReps: 10,
              plannedWeightKg: null,
              actualWeightKg: null,
              plannedEquipmentAssignments: [],
              actualEquipmentAssignments: [],
              notes: '',
              status: 'pending',
            }

        return {
          ...entry,
          sets: [...entry.sets, nextSet],
        }
      }),
    }

    const nextData = {
      ...data,
      activeWorkout: nextActiveWorkout,
    }

    set({ data: nextData, activeWorkout: nextActiveWorkout })
    await persistData(nextData, (error) => set({ error }))
  },

  updateActiveWorkoutMeta: async (values) => {
    const { data, activeWorkout } = get()
    if (!activeWorkout) {
      return
    }

    const nextActiveWorkout: ActiveWorkout = {
      ...activeWorkout,
      title:
        values.title === undefined
          ? activeWorkout.title
          : values.title.trim() || 'Тренировка',
      notes:
        values.notes === undefined ? activeWorkout.notes : values.notes?.trim() || '',
      updatedAt: new Date().toISOString(),
    }

    const nextData = {
      ...data,
      activeWorkout: nextActiveWorkout,
    }

    set({ data: nextData, activeWorkout: nextActiveWorkout })
    await persistData(nextData, (error) => set({ error }))
  },

  updateActiveWorkoutSet: async (entryId, setId, values) => {
    const { data, activeWorkout } = get()
    if (!activeWorkout) {
      return
    }

    const nextActiveWorkout: ActiveWorkout = {
      ...activeWorkout,
      updatedAt: new Date().toISOString(),
      entries: activeWorkout.entries.map((entry) =>
        entry.id !== entryId
          ? entry
          : {
              ...entry,
              sets: entry.sets.map((set) =>
                set.id !== setId
                  ? set
                  : {
                      ...set,
                      actualReps:
                        values.actualReps === undefined
                          ? set.actualReps
                          : Math.max(0, Number(values.actualReps) || 0),
                      actualWeightKg:
                        values.actualWeightKg === undefined
                          ? set.actualWeightKg
                          : values.actualWeightKg === null
                            ? null
                            : Math.max(0, Number(values.actualWeightKg) || 0),
                      actualEquipmentAssignments:
                        values.actualEquipmentAssignments === undefined
                          ? set.actualEquipmentAssignments
                          : normalizeEquipmentAssignments(values.actualEquipmentAssignments),
                      notes: values.notes === undefined ? set.notes : values.notes,
                      status: values.status ?? set.status,
                    },
              ),
            },
      ),
    }
    const nextData = {
      ...data,
      activeWorkout: nextActiveWorkout,
    }

    set({ data: nextData, activeWorkout: nextActiveWorkout })
    await persistData(nextData, (error) => set({ error }))
  },

  finishActiveWorkout: async () => {
    const { data, activeWorkout } = get()
    if (!activeWorkout) {
      return
    }

    const nextSession: WorkoutSession = {
      id: createId('session'),
      date: activeWorkout.date,
      title: activeWorkout.title.trim() || 'Тренировка',
      notes: activeWorkout.notes?.trim() || '',
        entries: toSessionEntriesFromActiveWorkout(activeWorkout),
        plannedEntries: toPlannedSessionEntriesFromActiveWorkout(activeWorkout),
        sourceType: activeWorkout.sourceType,
        sourceTemplateId: activeWorkout.sourceTemplateId,
        createdAt: new Date().toISOString(),
    }

    const nextData = {
      ...data,
      activeWorkout: null,
      sessions: [nextSession, ...data.sessions],
      scheduledWorkouts:
        activeWorkout.sourceScheduledWorkoutId === null
          ? data.scheduledWorkouts
          : data.scheduledWorkouts.filter(
              (item) => item.id !== activeWorkout.sourceScheduledWorkoutId,
            ),
    }

    set({ data: nextData, activeWorkout: null })
    await persistData(nextData, (error) => set({ error }))
  },

  discardActiveWorkout: async () => {
    const { data } = get()
    const nextData = {
      ...data,
      activeWorkout: null,
    }

    set({ data: nextData, activeWorkout: null })
    await persistData(nextData, (error) => set({ error }))
  },

  saveMeasurement: async (values) => {
    const nextMeasurement: MeasurementRecord = {
      id: createId('measurement'),
      date: values.date,
      bodyWeight: values.bodyWeight ?? 0,
      chest: values.chest ?? 0,
      waist: values.waist ?? 0,
      hips: values.hips ?? 0,
      arm: values.arm ?? 0,
      thigh: values.thigh ?? 0,
      notes: values.notes?.trim() || '',
      createdAt: new Date().toISOString(),
    }

    const nextData = {
      ...get().data,
      measurements: [nextMeasurement, ...get().data.measurements],
    }
    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
  },

  saveSprint: async (values) => {
    const nextSprint: Sprint = {
      id: createId('sprint'),
      name: values.name.trim(),
      startDate: values.startDate,
      durationDays: values.durationDays ?? 14,
      goal: values.goal?.trim() || '',
      focus: values.focus?.trim() || '',
      createdAt: new Date().toISOString(),
    }

    const nextData = {
      ...get().data,
      sprints: [nextSprint, ...get().data.sprints],
    }
    set({ data: nextData })
    await persistData(nextData, (error) => set({ error }))
  },

  setCalendarMode: (mode) => set({ calendarMode: mode }),

  resetCalendar: () => set({ anchorDate: todayInput }),

  moveCalendar: (direction) => {
    const { anchorDate, calendarMode } = get()
    const base = parseDateInput(anchorDate)
    const delta = calendarMode === 'day' ? 1 : calendarMode === 'week' ? 7 : 30
    set({ anchorDate: toDateInput(addDays(base, delta * direction)) })
  },
}))

export const appFormDefaults = {
  session: defaultSessionFormValues,
  measurement: defaultMeasurementFormValues,
  sprint: defaultSprintFormValues,
}
