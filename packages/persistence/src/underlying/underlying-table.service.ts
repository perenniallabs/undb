import { singleton } from "@undb/di"
import { createLogger } from "@undb/logger"
import type { TableComositeSpecification, TableDo } from "@undb/table"
import { Database } from "bun:sqlite"
import type { CompiledQuery } from "kysely"
import { all } from "radash"
import { injectSqlite } from "../db.provider"
import type { IQueryBuilder } from "../qb"
import { injectQueryBuilder } from "../qb.provider"
import { UnderlyingTable } from "./underlying-table"
import { UnderlyingTableFieldVisitor } from "./underlying-table-field.visitor"
import { UnderlyingTableSpecVisitor } from "./underlying-table-spec.visitor"

@singleton()
export class UnderlyingTableService {
  readonly logger = createLogger(UnderlyingTableService.name)

  constructor(
    @injectQueryBuilder()
    private readonly qb: IQueryBuilder,
    @injectSqlite()
    private readonly sqlite: Database,
  ) {}

  async create(table: TableDo) {
    const t = new UnderlyingTable(table)
    const queies: string[] = []
    const sql: CompiledQuery[] = []
    await this.qb.schema
      .createTable(t.name)
      .$call((tb) => {
        const visitor = new UnderlyingTableFieldVisitor(this.qb, t, tb)
        for (const field of table.schema) {
          field.accept(visitor)
        }
        queies.push(...visitor.rawSQL)
        sql.push(...visitor.sql)
        return visitor.tb
      })
      .execute()

    for (const query of queies) {
      this.sqlite.query(query).run()
      this.logger.debug({ query })
    }

    await all(sql.map((query) => this.qb.executeQuery(query)))
  }

  async update(table: TableDo, spec: TableComositeSpecification) {
    const t = new UnderlyingTable(table)

    const visitor = new UnderlyingTableSpecVisitor(t, this.qb)
    spec.accept(visitor)

    await visitor.execute()
  }
}
