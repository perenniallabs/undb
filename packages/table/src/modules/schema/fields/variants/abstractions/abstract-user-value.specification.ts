import { Ok, type Result } from "@undb/domain"
import { isString } from "radash"
import type { IRecordVisitor, RecordDO } from "../../../../records"
import { RecordComositeSpecification } from "../../../../records/record/record.composite-specification"
import type { FieldId } from "../../field-id.vo"

export class UserEqual extends RecordComositeSpecification {
  constructor(
    readonly value: string,
    readonly fieldId: FieldId,
  ) {
    super(fieldId)
  }
  isSatisfiedBy(t: RecordDO): boolean {
    const value = t.getValue(this.fieldId)
    return value.mapOr(false, (v) => isString(v.value) && v.value == this.value)
  }
  mutate(t: RecordDO): Result<RecordDO, string> {
    throw new Error("not implemented")
  }
  accept(v: IRecordVisitor): Result<void, string> {
    v.userEqual(this)
    return Ok(undefined)
  }
}

export class UserEmpty extends RecordComositeSpecification {
  constructor(readonly fieldId: FieldId) {
    super(fieldId)
  }
  isSatisfiedBy(t: RecordDO): boolean {
    const value = t.getValue(this.fieldId)
    return value.mapOr(false, (v) => !isString(v.value) || v.value === undefined || v.value === null)
  }
  mutate(t: RecordDO): Result<RecordDO, string> {
    throw new Error("Method not implemented.")
  }
  accept(v: IRecordVisitor): Result<void, string> {
    v.userEmpty(this)
    return Ok(undefined)
  }
}
