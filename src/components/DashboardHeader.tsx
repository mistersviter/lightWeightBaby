import { EditOutlined } from '@ant-design/icons'
import { Button, Flex, Tag, Typography } from 'antd'

const { Title } = Typography

type DashboardHeaderProps = {
  login: string
  onRename: () => void
  onLogout: () => void
}

export function DashboardHeader({ login, onRename, onLogout }: DashboardHeaderProps) {
  return (
    <Flex justify="space-between" align="center" wrap gap={12} className="page-header">
      <Flex vertical gap={0}>
        <Tag color="blue">lightWeightBaby</Tag>
        <Title level={2} style={{ margin: 0 }}>
          Прогресс пользователя @{login}
        </Title>
      </Flex>
      <Flex gap={8} wrap="wrap">
        <Button icon={<EditOutlined />} onClick={onRename}>
          Переименовать
        </Button>
        <Button onClick={onLogout}>Сменить профиль</Button>
      </Flex>
    </Flex>
  )
}
