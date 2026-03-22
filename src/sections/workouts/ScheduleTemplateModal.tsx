import { Form, Input, Modal, type FormInstance } from 'antd'
import type { WorkoutTemplate } from '../../types'
import type { ScheduleFormValues } from './types'

type ScheduleTemplateModalProps = {
  form: FormInstance<ScheduleFormValues>
  template: WorkoutTemplate | null
  onSubmit: () => void
  onCancel: () => void
}

export function ScheduleTemplateModal({
  form,
  template,
  onSubmit,
  onCancel,
}: ScheduleTemplateModalProps) {
  return (
    <Modal
      title={template ? `Назначить: ${template.name}` : 'Назначить шаблон'}
      open={Boolean(template)}
      forceRender
      onOk={onSubmit}
      onCancel={onCancel}
      okText="Назначить"
      cancelText="Отмена"
    >
      <Form form={form} layout="vertical">
        <Form.Item label="Дата" name="date" rules={[{ required: true, message: 'Укажите дату' }]}>
          <Input type="date" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
