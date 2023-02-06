import type { IDateRangeFilterOperator } from '../filter'
import type { IDateRangeFilter } from '../filter/date-range.filter'
import { DateRangeFieldValue } from './date-range-field-value'
import type {
  DateRangeType,
  ICreateDateRangeFieldSchema,
  ICreateDateRangeFieldValue,
  IDateRangeFieldValue,
} from './date-range-field.type'
import { BaseField } from './field.base'
import type { IDateRangeField } from './field.type'
import type { IFieldVisitor } from './field.visitor'
import { FieldId, FieldName, FieldValueConstraints } from './value-objects'

export class DateRangeField extends BaseField<IDateRangeField> {
  type: DateRangeType = 'date-range'

  static create(input: Omit<ICreateDateRangeFieldSchema, 'type'>): DateRangeField {
    const fieldName = FieldName.create(input.name)

    return new DateRangeField({
      id: FieldId.fromNullableString(input.id),
      name: fieldName,
      valueConstrains: FieldValueConstraints.create({ required: input.required }),
    })
  }

  static unsafeCreate(input: ICreateDateRangeFieldSchema): DateRangeField {
    return new DateRangeField({
      id: FieldId.fromNullableString(input.id),
      name: FieldName.unsafaCreate(input.name),
      valueConstrains: FieldValueConstraints.unsafeCreate({ required: input.required }),
    })
  }

  createValue(value: ICreateDateRangeFieldValue): DateRangeFieldValue {
    return new DateRangeFieldValue(value)
  }

  createFilter(operator: IDateRangeFilterOperator, value: IDateRangeFieldValue | null): IDateRangeFilter {
    return { operator, value, path: this.id.value, type: 'date-range' }
  }

  accept(visitor: IFieldVisitor): void {
    visitor.dateRange(this)
  }
}
