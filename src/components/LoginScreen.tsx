import { LoginOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Flex, Input, Row, Tag, Typography } from 'antd'

const { Title, Text, Paragraph } = Typography

type LoginScreenProps = {
  login: string
  error: string
  userLogins: Array<{ id: string; login: string }>
  onLoginChange: (value: string) => void
  onLogin: () => void
  onQuickLogin: (userId: string) => void
}

export function LoginScreen(props: LoginScreenProps) {
  const { login, error, userLogins, onLoginChange, onLogin, onQuickLogin } = props

  return (
    <Row gutter={[24, 24]} align="middle">
      <Col xs={24} lg={14}>
        <Card>
          <Flex vertical gap={16}>
            <Tag color="blue">lightWeightBaby</Tag>
            <Title level={1}>Автономный фитнес-журнал для зала и дома</Title>
            <Paragraph>
              Приложение работает полностью локально через IndexedDB: без бэкенда,
              без сервера и без пароля на текущем этапе.
            </Paragraph>
          </Flex>
        </Card>
      </Col>
      <Col xs={24} lg={10}>
        <Card title="Вход в локальный профиль">
          <Flex vertical gap={16} style={{ width: '100%' }}>
            <Input
              prefix={<LoginOutlined />}
              placeholder="Например, alex"
              value={login}
              onChange={(event) => onLoginChange(event.target.value)}
              onPressEnter={onLogin}
            />
            <Button type="primary" block onClick={onLogin}>
              Войти
            </Button>
            <Text type="secondary">
              Если логина еще нет, профиль создастся автоматически.
            </Text>
            {userLogins.length > 0 ? (
              <Flex wrap gap={8}>
                {userLogins.map((user) => (
                  <Button key={user.id} onClick={() => onQuickLogin(user.id)}>
                    {user.login}
                  </Button>
                ))}
              </Flex>
            ) : null}
            {error ? <Alert type="error" message={error} showIcon /> : null}
          </Flex>
        </Card>
      </Col>
    </Row>
  )
}
