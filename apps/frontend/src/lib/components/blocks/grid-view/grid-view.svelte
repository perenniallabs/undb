<script lang="ts">
  import { derived, writable, type Readable, type Writable } from "svelte/store"
  import { createRecordsStore, setRecordsStore, type RecordsStore } from "$lib/store/records.store"
  import { Records, type IRecordsDTO, type IViewFilterGroup } from "@undb/table"
  import { createQuery } from "@tanstack/svelte-query"
  import { trpc } from "$lib/trpc/client"
  import { getTable } from "$lib/store/table.store"
  import { queryParam, ssp } from "sveltekit-search-params"
  import GridViewDataTable from "./grid-view-data-table.svelte"
  import { preferences } from "$lib/store/persisted.store"
  import { aggregatesStore } from "$lib/store/aggregates.store"

  export let readonly = false

  const t = getTable()
  export let viewId: Readable<string>
  export let r: Writable<string | null>
  export let shareId: string | undefined = undefined

  const q = queryParam("q")
  export let filter: IViewFilterGroup | undefined = undefined

  const perPage = derived(preferences, ($preferences) => $preferences.gridViewPerPage ?? 50)
  const currentPage = queryParam("page", ssp.number())

  const getRecords = createQuery(
    derived([t, viewId, perPage, currentPage, q], ([$table, $viewId, $perPage, $currentPage, $q]) => {
      const view = $table.views.getViewById($viewId)
      return {
        queryKey: ["records", $table?.id.value, $viewId, $q, $currentPage, $perPage],
        enabled: view?.type === "grid",
        queryFn: () =>
          trpc.record.list.query({
            tableId: $table?.id.value,
            viewId: $viewId,
            q: $q ?? undefined,
            filters: filter,
            pagination: { limit: $perPage, page: $currentPage || 1 },
          }),
      }
    }),
  )

  // TODO: record type
  $: records = (($getRecords.data as any)?.records as IRecordsDTO) ?? []

  const store = createRecordsStore()
  setRecordsStore(store)

  $: if ($getRecords.isSuccess) {
    store.setRecords(Records.fromJSON($t, records), $getRecords.dataUpdatedAt)
  }

  const getAggregates = createQuery(
    derived([t], ([$table]) => {
      if (shareId) {
        return {
          queryKey: ["aggregates", $table?.id.value, $viewId],
          queryFn: () => trpc.shareData.aggregate.query({ shareId, tableId: $table.id.value, viewId: $viewId }),
          enabled: !!$table,
        }
      }
      return {
        queryKey: ["aggregates", $table?.id.value, $viewId],
        queryFn: () => trpc.record.aggregate.query({ tableId: $table.id.value, viewId: $viewId }),
        enabled: !!$table,
      }
    }),
  )

  $: if ($getAggregates.data && $t) {
    aggregatesStore.updateTableAggregates($viewId ?? $t.views.getDefaultView()?.id.value, $getAggregates.data)
  }
</script>

<GridViewDataTable
  {viewId}
  {readonly}
  {perPage}
  {currentPage}
  {r}
  isLoading={$getRecords.isLoading}
  total={$getRecords.data?.total ?? 0}
/>

{#await import("$lib/components/blocks/create-record/create-record-sheet.svelte") then { default: CreateRecordSheet }}
  <CreateRecordSheet />
{/await}

{#await import("$lib/components/blocks/record-detail/table-record-detail-sheet.svelte") then { default: TableRecordDetailSheet }}
  <TableRecordDetailSheet />
{/await}

{#await import("$lib/components/blocks/view-widget/view-widget-sheet.svelte") then { default: ViewWidgetSheet }}
  <ViewWidgetSheet {viewId} />
{/await}
