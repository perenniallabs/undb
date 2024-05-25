import { None, Option, Some } from "@undb/domain"
import { TableIdVo } from "../../../../table-id.vo"
import type { IGetRecordByIdDTO } from "../../dto"
import { RecordIdVO, type IRecordReadableDTO } from "../../record"
import { recordToReadable } from "../../record.util"
import type { RecordsQueryService } from "../records.query-service"

export async function getReadableRecordById(
  this: RecordsQueryService,
  dto: IGetRecordByIdDTO,
): Promise<Option<IRecordReadableDTO>> {
  const tableId = new TableIdVo(dto.tableId)
  const table = (await this.tableRepository.findOneById(tableId)).expect("Table not found")

  const record = (await this.repo.findOneById(table, new RecordIdVO(dto.id))).into(undefined)
  return record ? Some(recordToReadable(table, record)) : None
}
