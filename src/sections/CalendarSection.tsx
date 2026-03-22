import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Row,
  Segmented,
  Select,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { calendarModeOptions } from '../constants'
import { useDashboardData } from '../hooks/useDashboardData'
import { useAppStore } from '../store/appStore'
import {
  formatShortDate,
  formatWeekday,
  getMeasurementsForDay,
  getScheduledWorkoutsForDay,
  getSessionsForDay,
  isTodayDateInput,
  isWeekendDateInput,
  toDateInput,
} from '../utils'

const { Text, Title } = Typography

export function CalendarSection() {
  const [templateByDay, setTemplateByDay] = useState<Record<string, string>>({})
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedDate, setSelectedDate] = useState(toDateInput(new Date()))

  const calendarMode = useAppStore((state) => state.calendarMode)
  const setCalendarMode = useAppStore((state) => state.setCalendarMode)
  const moveCalendar = useAppStore((state) => state.moveCalendar)
  const resetCalendar = useAppStore((state) => state.resetCalendar)
  const sessions = useAppStore((state) => state.data.sessions)
  const measurements = useAppStore((state) => state.data.measurements)
  const scheduledWorkouts = useAppStore((state) => state.data.scheduledWorkouts)
  const scheduleWorkoutTemplate = useAppStore(
    (state) => state.scheduleWorkoutTemplate,
  )
  const deleteScheduledWorkout = useAppStore(
    (state) => state.deleteScheduledWorkout,
  )
  const completeScheduledWorkout = useAppStore(
    (state) => state.completeScheduledWorkout,
  )
  const startScheduledWorkout = useAppStore((state) => state.startScheduledWorkout)
  const { calendarDays, workoutTemplateOptions } = useDashboardData()

  const hasTemplates = workoutTemplateOptions.length > 0

  const selectedTemplateLabel = useMemo(
    () =>
      workoutTemplateOptions.find((option) => option.value === selectedTemplateId)
        ?.label ?? '',
    [selectedTemplateId, workoutTemplateOptions],
  )

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

      <Card className="entity-item-card">
        <Title level={5}>Планировщик тренировок</Title>
        {hasTemplates ? (
          <Flex vertical gap={12}>
            <Text type="secondary">
              Выберите шаблон и дату, чтобы назначить тренировку на любой день.
            </Text>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={10}>
                <Select
                  value={selectedTemplateId || undefined}
                  options={workoutTemplateOptions}
                  placeholder="Выберите шаблон тренировки"
                  onChange={setSelectedTemplateId}
                />
              </Col>
              <Col xs={24} md={8}>
                <DatePicker
                  style={{ width: '100%' }}
                  value={selectedDate ? dayjs(selectedDate) : null}
                  onChange={(value) =>
                    setSelectedDate(value ? value.format('YYYY-MM-DD') : '')
                  }
                />
              </Col>
              <Col xs={24} md={6}>
                <Button
                  type="primary"
                  block
                  disabled={!selectedTemplateId || !selectedDate}
                  onClick={() => {
                    if (!selectedTemplateId || !selectedDate) {
                      return
                    }

                    void scheduleWorkoutTemplate(selectedTemplateId, selectedDate)
                  }}
                >
                  Назначить
                </Button>
              </Col>
            </Row>
            {selectedTemplateLabel && selectedDate ? (
              <Text type="secondary">
                Будет назначено: {selectedTemplateLabel} на {selectedDate}
              </Text>
            ) : null}
          </Flex>
        ) : (
          <Empty description="Сначала создайте хотя бы один шаблон тренировки во вкладке Тренировки" />
        )}
      </Card>

      <Row gutter={[12, 12]}>
        {calendarDays.map((date) => {
          const daySessions = getSessionsForDay(sessions, date)
          const dayMeasurements = getMeasurementsForDay(measurements, date)
          const dayPlannedWorkouts = getScheduledWorkoutsForDay(
            scheduledWorkouts,
            date,
          )
          const isToday = isTodayDateInput(date)
          const isWeekend = isWeekendDateInput(date)

          return (
            <Col
              xs={24}
              sm={12}
              md={calendarMode === 'day' ? 24 : 8}
              xl={calendarMode === 'month' ? 6 : 6}
              key={date}
            >
              <Card
                size="small"
                className={`calendar-day-card${isToday ? ' calendar-day-card--today' : ''}${
                  isWeekend ? ' calendar-day-card--weekend' : ''
                }`}
                title={
                  <div className="calendar-day-card__title">
                    <Tag variant="filled" className="calendar-day-card__weekday-tag">
                      {formatWeekday(date)}
                    </Tag>
                    <div className="calendar-day-card__date-block">
                      <span className="calendar-day-card__date">
                        {formatShortDate(date)}
                      </span>
                    </div>
                  </div>
                }
                extra={isToday ? <Tag color="blue">Сегодня</Tag> : null}
              >
                <Flex vertical gap={10}>
                  <Text type="secondary">
                    Выполненных тренировок: {daySessions.length}
                  </Text>

                  <Flex gap={8} wrap="wrap">
                    {daySessions.length > 0 ? <Tag color="blue">Тренировка</Tag> : null}
                    {dayMeasurements.length > 0 ? <Tag color="gold">Замер</Tag> : null}
                    {dayPlannedWorkouts.length > 0 ? (
                      <Tag color="purple">
                        Запланировано: {dayPlannedWorkouts.length}
                      </Tag>
                    ) : null}
                  </Flex>

                  {dayPlannedWorkouts.length > 0 ? (
                    <div className="workout-session-summary">
                      {dayPlannedWorkouts.map((item) => (
                        <div key={item.id} className="workout-entry-summary">
                          <div className="workout-entry-summary__title">
                            {item.templateName}
                          </div>
                          <Flex gap={8} wrap="wrap">
                            <Button
                              size="small"
                              type="primary"
                              onClick={() => void startScheduledWorkout(item.id)}
                            >
                              Начать
                            </Button>
                            <Button
                              size="small"
                              onClick={() => void completeScheduledWorkout(item.id)}
                            >
                              Завершить сразу
                            </Button>
                            <Button
                              size="small"
                              danger
                              onClick={() => void deleteScheduledWorkout(item.id)}
                            >
                              Отменить
                            </Button>
                          </Flex>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {hasTemplates ? (
                    <Flex vertical gap={8}>
                      <Select
                        value={templateByDay[date] || undefined}
                        options={workoutTemplateOptions}
                        placeholder="Быстро назначить на этот день"
                        onChange={(value) =>
                          setTemplateByDay((current) => ({
                            ...current,
                            [date]: value,
                          }))
                        }
                      />
                      <Button
                        size="small"
                        disabled={!templateByDay[date]}
                        onClick={() => {
                          const templateId = templateByDay[date]
                          if (!templateId) {
                            return
                          }

                          void scheduleWorkoutTemplate(templateId, date)
                          setTemplateByDay((current) => ({
                            ...current,
                            [date]: '',
                          }))
                        }}
                      >
                        Назначить на этот день
                      </Button>
                    </Flex>
                  ) : null}

                  {daySessions.length === 0 &&
                  dayMeasurements.length === 0 &&
                  dayPlannedWorkouts.length === 0 ? (
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
