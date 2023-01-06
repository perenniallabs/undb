import type { Field, Table } from '@egodb/core'
import { Select } from '@egodb/ui'
import { useState } from 'react'
import { FieldIcon } from '../fields/field-Icon'
import { FileItem } from '../fields/field-item'
interface IProps {
  schema: Table['schema']
  value: Field | null
  onChange: (field: Field | null) => void
}

export const FieldSelector: React.FC<IProps> = ({ schema, value, onChange }) => {
  const [selectedColumnType, setSelectedColumnType] = useState<string>()

  const getFieldIcon = () => {
    if (value && selectedColumnType) {
      return <FieldIcon type={selectedColumnType} />
    }
    return null
  }

  return (
    <Select
      searchable
      clearable
      value={value?.id.value}
      onChange={(value) => {
        onChange(value ? schema.getFieldById(value).into(null) : null)
        const selectedColumn = value ? schema.getFieldById(value).into(null) : null
        if (selectedColumn) {
          setSelectedColumnType(selectedColumn.type)
        }
      }}
      placeholder="search field"
      itemComponent={FileItem}
      data={schema.fields.map((f) => ({
        value: f.id.value,
        label: f.id.value,
        type: f.type,
      }))}
      icon={getFieldIcon()}
    />
  )
}
