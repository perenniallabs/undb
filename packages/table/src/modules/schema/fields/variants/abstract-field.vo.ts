import { None, Option, Some } from "@undb/domain"
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
import type { FieldType, FieldValue, IFieldConditionSchema, IFieldOption } from "../field.type"
import { getIsFilterableFieldType, isFieldSortable } from "../field.util"
import type { IFieldVisitor } from "../field.visitor"

export const createBaseFieldDTO = z.object({
  id: fieldId.optional(),
  name: fieldName,
  display: z.boolean().optional(),
})

export type ICreateBaseFieldDTO = z.infer<typeof createBaseFieldDTO>

export const baseFieldDTO = z.object({
  id: fieldId,
  name: fieldName,
  display: z.boolean().optional(),
})

export type IBaseFieldDTO = z.infer<typeof baseFieldDTO>

export abstract class AbstractField<
  V extends FieldValue,
  C extends FieldConstraintVO | undefined = any,
  O extends IFieldOption = any,
> {
  id!: FieldId
  name!: FieldNameVo
  display = false
  constraint: Option<C> = None
  option: Option<O> = None
  #defaultValue: Option<V> = None

  constructor(dto: IBaseFieldDTO) {
    this.id = new FieldIdVo(dto.id)
    this.name = new FieldNameVo(dto.name)
    this.display = dto.display ?? false
  }

  protected computed = false

  public get isComputed() {
    return this.computed
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
    return !this.isSystem && !this.computed
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
    return this.constraint.mapOr(false, (c) => !!c?.required)
  }

  get searchable(): boolean {
    return false
  }

  get mutateSchema(): Option<ZodSchema> {
    if (!this.isMutable) {
      return None
    }

    throw new Error("Method not implemented.")
  }

  protected abstract getConditionSchema<OptionType extends z.ZodTypeAny>(optionType: OptionType): IFieldConditionSchema

  get filterable(): boolean {
    return getIsFilterableFieldType(this.type)
  }

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

  getMutationSpec(value: V): Option<RecordComositeSpecification> {
    return None
  }

  $updateValue(value: V): Option<RecordComositeSpecification> {
    if (this.isSystem || this.computed) {
      return None
    }

    return this.getMutationSpec(value)
  }

  get conditionOps() {
    return this.getConditionSchema(z.any()).options.map((o) => o.shape.op.value)
  }

  get sortable(): boolean {
    return isFieldSortable(this.type)
  }

  abstract get aggregate(): ZodEnum<[string, ...string[]]> | ZodUndefined

  get defaultValue(): Option<V> {
    if (this.isSystem) {
      return None
    }

    return this.#defaultValue
  }

  set defaultValue(value: V) {
    if (this.isSystem) {
      return
    }

    this.#defaultValue = Some(value)
  }

  get isDefaultValueValid(): boolean {
    if (this.defaultValue.isNone()) return true
    return this.validate(this.defaultValue.unwrap()).success
  }

  toJSON(): IFieldDTO {
    return {
      id: this.id.value,
      name: this.name.value,
      type: this.type as any,
      display: this.display,
      defaultValue: (this.defaultValue.into(undefined)?.value ?? undefined) as any,
      constraint: this.constraint.into(undefined)?.value,
      option: this.option.into(undefined) as IFieldOption,
    }
  }
}
