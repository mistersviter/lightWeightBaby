import { Button, Card, Col, Flex, Row, Segmented, Tag, Typography } from 'antd'
import { calendarModeOptions } from '../constants'
import { useDashboardData } from '../hooks/useDashboardData'
import { useAppStore } from '../store/appStore'
import { formatShortDate, getMeasurementsForDay, getSessionsForDay } from '../utils'

const { Text } = Typography

export function CalendarSection() {
  const calendarMode = useAppStore((state) => state.calendarMode)
  const setCalendarMode = useAppStore((state) => state.setCalendarMode)
  const moveCalendar = useAppStore((state) => state.moveCalendar)
  const resetCalendar = useAppStore((state) => state.resetCalendar)
  const sessions = useAppStore((state) => state.data.sessions)
  const measurements = useAppStore((state) => state.data.measurements)
  const { calendarDays } = useDashboardData()

  return (
    <Flex vertical gap={16} style={{ width: '100%' }}>
      <Flex justify="space-between" wrap gap={12}>
        <Segmented
          value={calendarMode}
          options={calendarModeOptions}
          onChange={(value) => setCalendarMode(value)}
        />
        <Flex wrap gap={8}>
          <Button onClick={() => moveCalendar(-1)}>Назад</Button>
          <Button onClick={resetCalendar}>Сегодня</Button>
          <Button onClick={() => moveCalendar(1)}>Вперед</Button>
        </Flex>
      </Flex>

      <Row gutter={[12, 12]}>
        {calendarDays.map((date) => {
          const daySessions = getSessionsForDay(sessions, date)
          const dayMeasurements = getMeasurementsForDay(measurements, date)

          return (
            <Col
              xs={24}
              sm={12}
              md={calendarMode === 'day' ? 24 : 8}
              xl={calendarMode === 'month' ? 6 : 6}
              key={date}
            >
              <Card size="small" title={formatShortDate(date)}>
                <Flex vertical gap={8}>
                  <Text type="secondary">{daySessions.length} тренировок</Text>
                  {daySessions.length > 0 ? <Tag color="blue">Тренировка</Tag> : null}
                  {dayMeasurements.length > 0 ? <Tag color="gold">Замер</Tag> : null}
                  {daySessions.length === 0 && dayMeasurements.length === 0 ? (
                    <Text type="secondary">Пусто</Text>
                  ) : null}
                </Flex>
              </Card>
            </Col>
          )
        })}
      </Row>
    </Flex>
  )
}
