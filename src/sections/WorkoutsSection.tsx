import { useEffect, useMemo, useState } from 'react'
import { Form, Tabs } from 'antd'
import { initialEntryForm } from '../constants'
import { useDashboardData } from '../hooks/useDashboardData'
import { appFormDefaults, useAppStore } from '../store/appStore'
import type { SessionEntry, WorkoutSession, WorkoutTemplate } from '../types'
import { toDateInput } from '../utils'
import { CreateTemplateTab } from './workouts/CreateTemplateTab'
import { EditSessionModal } from './workouts/EditSessionModal'
import { EditTemplateModal } from './workouts/EditTemplateModal'
import { HistoryTab } from './workouts/HistoryTab'
import { LogWorkoutModal } from './workouts/LogWorkoutModal'
import { ScheduleTemplateModal } from './workouts/ScheduleTemplateModal'
import { TemplatesTab } from './workouts/TemplatesTab'
import type {
  EditSessionFormValues,
  EditTemplateFormValues,
  EntryFormValues,
  ScheduleFormValues,
  SessionFormValues,
  TemplateFormValues,
} from './workouts/types'
import {
  normalizeSets,
  toEditableEntry,
} from './workouts/utils'
import { WorkoutEntrySummary } from './workouts/WorkoutEntrySummary'

export function WorkoutsSection() {
  const [entryForm] = Form.useForm<EntryFormValues>()
  const [templateForm] = Form.useForm<TemplateFormValues>()
  const [sessionForm] = Form.useForm<SessionFormValues>()
  const [editForm] = Form.useForm<EditSessionFormValues>()
  const [templateEditForm] = Form.useForm<EditTemplateFormValues>()
  const [scheduleForm] = Form.useForm<ScheduleFormValues>()
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null)
  const [schedulingTemplate, setSchedulingTemplate] = useState<WorkoutTemplate | null>(null)
  const [logWorkoutOpen, setLogWorkoutOpen] = useState(false)

  const data = useAppStore((state) => state.data)
  const sessionDraft = useAppStore((state) => state.sessionDraft)
  const addDraftEntry = useAppStore((state) => state.addDraftEntry)
  const removeDraftEntry = useAppStore((state) => state.removeDraftEntry)
  const saveSession = useAppStore((state) => state.saveSession)
  const updateSession = useAppStore((state) => state.updateSession)
  const deleteSession = useAppStore((state) => state.deleteSession)
  const saveWorkoutTemplate = useAppStore((state) => state.saveWorkoutTemplate)
  const updateWorkoutTemplate = useAppStore((state) => state.updateWorkoutTemplate)
  const deleteWorkoutTemplate = useAppStore((state) => state.deleteWorkoutTemplate)
  const scheduleWorkoutTemplate = useAppStore((state) => state.scheduleWorkoutTemplate)
  const startWorkoutFromTemplate = useAppStore(
    (state) => state.startWorkoutFromTemplate,
  )
  const { actualEquipmentOptions, exerciseOptions, recentSessions, recentWorkoutTemplates } =
    useDashboardData()

  useEffect(() => {
    entryForm.setFieldsValue(initialEntryForm)
    templateForm.setFieldsValue({ name: '', notes: '' })
    sessionForm.setFieldsValue(appFormDefaults.session)
  }, [entryForm, sessionForm, templateForm])

  const exerciseMap = useMemo(
    () => new Map(data.exercises.map((exercise) => [exercise.id, exercise])),
    [data.exercises],
  )

  const assignmentLabelMap = useMemo(() => {
    const map = new Map<string, string>()
    data.equipment.forEach((item) => map.set(`equipment:${item.id}`, item.name))
    data.dumbbellAssemblies.forEach((assembly) => {
      map.set(`assembly:${assembly.id}`, assembly.name)
    })
    return map
  }, [data.dumbbellAssemblies, data.equipment])

  const assignmentWeightMap = useMemo(() => {
    const map = new Map<string, number | null>()
    data.equipment.forEach((item) => map.set(`equipment:${item.id}`, item.weightKg))
    data.dumbbellAssemblies.forEach((assembly) =>
      map.set(`assembly:${assembly.id}`, assembly.totalWeightKg),
    )
    return map
  }, [data.dumbbellAssemblies, data.equipment])

  const selectedExerciseId = Form.useWatch('exerciseId', entryForm)
  const selectedExercise = selectedExerciseId
    ? exerciseMap.get(selectedExerciseId)
    : undefined

  const handleAddEntry = (values: EntryFormValues) => {
    addDraftEntry({
      exerciseId: values.exerciseId,
      sets: normalizeSets(values.sets),
      notes: values.notes?.trim() || '',
    })

    entryForm.setFieldsValue({
      ...initialEntryForm,
      exerciseId: values.exerciseId,
    })
  }

  const handleSaveTemplate = async () => {
    const values = await templateForm.validateFields()
    if (sessionDraft.length === 0) {
      return
    }

    await saveWorkoutTemplate({
      name: values.name,
      notes: values.notes,
      entries: sessionDraft,
    })
  }

  const handleOpenLogWorkout = async () => {
    const values = await templateForm.validateFields()
    sessionForm.setFieldsValue({
      date: toDateInput(new Date()),
      title: values.name || appFormDefaults.session.title,
      notes: values.notes || '',
    })
    setLogWorkoutOpen(true)
  }

  const handleSaveSession = async (values: SessionFormValues) => {
    const saved = await saveSession(values)
    if (!saved) {
      return
    }

    sessionForm.setFieldsValue(appFormDefaults.session)
    setLogWorkoutOpen(false)
  }

  const openEditSessionModal = (session: WorkoutSession) => {
    setEditingSession(session)
    editForm.setFieldsValue({
      date: session.date,
      title: session.title,
      notes: session.notes,
      entries: session.entries.map(toEditableEntry),
    })
  }

  const openTemplateEditModal = (template: WorkoutTemplate) => {
    setEditingTemplate(template)
    templateEditForm.setFieldsValue({
      name: template.name,
      notes: template.notes,
      entries: template.entries.map(toEditableEntry),
    })
  }

  const openScheduleModal = (template: WorkoutTemplate) => {
    setSchedulingTemplate(template)
    scheduleForm.setFieldsValue({ date: toDateInput(new Date()) })
  }

  const handleEditSession = async () => {
    const values = await editForm.validateFields()
    if (!editingSession) {
      return
    }

    await updateSession(editingSession.id, {
      ...values,
      entries: values.entries.map((entry) => ({
        ...entry,
        sets: normalizeSets(entry.sets),
        notes: entry.notes ?? '',
      })),
    })
    setEditingSession(null)
    editForm.resetFields()
  }

  const handleEditTemplate = async () => {
    const values = await templateEditForm.validateFields()
    if (!editingTemplate) {
      return
    }

    await updateWorkoutTemplate(editingTemplate.id, {
      ...values,
      entries: values.entries.map((entry) => ({
        ...entry,
        sets: normalizeSets(entry.sets),
        notes: entry.notes ?? '',
      })),
    })
    setEditingTemplate(null)
    templateEditForm.resetFields()
  }

  const handleScheduleTemplate = async () => {
    const values = await scheduleForm.validateFields()
    if (!schedulingTemplate) {
      return
    }

    await scheduleWorkoutTemplate(schedulingTemplate.id, values.date)
    setSchedulingTemplate(null)
    scheduleForm.resetFields()
  }

  const renderEntries = (entries: SessionEntry[]) => (
    <div className="workout-session-summary">
      {entries.map((entry) => (
        <WorkoutEntrySummary
          key={entry.id}
          entry={entry}
          exercise={exerciseMap.get(entry.exerciseId)}
          assignmentLabelMap={assignmentLabelMap}
          assignmentWeightMap={assignmentWeightMap}
        />
      ))}
    </div>
  )

  return (
    <>
      <Tabs
        items={[
          {
            key: 'create',
            label: 'Создать шаблон',
            children: (
              <CreateTemplateTab
                templateForm={templateForm}
                entryForm={entryForm}
                exerciseOptions={exerciseOptions}
                actualEquipmentOptions={actualEquipmentOptions}
                selectedExercise={selectedExercise}
                sessionDraft={sessionDraft}
                renderEntries={renderEntries}
                onAddEntry={handleAddEntry}
                onRemoveDraftEntry={removeDraftEntry}
                onSaveTemplate={() => void handleSaveTemplate()}
                onOpenLogWorkout={() => void handleOpenLogWorkout()}
              />
            ),
          },
          {
            key: 'templates',
            label: 'Шаблоны',
            children: (
              <TemplatesTab
                templates={recentWorkoutTemplates}
                renderEntries={renderEntries}
                onStart={(template) => void startWorkoutFromTemplate(template.id)}
                onSchedule={openScheduleModal}
                onEdit={openTemplateEditModal}
                onDelete={(templateId) => void deleteWorkoutTemplate(templateId)}
              />
            ),
          },
          {
            key: 'history',
            label: 'История',
            children: (
              <HistoryTab
                sessions={recentSessions}
                renderEntries={renderEntries}
                onEdit={openEditSessionModal}
                onDelete={(sessionId) => void deleteSession(sessionId)}
              />
            ),
          },
        ]}
      />

      <LogWorkoutModal
        form={sessionForm}
        open={logWorkoutOpen}
        onSubmit={(values) => void handleSaveSession(values)}
        onCancel={() => {
          setLogWorkoutOpen(false)
          sessionForm.resetFields()
          sessionForm.setFieldsValue(appFormDefaults.session)
        }}
      />

      <EditSessionModal
        form={editForm}
        open={Boolean(editingSession)}
        exerciseMap={exerciseMap}
        exerciseOptions={exerciseOptions}
        actualEquipmentOptions={actualEquipmentOptions}
        onSubmit={() => void handleEditSession()}
        onCancel={() => {
          setEditingSession(null)
          editForm.resetFields()
        }}
      />

      <EditTemplateModal
        form={templateEditForm}
        open={Boolean(editingTemplate)}
        exerciseMap={exerciseMap}
        exerciseOptions={exerciseOptions}
        actualEquipmentOptions={actualEquipmentOptions}
        onSubmit={() => void handleEditTemplate()}
        onCancel={() => {
          setEditingTemplate(null)
          templateEditForm.resetFields()
        }}
      />

      <ScheduleTemplateModal
        form={scheduleForm}
        template={schedulingTemplate}
        onSubmit={() => void handleScheduleTemplate()}
        onCancel={() => {
          setSchedulingTemplate(null)
          scheduleForm.resetFields()
        }}
      />
    </>
  )
}
