import { useEffect, useMemo, useState } from 'react'
import { Alert, Card, Layout, Space, Tabs } from 'antd'
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
import { useAppStore } from './store/appStore'

const { Content } = Layout

function App() {
  const [login, setLogin] = useState('')
  const load = useAppStore((state) => state.load)
  const isReady = useAppStore((state) => state.isReady)
  const error = useAppStore((state) => state.error)
  const loginUser = useAppStore((state) => state.loginUser)
  const switchUser = useAppStore((state) => state.switchUser)
  const logout = useAppStore((state) => state.logout)
  const completeScheduledWorkout = useAppStore(
    (state) => state.completeScheduledWorkout,
  )
  const deleteScheduledWorkout = useAppStore(
    (state) => state.deleteScheduledWorkout,
  )
  const data = useAppStore((state) => state.data)
  const {
    activeUser,
    nextSprint,
    sessionsThisWeek,
    todaySessions,
    todayScheduledWorkouts,
  } = useDashboardData()

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
            <CalendarSection />
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
            <DashboardHeader login={activeUser.login} onLogout={logout} />

            {error ? (
              <Alert type="error" title={error} showIcon style={{ marginBottom: 16 }} />
            ) : null}

            <TodayWorkoutCard
              todaySessions={todaySessions}
              todayScheduledWorkouts={todayScheduledWorkouts}
              onCompleteScheduledWorkout={(scheduledWorkoutId) =>
                void completeScheduledWorkout(scheduledWorkoutId)
              }
              onCancelScheduledWorkout={(scheduledWorkoutId) =>
                void deleteScheduledWorkout(scheduledWorkoutId)
              }
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
      </Content>
    </Layout>
  )
}

export default App
