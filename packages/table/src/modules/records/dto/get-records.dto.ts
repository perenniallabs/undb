import { pagniationSchema } from "@undb/domain"
import { z } from "zod"
import { tableId } from "../../../table-id.vo"
import { viewId } from "../../views"

export const getRecordsDTO = z.object({
  tableId: tableId,
  viewId: viewId.optional(),
  pagination: pagniationSchema.optional(),
})

export type IGetRecordsDTO = z.infer<typeof getRecordsDTO>
