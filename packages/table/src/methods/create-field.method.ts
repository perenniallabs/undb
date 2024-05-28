import { None, Option, Some, andOptions } from "@undb/domain"
import { FieldCreatedEvent } from "../events"
import { type ICreateFieldDTO } from "../modules"
import type { TableComositeSpecification } from "../specifications"
import type { TableDo } from "../table.do"

export function createFieldMethod(this: TableDo, dto: ICreateFieldDTO): Option<TableComositeSpecification> {
  const createFieldSpec = this.schema.$createField(dto)
  const formAddFieldSpec = this.forms?.$addField(createFieldSpec.field)

  const spec = andOptions(Some(createFieldSpec), formAddFieldSpec ? Some(formAddFieldSpec) : None).unwrap()
  spec.mutate(this)

  const event = new FieldCreatedEvent({
    tableId: this.id.value,
    field: createFieldSpec.field.toJSON(),
    forms: formAddFieldSpec?.forms.toJSON(),
  })
  this.addDomainEvent(event)

  return Some(spec)
}
