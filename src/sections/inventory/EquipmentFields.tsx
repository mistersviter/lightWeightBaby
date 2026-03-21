import { Col, Form, Input, InputNumber, Row, Select, type FormInstance } from 'antd'
import { equipmentKindOptions } from '../../constants'
import type { EquipmentKind } from '../../types'
import type { EquipmentFormValues } from './types'

type EquipmentFieldsProps = {
  form: FormInstance<EquipmentFormValues>
}

function requiresMountSize(kind: EquipmentKind | undefined) {
  return (
    kind === 'plate' ||
    kind === 'handle' ||
    kind === 'lock' ||
    kind === 'barbell_bar'
  )
}

export function EquipmentFields({ form }: EquipmentFieldsProps) {
  const kind = Form.useWatch('kind', form) as EquipmentKind | undefined

  return (
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <Form.Item label="Название" name="name" rules={[{ required: true }]}>
          <Input placeholder="Например, скамья для жима или блин 1.25 кг" />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label="Тип" name="kind" rules={[{ required: true }]}>
          <Select options={equipmentKindOptions} />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label="Количество" name="quantity" rules={[{ required: true }]}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
      </Col>

      {requiresMountSize(kind) ? (
        <Col xs={24} md={12}>
          <Form.Item label="Посадка, мм" name="mountSizeMm">
            <InputNumber min={0} step={1} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      ) : null}

      {kind === 'plate' ? (
        <>
          <Col xs={24} md={8}>
            <Form.Item label="Вес одного блина, кг" name="weightKg" rules={[{ required: true }]}>
              <InputNumber min={0} step={0.25} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Толщина, мм" name="thicknessMm" rules={[{ required: true }]}>
              <InputNumber min={0} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Диаметр, мм" name="diameterMm">
              <InputNumber min={0} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </>
      ) : null}

      {kind === 'handle' || kind === 'barbell_bar' ? (
        <>
          <Col xs={24} md={8}>
            <Form.Item
              label={kind === 'handle' ? 'Вес рукоятки, кг' : 'Вес грифа, кг'}
              name="weightKg"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label={
                kind === 'handle'
                  ? 'Длина втулки на сторону, мм'
                  : 'Длина втулки, мм'
              }
              name="sleeveLengthMm"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label={kind === 'handle' ? 'Длина хвата, мм' : 'Длина центральной части, мм'}
              name="gripLengthMm"
            >
              <InputNumber min={0} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </>
      ) : null}

      {kind === 'lock' ? (
        <>
          <Col xs={24} md={8}>
            <Form.Item label="Вес замка, кг" name="weightKg" rules={[{ required: true }]}>
              <InputNumber min={0} step={0.05} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Толщина, мм" name="thicknessMm">
              <InputNumber min={0} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Диаметр, мм" name="diameterMm">
              <InputNumber min={0} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </>
      ) : null}

      {kind === 'kettlebell' ? (
        <Col xs={24} md={12}>
          <Form.Item label="Вес, кг" name="weightKg" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.5} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      ) : null}

      {kind === 'band' ? (
        <>
          <Col xs={24} md={12}>
            <Form.Item label="Единица" name="unit">
              <Input placeholder="Например, уровень нагрузки" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Шаг" name="increment">
              <InputNumber min={0} step={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </>
      ) : null}

      <Col span={24}>
        <Form.Item label="Комментарий" name="notes">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Col>
    </Row>
  )
}
