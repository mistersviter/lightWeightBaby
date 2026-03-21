import { Card, Col, Row, Statistic, Typography } from 'antd'
import type { Sprint } from '../types'
import { formatDate, toDateInput, getSprintEndDate } from '../utils'

const { Text } = Typography

type StatsOverviewProps = {
  sessionsCount: number
  sessionsThisWeek: number
  exercisesCount: number
  equipmentCount: number
  measurementsCount: number
  nextSprint: Sprint | null
}

export function StatsOverview(props: StatsOverviewProps) {
  const {
    sessionsCount,
    sessionsThisWeek,
    exercisesCount,
    equipmentCount,
    measurementsCount,
    nextSprint,
  } = props

  return (
    <Row gutter={[16, 16]} className="stats-row">
      <Col xs={24} sm={12} xl={6}>
        <Card>
          <Statistic title="Тренировок всего" value={sessionsCount} />
          <Text type="secondary">{sessionsThisWeek} за 7 дней</Text>
        </Card>
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Card>
          <Statistic title="Упражнений" value={exercisesCount} />
          <Text type="secondary">{equipmentCount} инвентаря</Text>
        </Card>
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Card>
          <Statistic title="Контрольных замеров" value={measurementsCount} />
        </Card>
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <Card>
          <Statistic title="Активный фокус" value={nextSprint?.name ?? 'Нет'} />
          <Text type="secondary">
            {nextSprint
              ? `${nextSprint.durationDays} дней до ${formatDate(
                  toDateInput(getSprintEndDate(nextSprint)),
                )}`
              : 'Создайте первый спринт'}
          </Text>
        </Card>
      </Col>
    </Row>
  )
}
