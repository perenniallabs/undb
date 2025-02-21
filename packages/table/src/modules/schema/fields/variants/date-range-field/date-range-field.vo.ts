import { Option, Some } from "@undb/domain"
import { z } from "@undb/zod"
import { format } from "date-fns/fp"
import type { FormFieldVO } from "../../../../forms/form/form-field.vo"
import type { RecordComositeSpecification } from "../../../../records/record/record.composite-specification"
import { fieldId, FieldIdVo } from "../../field-id.vo"
import type { IFieldVisitor } from "../../field.visitor"
import { AbstractField, baseFieldDTO, createBaseFieldDTO } from "../abstract-field.vo"
import { daterangeFieldConstraint, DateRangeFieldConstraint } from "./date-range-field-constraint.vo"
import { dateRangeFieldValue, DateRangeFieldValue } from "./date-range-field-value.vo"
import { dateRangeFieldAggregate } from "./date-range-field.aggregate"
import {
  createDateRangeConditionMather,
  createDateRangeFieldCondition,
  type IDateRangeFieldCondition,
  type IDateRangeFieldConditionSchema,
} from "./date-range-field.condition"
import { DateRangeEqual } from "./date-range-field.specification"

export const DATE_RANGE_TYPE = "dateRange" as const

export const createDateRangeFieldDTO = createBaseFieldDTO.extend({
  type: z.literal(DATE_RANGE_TYPE),
  constraint: daterangeFieldConstraint.optional(),
  defaultValue: dateRangeFieldValue.optional(),
})

export const createTablesDateRangeFieldDTO = createDateRangeFieldDTO

export type ICreateDateRangeFieldDTO = z.infer<typeof createDateRangeFieldDTO>
export const updateDateRangeFieldDTO = createDateRangeFieldDTO.setKey("id", fieldId)
export type IUpdateDateRangeFieldDTO = z.infer<typeof updateDateRangeFieldDTO>

export const dateRangeFieldDTO = baseFieldDTO.extend({
  type: z.literal(DATE_RANGE_TYPE),
  constraint: daterangeFieldConstraint.optional(),
  defaultValue: dateRangeFieldValue.optional(),
})

export type IDateRangeFieldDTO = z.infer<typeof dateRangeFieldDTO>

export class DateRangeField extends AbstractField<DateRangeFieldValue> {
  constructor(dto: IDateRangeFieldDTO) {
    super(dto)
    if (dto.constraint) {
      this.constraint = Some(new DateRangeFieldConstraint(dto.constraint))
    }
    if (dto.defaultValue) {
      this.defaultValue = new DateRangeFieldValue(dto.defaultValue)
    }
  }

  static create(dto: ICreateDateRangeFieldDTO) {
    return new DateRangeField({ ...dto, id: FieldIdVo.fromStringOrCreate(dto.id).value })
  }

  get formatter() {
    return format("yyyy-MM-dd")
  }

  format(date: Date) {
    return this.formatter(date)
  }

  override type = DATE_RANGE_TYPE

  override get #constraint(): DateRangeFieldConstraint {
    return this.constraint.unwrapOrElse(() => new DateRangeFieldConstraint({}))
  }

  override get valueSchema() {
    return this.#constraint.schema
  }

  override get mutateSchema() {
    return this.#constraint.mutateSchema
  }

  override getConstraintFromFormField(formField: FormFieldVO) {
    return this.#constraint.fromFormField(formField)
  }

  override accept(visitor: IFieldVisitor): void {
    visitor.dateRange(this)
  }

  override getSpec(condition: IDateRangeFieldCondition) {
    const spec = createDateRangeConditionMather(condition, this.id).exhaustive()

    return Option(spec)
  }

  protected override getConditionSchema(optionType: z.ZodTypeAny): IDateRangeFieldConditionSchema {
    return createDateRangeFieldCondition()
  }

  override formatAggregate(aggregate?: string, value?: number | string): string | number {
    if (value === undefined) return ""
    if (aggregate === "start_min" || aggregate === "end_min" || aggregate === "start_max" || aggregate === "end_max") {
      return this.formatter(value)
    }
    return value ?? ""
  }

  override get aggregate() {
    return dateRangeFieldAggregate
  }

  override getMutationSpec(value: DateRangeFieldValue): Option<RecordComositeSpecification> {
    return Some(new DateRangeEqual(value, this.id))
  }
}
