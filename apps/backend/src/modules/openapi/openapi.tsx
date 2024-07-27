import {
  BulkDeleteRecordsCommand,
  BulkDuplicateRecordsCommand,
  BulkUpdateRecordsCommand,
  CreateRecordCommand,
  CreateRecordsCommand,
  DeleteRecordCommand,
  DuplicateRecordCommand,
  UpdateRecordCommand,
} from "@undb/commands"
import { executionContext, getCurrentUser } from "@undb/context/server"
import { CommandBus, QueryBus } from "@undb/cqrs"
import { inject, singleton } from "@undb/di"
import { type ICommandBus, None, PaginatedDTO, type IQueryBus, Some } from "@undb/domain"
import { createLogger } from "@undb/logger"
import { createOpenApiSpec, type IApiTokenService, injectApiTokenService } from "@undb/openapi"
import { injectQueryBuilder, type IQueryBuilder } from "@undb/persistence"
import { GetReadableRecordByIdQuery, GetReadableRecordsQuery } from "@undb/queries"
import {
  injectRecordRepository,
  injectTableRepository,
  withUniqueTable,
  type IRecordReadableValueDTO,
  type IRecordRepository,
  type ITableRepository,
} from "@undb/table"
import Elysia, { t } from "elysia"
import { withTransaction } from "../../db"
import { type IBaseRepository, injectBaseRepository } from "@undb/base"
import { injectUserService, type IUserService } from "@undb/user"
import { injectWorkspaceMemberService, type IWorkspaceMemberService } from "@undb/authz"

@singleton()
export class OpenAPI {
  private readonly logger = createLogger(OpenAPI.name)

  constructor(
    @injectBaseRepository()
    private readonly baseRepo: IBaseRepository,
    @injectTableRepository()
    private readonly repo: ITableRepository,
    @injectRecordRepository()
    private readonly recordRepo: IRecordRepository,

    @inject(QueryBus)
    private readonly queryBus: IQueryBus,

    @inject(CommandBus)
    private readonly commandBus: ICommandBus,
    @injectQueryBuilder()
    private readonly qb: IQueryBuilder,
    @injectApiTokenService()
    private readonly apiTokenService: IApiTokenService,
    @injectUserService()
    private readonly userService: IUserService,
    @injectWorkspaceMemberService()
    private workspaceMemberService: IWorkspaceMemberService,
  ) {}

  public route() {
    return new Elysia({ prefix: "/api/bases/:baseName/tables/:tableName" })
      .onAfterResponse((ctx) => {
        const requestId = executionContext.getStore()?.requestId
        this.logger.info(
          {
            method: ctx.request.method,
            params: ctx.params,
            query: ctx.query,
            path: ctx.path,
            requestId,
          },
          "openapi request",
        )
      })
      .get(
        "/",
        async (ctx) => {
          const { baseName, tableName } = ctx.params
          const ts = withUniqueTable({ baseName, tableName }).unwrap()
          const table = (await this.repo.findOne(Some(ts))).expect("Table not found")
          const base = (await this.baseRepo.findOneById(table.baseId)).expect("Base not found")
          const record = (await this.recordRepo.findOne(table, None)).into(undefined)

          const spec = createOpenApiSpec(base, table, record)

          return `<html>
              <head>
                <title>Scalar API Reference</title>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
              </head>
              <body>
                <script id="api-reference" type="application/json">
                  ${JSON.stringify(spec)}
                </script>
                <script>
                  var configuration = {
                    theme: 'default',
                    layout: 'classic',
                  }

                  document.getElementById('api-reference').dataset.configuration =
                    JSON.stringify(configuration)
                </script>

                <script src="/assets/api-reference.js"></script>
              </body>
            </html>`
        },
        {
          params: t.Object({ baseName: t.String(), tableName: t.String() }),
        },
      )
      .group("/records", (app) => {
        return app
          .guard({
            beforeHandle: async (context) => {
              const user = getCurrentUser()
              if (user.userId) {
                return
              } else {
                const authorization = context.headers["Authorization"] ?? context.headers["authorization"]
                const token = authorization?.replace("Bearer ", "")

                this.logger.debug({ token }, "Checking Authorization token in openapi")

                if (token) {
                  const userId = await this.apiTokenService.verify(token)
                  if (userId.isSome()) {
                    const user = (await this.userService.findOneById(userId.unwrap())).unwrap()
                    const member = (await this.workspaceMemberService.getWorkspaceMember(user.id, user.id)).unwrap()

                    executionContext.enterWith({
                      requestId: context.headers["x-request-id"] ?? context.headers["X-Request-ID"] ?? "",
                      user: { userId: user?.id ?? null, email: user?.email, username: user?.username },
                      member: { role: member?.value.role ?? null } ?? null,
                    })
                    return
                  }
                }
              }

              // throw 401 openapi error
              context.set.status = 401
              throw new Error("Unauthorized")
            },
          })
          .get(
            "/",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              const result = (await this.queryBus.execute(
                new GetReadableRecordsQuery({ baseName, tableName }),
              )) as PaginatedDTO<IRecordReadableValueDTO>
              return {
                total: result.total,
                records: result.values,
              }
            },
            { params: t.Object({ baseName: t.String(), tableName: t.String() }) },
          )
          .get(
            "/:recordId",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              const result = await this.queryBus.execute(
                new GetReadableRecordByIdQuery({ baseName, tableName, id: ctx.params.recordId }),
              )
              return {
                data: result,
              }
            },
            { params: t.Object({ baseName: t.String(), tableName: t.String(), recordId: t.String() }) },
          )
          .post(
            "/",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(new CreateRecordCommand({ baseName, tableName, values: ctx.body.values })),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String() }),
              body: t.Object({ values: t.Record(t.String(), t.Any()) }),
            },
          )
          .post(
            "/bulk",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(new CreateRecordsCommand({ baseName, tableName, records: ctx.body.records })),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String() }),
              body: t.Object({ records: t.Array(t.Object({ id: t.Optional(t.String()), values: t.Any() })) }),
            },
          )
          .patch(
            "/:recordId",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(
                  new UpdateRecordCommand({
                    tableName,
                    baseName,
                    id: ctx.params.recordId,
                    values: ctx.body.values,
                  }),
                ),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String(), recordId: t.String() }),
              body: t.Object({ values: t.Record(t.String(), t.Any()) }),
            },
          )
          .patch(
            "/records",
            async (ctx) => {
              const { tableName, baseName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(
                  new BulkUpdateRecordsCommand({
                    tableName,
                    baseName,
                    filter: ctx.body.filter,
                    values: ctx.body.values,
                    isOpenapi: true,
                  }),
                ),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String() }),
              body: t.Object({
                filter: t.Any(),
                values: t.Record(t.String(), t.Any()),
              }),
            },
          )
          .post(
            "/:recordId/duplicate",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(new DuplicateRecordCommand({ baseName, tableName, id: ctx.params.recordId })),
              )
            },
            { params: t.Object({ baseName: t.String(), tableName: t.String(), recordId: t.String() }) },
          )
          .post(
            "/records/duplicate",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(
                  new BulkDuplicateRecordsCommand({
                    baseName,
                    tableName,
                    filter: ctx.body.filter,
                    isOpenapi: true,
                  }),
                ),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String() }),
              body: t.Object({ filter: t.Any() }),
            },
          )
          .delete(
            "/:recordId",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(new DeleteRecordCommand({ baseName, tableName, id: ctx.params.recordId })),
              )
            },
            { params: t.Object({ baseName: t.String(), tableName: t.String(), recordId: t.String() }) },
          )
          .delete(
            "/",
            async (ctx) => {
              const { baseName, tableName } = ctx.params
              return withTransaction(this.qb)(() =>
                this.commandBus.execute(
                  new BulkDeleteRecordsCommand({
                    baseName,
                    tableName,
                    filter: ctx.body.filter,
                    isOpenapi: true,
                  }),
                ),
              )
            },
            {
              params: t.Object({ baseName: t.String(), tableName: t.String() }),
              body: t.Object({ filter: t.Any() }),
            },
          )
      })
  }
}
