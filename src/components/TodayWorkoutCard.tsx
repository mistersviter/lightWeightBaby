import { Alert, Button, Card, Flex, Space, Tag, Typography } from 'antd'
import type { ScheduledWorkout, WorkoutSession } from '../types'

const { Text, Title } = Typography

type TodayWorkoutCardProps = {
  todaySessions: WorkoutSession[]
  todayScheduledWorkouts: ScheduledWorkout[]
  onStartScheduledWorkout: (scheduledWorkoutId: string) => void
  onCompleteScheduledWorkout: (scheduledWorkoutId: string) => void
  onCancelScheduledWorkout: (scheduledWorkoutId: string) => void
}

export function TodayWorkoutCard({
  todaySessions,
  todayScheduledWorkouts,
  onStartScheduledWorkout,
  onCompleteScheduledWorkout,
  onCancelScheduledWorkout,
}: TodayWorkoutCardProps) {
  if (todaySessions.length === 0 && todayScheduledWorkouts.length === 0) {
    return null
  }

  return (
    <Card className="today-workout-card">
      <Flex vertical gap={16}>
        <Flex vertical gap={8}>
          <Tag color="blue">Сегодня</Tag>
          <Title level={4} style={{ margin: 0 }}>
            Фокус дня
          </Title>
          <Text type="secondary">
            Здесь собраны тренировки на сегодня, чтобы к ним можно было быстро
            перейти сразу после входа.
          </Text>
        </Flex>

        {todayScheduledWorkouts.length > 0 ? (
          <Alert
            type="info"
            showIcon
            title="Запланированные тренировки"
            description={
              <Flex vertical gap={8}>
                {todayScheduledWorkouts.map((item) => (
                  <Flex
                    key={item.id}
                    align="center"
                    justify="space-between"
                    gap={12}
                    wrap="wrap"
                  >
                    <Space orientation="vertical" size={0}>
                      <Text strong>{item.templateName}</Text>
                      <Text type="secondary">ждет выполнения</Text>
                    </Space>
                    <Flex gap={8} wrap="wrap">
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => onStartScheduledWorkout(item.id)}
                      >
                        Начать
                      </Button>
                      <Button
                        size="small"
                        onClick={() => onCompleteScheduledWorkout(item.id)}
                      >
                        Завершить сразу
                      </Button>
                      <Button
                        size="small"
                        danger
                        onClick={() => onCancelScheduledWorkout(item.id)}
                      >
                        Отменить
                      </Button>
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            }
          />
        ) : null}

        {todaySessions.length > 0 ? (
          <Alert
            type="success"
            showIcon
            title="Сегодня уже выполнено"
            description={
              <Flex vertical gap={8}>
                {todaySessions.map((session) => (
                  <Flex
                    key={session.id}
                    align="center"
                    justify="space-between"
                    gap={12}
                    wrap="wrap"
                  >
                    <Text strong>{session.title}</Text>
                    <Text type="secondary">{session.entries.length} упражнений</Text>
                  </Flex>
                ))}
              </Flex>
            }
          />
        ) : null}
      </Flex>
    </Card>
  )
}
