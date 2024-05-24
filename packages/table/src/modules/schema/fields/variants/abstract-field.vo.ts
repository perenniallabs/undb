import { None, NotImplementException, Option, ValueObject } from "@undb/domain"
import { ZodEnum, ZodUndefined, z, type ZodSchema } from "@undb/zod"
import type {
  INotRecordComositeSpecification,
  IRecordComositeSpecification,
  RecordComositeSpecification,
} from "../../../records/record/record.composite-specification"
import type { IFieldCondition, MaybeFieldConditionWithFieldId } from "../condition/field-condition.type"
import type { IFieldDTO } from "../dto/field.dto"
import type { FieldConstraintVO } from "../field-constraint.vo"
import { FieldIdVo, fieldId, type FieldId } from "../field-id.vo"
import { FieldNameVo, fieldName } from "../field-name.vo"
import type { FieldType } from "../field.type"
import { isFieldSortable } from "../field.util"
import type { IFieldVisitor } from "../field.visitor"
import type { IAutoIncrementFieldConditionSchema } from "./autoincrement-field/autoincrement-field.condition"
import type { ICreatedAtFieldConditionSchema } from "./created-at-field"
import type { IIdFieldConditionSchema } from "./id-field/id-field.condition"
import type { INumberFieldConditionSchema } from "./number-field"
import type { IStringFieldConditionSchema } from "./string-field"
import type { IUpdatedAtFieldConditionSchema } from "./updated-at-field"

export const createBaseFieldDTO = z.object({
  id: fieldId.optional(),
  name: fieldName,
})

export type ICreateBaseFieldDTO = z.infer<typeof createBaseFieldDTO>

export const baseFieldDTO = z.object({
  id: fieldId,
  name: fieldName,
})

export type IBaseFieldDTO = z.infer<typeof baseFieldDTO>

export abstract class AbstractField<V extends ValueObject, C extends FieldConstraintVO = any> {
  id!: FieldId
  name!: FieldNameVo
  constraint: Option<C> = None

  constructor(dto: IBaseFieldDTO) {
    this.id = new FieldIdVo(dto.id)
    this.name = new FieldNameVo(dto.name)
  }

  abstract type: FieldType
  /**
   * whether the field value is controlled by system
   */
  protected system = false
  public get isSystem() {
    return this.system
  }

  public get isMutable() {
    return !this.isSystem
  }

  protected abstract get valueSchema(): ZodSchema
  validate(value: V) {
    return this.valueSchema.safeParse(value.unpack())
  }
  get readableSchema(): ZodSchema {
    return this.valueSchema
  }

  abstract getSpec(condition: IFieldCondition): Option<IRecordComositeSpecification | INotRecordComositeSpecification>

  abstract accept(visitor: IFieldVisitor): void

  get required(): boolean {
    return this.constraint.mapOr(false, (c) => !!c.required)
  }

  get searchable(): boolean {
    return false
  }

  protected abstract getConditionSchema<OptionType extends z.ZodTypeAny>(
    optionType: OptionType,
  ):
    | IIdFieldConditionSchema
    | IStringFieldConditionSchema
    | INumberFieldConditionSchema
    | ICreatedAtFieldConditionSchema
    | IUpdatedAtFieldConditionSchema
    | IAutoIncrementFieldConditionSchema

  validateCondition<OptionType extends z.ZodTypeAny>(
    condition: MaybeFieldConditionWithFieldId,
    optionType: OptionType,
  ) {
    return this.getConditionSchema(optionType).safeParse(condition)
  }

  isOpHasValue(op: string) {
    const hasValue =
      this.getConditionSchema(z.any()).options.find((o) => o.shape.op.value === op)?.shape.value._def.typeName !==
      ZodUndefined.name

    return hasValue
  }

  updateValue(value: V): Option<RecordComositeSpecification> {
    if (this.isSystem) {
      return None
    }

    throw new NotImplementException(this.type + ".updateValue")
  }

  get conditionOps() {
    return this.getConditionSchema(z.any()).options.map((o) => o.shape.op.value)
  }

  get sortable(): boolean {
    return isFieldSortable(this.type)
  }

  abstract get aggregate(): ZodEnum

  toJSON(): IFieldDTO {
    return {
      id: this.id.value,
      name: this.name.value,
      type: this.type,
      constraint: this.constraint.into(undefined)?.value,
    }
  }
}
