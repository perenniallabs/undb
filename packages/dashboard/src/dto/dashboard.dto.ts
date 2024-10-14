import { baseIdSchema } from "@undb/base"
import { spaceIdSchema } from "@undb/space"
import { z } from "@undb/zod"
import { dashboardIdSchema, dashboardNameSchema, dashboardWidgetsSchema } from "../value-objects"

export const dashboardDTO = z.object({
  id: dashboardIdSchema,
  baseId: baseIdSchema,
  spaceId: spaceIdSchema,
  name: dashboardNameSchema,
  widgets: dashboardWidgetsSchema.optional().nullable(),
})

export type IDashboardDTO = z.infer<typeof dashboardDTO>
