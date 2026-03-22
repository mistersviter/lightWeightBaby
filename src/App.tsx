import { useEffect, useMemo, useState } from 'react'
import { Alert, Card, Input, Layout, Modal, Space, Tabs } from 'antd'
import {
  CalendarOutlined,
  LineChartOutlined,
  PlusOutlined,
  RocketOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import './App.css'
import { AppLoader } from './components/AppLoader'
import { DashboardHeader } from './components/DashboardHeader'
import { LoginScreen } from './components/LoginScreen'
import { StatsOverview } from './components/StatsOverview'
import { TodayWorkoutCard } from './components/TodayWorkoutCard'
import { useDashboardData } from './hooks/useDashboardData'
import { CalendarSection } from './sections/CalendarSection'
import { ExercisesSection } from './sections/ExercisesSection'
import { InventorySection } from './sections/InventorySection'
import { MeasurementsSection } from './sections/MeasurementsSection'
import { SprintsSection } from './sections/SprintsSection'
import { WorkoutsSection } from './sections/WorkoutsSection'
import { ActiveWorkoutScreen } from './sections/workouts/ActiveWorkoutScreen'
import { ViewSessionDetailsModal } from './sections/workouts/ViewSessionDetailsModal'
import { WorkoutEntrySummary } from './sections/workouts/WorkoutEntrySummary'
import { useAppStore } from './store/appStore'
import type { SessionEntry, WorkoutSession } from './types'

const { Content } = Layout

function App() {
  const [login, setLogin] = useState('')
  const [renameLogin, setRenameLogin] = useState('')
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [viewingSession, setViewingSession] = useState<WorkoutSession | null>(null)
  const load = useAppStore((state) => state.load)
  const isReady = useAppStore((state) => state.isReady)
  const error = useAppStore((state) => state.error)
  const loginUser = useAppStore((state) => state.loginUser)
  const switchUser = useAppStore((state) => state.switchUser)
  const renameActiveUser = useAppStore((state) => state.renameActiveUser)
  const logout = useAppStore((state) => state.logout)
  const completeScheduledWorkout = useAppStore(
    (state) => state.completeScheduledWorkout,
  )
  const deleteScheduledWorkout = useAppStore(
    (state) => state.deleteScheduledWorkout,
  )
  const startScheduledWorkout = useAppStore((state) => state.startScheduledWorkout)
  const addActiveWorkoutEntry = useAppStore((state) => state.addActiveWorkoutEntry)
  const addActiveWorkoutSet = useAppStore((state) => state.addActiveWorkoutSet)
  const updateActiveWorkoutMeta = useAppStore((state) => state.updateActiveWorkoutMeta)
  const updateActiveWorkoutSet = useAppStore((state) => state.updateActiveWorkoutSet)
  const finishActiveWorkout = useAppStore((state) => state.finishActiveWorkout)
  const discardActiveWorkout = useAppStore((state) => state.discardActiveWorkout)
  const activeWorkout = useAppStore((state) => state.activeWorkout)
  const data = useAppStore((state) => state.data)
  const {
    activeUser,
    actualEquipmentOptions,
    exerciseOptions,
    nextSprint,
    sessionsThisWeek,
    todaySessions,
    todayScheduledWorkouts,
  } = useDashboardData()

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

  useEffect(() => {
    void load()
  }, [load])

  const tabItems = useMemo(
    () => [
      {
        key: 'inventory',
        label: (
          <Space>
            <ToolOutlined />
            Инвентарь
          </Space>
        ),
        children: (
          <Card className="app-section-card">
            <InventorySection />
          </Card>
        ),
      },
      {
        key: 'exercises',
        label: (
          <Space>
            <PlusOutlined />
            Упражнения
          </Space>
        ),
        children: (
          <Card className="app-section-card">
            <ExercisesSection />
          </Card>
        ),
      },
      {
        key: 'workouts',
        label: (
          <Space>
            <LineChartOutlined />
            Тренировки
          </Space>
        ),
        children: (
          <Card className="app-section-card">
            <WorkoutsSection />
          </Card>
        ),
      },
      {
        key: 'measurements',
        label: (
          <Space>
            <LineChartOutlined />
            Замеры
          </Space>
        ),
        children: (
          <Card className="app-section-card">
            <MeasurementsSection />
          </Card>
        ),
      },
      {
        key: 'calendar',
        label: (
          <Space>
            <CalendarOutlined />
            Календарь
          </Space>
        ),
        children: (
          <Card className="app-section-card">
            <CalendarSection onViewSession={setViewingSession} />
          </Card>
        ),
      },
      {
        key: 'sprints',
        label: (
          <Space>
            <RocketOutlined />
            Спринты
          </Space>
        ),
        children: (
          <Card className="app-section-card">
            <SprintsSection />
          </Card>
        ),
      },
    ],
    [],
  )

  if (!isReady) {
    return <AppLoader />
  }

  return (
    <Layout className="page-layout">
      <Content className="content-wrap">
        {!activeUser ? (
          <LoginScreen
            login={login}
            error={error}
            userLogins={data.users}
            onLoginChange={setLogin}
            onLogin={() => {
              loginUser(login)
              setLogin('')
            }}
            onQuickLogin={switchUser}
          />
        ) : (
          <>
            <DashboardHeader
              login={activeUser.login}
              onRename={() => {
                setRenameLogin(activeUser.login)
                setRenameModalOpen(true)
              }}
              onLogout={logout}
            />

            {error ? (
              <Alert type="error" title={error} showIcon style={{ marginBottom: 16 }} />
            ) : null}

            {activeWorkout ? (
              <ActiveWorkoutScreen
                activeWorkout={activeWorkout}
                exercises={data.exercises}
                equipment={data.equipment}
                dumbbellAssemblies={data.dumbbellAssemblies}
                actualEquipmentOptions={actualEquipmentOptions}
                exerciseOptions={exerciseOptions}
                onAddEntry={(entry) => void addActiveWorkoutEntry(entry)}
                onAddSet={(entryId) => void addActiveWorkoutSet(entryId)}
                onUpdateMeta={(values) => void updateActiveWorkoutMeta(values)}
                onUpdateSet={(entryId, setId, values) =>
                  void updateActiveWorkoutSet(entryId, setId, values)
                }
                onFinish={() => void finishActiveWorkout()}
                onDiscard={() => void discardActiveWorkout()}
              />
            ) : (
              <>
                <TodayWorkoutCard
                  todaySessions={todaySessions}
                  todayScheduledWorkouts={todayScheduledWorkouts}
                  onStartScheduledWorkout={(scheduledWorkoutId) =>
                    void startScheduledWorkout(scheduledWorkoutId)
                  }
                  onCompleteScheduledWorkout={(scheduledWorkoutId) =>
                    void completeScheduledWorkout(scheduledWorkoutId)
                  }
                  onCancelScheduledWorkout={(scheduledWorkoutId) =>
                    void deleteScheduledWorkout(scheduledWorkoutId)
                  }
                  onViewSession={setViewingSession}
                />

                <StatsOverview
                  sessionsCount={data.sessions.length}
                  sessionsThisWeek={sessionsThisWeek}
                  exercisesCount={data.exercises.length}
                  equipmentCount={data.equipment.length}
                  measurementsCount={data.measurements.length}
                  nextSprint={nextSprint}
                />

                <Tabs items={tabItems} />
              </>
            )}

            <ViewSessionDetailsModal
              open={Boolean(viewingSession)}
              session={viewingSession}
              renderEntries={renderEntries}
              onClose={() => setViewingSession(null)}
            />

            <Modal
              title="Переименовать профиль"
              open={renameModalOpen}
              okText="Сохранить"
              cancelText="Отмена"
              onOk={async () => {
                const success = await renameActiveUser(renameLogin)
                if (success) {
                  setRenameModalOpen(false)
                }
              }}
              onCancel={() => {
                setRenameModalOpen(false)
                setRenameLogin(activeUser.login)
              }}
            >
              <Input
                value={renameLogin}
                placeholder="Например, alex"
                onChange={(event) => setRenameLogin(event.target.value)}
                onPressEnter={async () => {
                  const success = await renameActiveUser(renameLogin)
                  if (success) {
                    setRenameModalOpen(false)
                  }
                }}
              />
            </Modal>
          </>
        )}
      </Content>
    </Layout>
  )
}

export default App
