import { Form, Input, Modal, type FormInstance } from 'antd'
import type { SessionFormValues } from './types'

type LogWorkoutModalProps = {
  form: FormInstance<SessionFormValues>
  open: boolean
  onSubmit: (values: SessionFormValues) => void
  onCancel: () => void
}

export function LogWorkoutModal({
  form,
  open,
  onSubmit,
  onCancel,
}: LogWorkoutModalProps) {
  return (
    <Modal
      title="Сохранить как выполненную тренировку"
      open={open}
      forceRender
      onOk={() => void form.submit()}
      onCancel={onCancel}
      okText="Сохранить"
      cancelText="Отмена"
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item label="Дата" name="date" rules={[{ required: true, message: 'Укажите дату' }]}>
          <Input type="date" />
        </Form.Item>
        <Form.Item
          label="Название тренировки"
          name="title"
          rules={[{ required: true, message: 'Укажите название тренировки' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item label="Заметка" name="notes">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
