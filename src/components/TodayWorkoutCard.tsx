import { Alert, Button, Card, Flex, Space, Tag, Typography } from 'antd';
import type { ScheduledWorkout, WorkoutSession } from '../types';

const { Text, Title } = Typography;

type TodayWorkoutCardProps = {
  todaySessions: WorkoutSession[];
  todayScheduledWorkouts: ScheduledWorkout[];
  onCompleteScheduledWorkout: (scheduledWorkoutId: string) => void;
  onCancelScheduledWorkout: (scheduledWorkoutId: string) => void;
};

export function TodayWorkoutCard({
  todaySessions,
  todayScheduledWorkouts,
  onCompleteScheduledWorkout,
  onCancelScheduledWorkout,
}: TodayWorkoutCardProps) {
  if (todaySessions.length === 0 && todayScheduledWorkouts.length === 0) {
    return null;
  }

  return (
    <Card className="today-workout-card">
      <Flex vertical gap={16}>
        <div className="today-workout-card__header">
          <div>
            <Tag color="blue">Сегодня</Tag>
            <Title level={4}>Фокус дня</Title>
            <Text type="secondary">
              Текущие тренировки на сегодня собраны здесь, чтобы их было видно
              сразу после входа.
            </Text>
          </div>
        </div>

        {todayScheduledWorkouts.length > 0 ? (
          <Alert
            type="info"
            showIcon
            title="Запланированы тренировки"
            description={
              <Flex vertical gap={8}>
                {todayScheduledWorkouts.map((item) => (
                  <div key={item.id} className="today-workout-card__item">
                    <Space>
                      <span className="today-workout-card__item-title">
                        {item.templateName}
                      </span>
                      <span className="today-workout-card__item-meta">
                        ждет выполнения
                      </span>
                    </Space>
                    <Flex gap={8} wrap="wrap">
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => onCompleteScheduledWorkout(item.id)}
                      >
                        Выполнить
                      </Button>
                      <Button
                        size="small"
                        danger
                        onClick={() => onCancelScheduledWorkout(item.id)}
                      >
                        Отменить
                      </Button>
                    </Flex>
                  </div>
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
                  <div key={session.id} className="today-workout-card__item">
                    <span className="today-workout-card__item-title">
                      {session.title}
                    </span>
                    <span className="today-workout-card__item-meta">
                      {session.entries.length} упражнений
                    </span>
                  </div>
                ))}
              </Flex>
            }
          />
        ) : null}
      </Flex>
    </Card>
  );
}
