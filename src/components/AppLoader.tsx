import { Flex, Spin } from 'antd'

export function AppLoader() {
  return (
    <Flex align="center" justify="center" className="page-loader">
      <Spin size="large" />
    </Flex>
  )
}
