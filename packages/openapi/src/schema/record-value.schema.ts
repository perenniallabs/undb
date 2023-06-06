import type { Field, IFieldType, Record } from '@undb/core'
import {
  RecordId,
  attachmentFieldQueryValue,
  autoIncrementQueryValue,
  averageFieldQueryValue,
  boolFieldQueryValue,
  collaboratorFieldQueryValue,
  colorFieldQueryValue,
  countFieldQueryValue,
  createdAtFieldQueryValue,
  createdByFieldQueryValue,
  currencyFieldQueryValue,
  dateFieldQueryValue,
  dateRangeFieldQueryValue,
  emailFieldQueryValue,
  idFieldQueryValue,
  lookupFieldQueryValue,
  multiSelectFieldQueryValue,
  numberFieldQueryValue,
  parentFieldQueryValue,
  ratingFieldQueryValue,
  referenceFieldQueryValue,
  selectFieldQueryValue,
  stringFieldQueryValue,
  sumFieldQueryValue,
  treeFieldQueryValue,
  updatedAtFieldQueryValue,
  updatedByFieldQueryValue,
} from '@undb/core'
import type { ZodType } from 'zod'

export const createOpenAPIRecordValueSchema = (): globalThis.Record<IFieldType, ZodType> => ({
  string: stringFieldQueryValue,
  number: numberFieldQueryValue,
  id: idFieldQueryValue.openapi({ example: RecordId.createId() }),
  'created-at': createdAtFieldQueryValue.openapi({ example: new Date().toISOString() }),
  'updated-at': updatedAtFieldQueryValue.openapi({ example: new Date().toISOString() }),
  'auto-increment': autoIncrementQueryValue,
  color: colorFieldQueryValue,
  email: emailFieldQueryValue,
  date: dateFieldQueryValue,
  select: selectFieldQueryValue,
  'multi-select': multiSelectFieldQueryValue,
  bool: boolFieldQueryValue,
  'date-range': dateRangeFieldQueryValue,
  reference: referenceFieldQueryValue,
  tree: treeFieldQueryValue,
  parent: parentFieldQueryValue,
  rating: ratingFieldQueryValue,
  currency: currencyFieldQueryValue,
  count: countFieldQueryValue,
  lookup: lookupFieldQueryValue,
  sum: sumFieldQueryValue,
  average: averageFieldQueryValue,
  attachment: attachmentFieldQueryValue,
  collaborator: collaboratorFieldQueryValue,
  'created-by': createdByFieldQueryValue,
  'updated-by': updatedByFieldQueryValue,
})

export const getOpenAPIExample = (field: Field, record?: Record): globalThis.Record<IFieldType, any> => {
  const values = record?.valuesJSON
  return {
    string: values?.[field.id.value],
    number: values?.[field.id.value],
    id: record?.id.value ?? RecordId.createId(),
    'created-at': record?.createdAt.value.toISOString() ?? new Date().toISOString(),
    'updated-at': record?.createdAt.value.toISOString() ?? new Date().toISOString(),
    'auto-increment': record?.autoIncrement,
    color: values?.[field.id.value],
    email: values?.[field.id.value],
    date: values?.[field.id.value],
    select: values?.[field.id.value],
    'multi-select': values?.[field.id.value],
    bool: values?.[field.id.value],
    'date-range': values?.[field.id.value],
    reference: values?.[field.id.value],
    tree: values?.[field.id.value],
    parent: values?.[field.id.value],
    rating: values?.[field.id.value],
    currency: values?.[field.id.value],
    count: values?.[field.id.value],
    lookup: values?.[field.id.value],
    sum: values?.[field.id.value],
    average: values?.[field.id.value],
    attachment: values?.[field.id.value],
    collaborator: values?.[field.id.value],
    'created-by': record?.createdBy,
    'updated-by': record?.updatedBy,
  }
}
