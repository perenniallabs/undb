<script lang="ts">
  import { RecordDO, type DateField, type DateRangeField } from "@undb/table"
  import { createInfiniteQuery, type CreateInfiniteQueryOptions } from "@tanstack/svelte-query"
  import CalendarViewMonthRecordsFilterPicker from "./calendar-view-month-records-filter-picker.svelte"
  import { derived, type Writable } from "svelte/store"
  import { getTable } from "$lib/store/table.store"
  import { type Readable } from "svelte/store"
  import { trpc } from "$lib/trpc/client"
  import { monthStore } from "$lib/store/calendar.store"
  import { type IRecordsDTO, type IViewFilterGroup, Records } from "@undb/table"
  import { format } from "date-fns"
  import { match } from "ts-pattern"
  import { Input } from "$lib/components/ui/input"
  import { SearchIcon } from "lucide-svelte"
  import { writable } from "svelte/store"
  import CalendarViewMonthRecord from "./calendar-view-month-record.svelte"
  import { createVirtualizer } from "@tanstack/svelte-virtual"
  import { inview } from "svelte-inview"
  import { LoaderCircleIcon } from "lucide-svelte"

  export let viewId: Readable<string | undefined>
  export let field: DateField | DateRangeField
  export let r: Writable<string | null>
  export let shareId: string | undefined
  export let readonly = false

  const t = getTable()

  let defaultField = $t.schema.getDefaultDisplayField().into(undefined)

  const startTimestamp = monthStore.startTimestamp
  const endTimestamp = monthStore.endTimestamp
  const scope = $monthStore.scope

  const search = writable("")

  const getRecords = createInfiniteQuery(
    derived(
      [t, viewId, monthStore, startTimestamp, endTimestamp, search],
      ([$table, $viewId, $monthStore, $startTimestamp, $endTimestamp, $search]) => {
        const date = $monthStore.selectedDate

        const filters = match($scope)
          .returnType<IViewFilterGroup | undefined>()
          .with("selectedDate", () => {
            if (!date) return undefined
            const value = format(date, "yyyy-MM-dd")
            return {
              conjunction: "and",
              children: [{ field: field.id.value, op: "is_same_day", value }],
            }
          })
          .with("thisMonth", () => {
            if (!$startTimestamp || !$endTimestamp) return undefined
            return {
              conjunction: "and",
              children: [
                { field: field.id.value, op: "is_after", value: $startTimestamp!.toISOString() },
                { field: field.id.value, op: "is_before", value: $endTimestamp!.toISOString() },
              ],
            }
          })
          .with("withoutDate", () => {
            return {
              conjunction: "and",
              children: [{ field: field.id.value, op: "is_empty" }],
            }
          })
          .otherwise(() => undefined)

        const dateString = match($scope)
          .returnType<string | undefined>()
          .with("selectedDate", () => date?.toISOString())
          .with("thisMonth", () => $startTimestamp?.toISOString())
          .otherwise(() => undefined)
        return {
          queryKey: ["records", $table?.id.value, $viewId, scope, dateString, $search],
          queryFn: ({ pageParam = 1 }) =>
            trpc.record.list.query({
              tableId: $table?.id.value,
              viewId: $viewId,
              filters,
              q: $search,
              pagination: {
                page: pageParam,
                limit: 20,
              },
            }),
          initialPageParam: 1,
          getNextPageParam: (lastPage, pages) => {
            const current = pages.reduce<number>((acc, cur) => acc + cur.records.length, 0)
            if (current >= lastPage.total) {
              return undefined
            }
            return pages.length + 1
          },
        } as CreateInfiniteQueryOptions
      },
    ),
  )

  $: rs = ($getRecords.data?.pages.flatMap((page) => page.records) ?? []) as IRecordsDTO
  $: records = Records.fromJSON($t, rs)

  let virtualListEl: HTMLDivElement

  $: virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: records?.count ?? 0,
    getScrollElement: () => virtualListEl,
    estimateSize: () => 60,
    overscan: 5,
  })
</script>

<div class="flex flex-1 flex-col gap-2 overflow-hidden p-2">
  <div class="flex items-center justify-between gap-1.5 text-sm font-medium">
    <span> Records </span>

    <span class="flex-1">
      <CalendarViewMonthRecordsFilterPicker />
    </span>
  </div>

  <div class="flex items-center justify-between gap-2">
    <SearchIcon class="size-3 text-gray-500" />
    <Input bind:value={$search} class="h-6 flex-1 text-xs" placeholder="Search records..." />
  </div>

  <div class="flex-1 overflow-auto" bind:this={virtualListEl}>
    {#if !records.isEmpty}
      <div style="position: relative; height: {$virtualizer.getTotalSize()}px; width: 100%;">
        {#each $virtualizer.getVirtualItems() as row (row.key)}
          <div
            style="position: absolute; top: 0; left: 0; width: 100%; height: {row.size}px; transform: translateY({row.start}px);"
          >
            <CalendarViewMonthRecord {r} record={records?.records[row.index]} {defaultField} {field} {shareId} {readonly}/>
          </div>
        {/each}
      </div>

      {#if $getRecords.hasNextPage}
        <div
          use:inview={{
            unobserveOnEnter: false,
            rootMargin: "50px",
          }}
          on:inview_change={({ detail }) => {
            if (detail.inView && !$getRecords.isFetching) {
              $getRecords.fetchNextPage()
            }
          }}
          class="h-4"
        >
          {#if $getRecords.isFetching}
            <div class="flex justify-center">
              <LoaderCircleIcon class="h-4 w-4 animate-spin" />
            </div>
          {/if}
        </div>
      {/if}
    {:else if !$getRecords.isPending}
      <div class="flex h-full items-center justify-center">
        <span class="text-muted-foreground text-sm">No Records found</span>
      </div>
    {/if}
  </div>
</div>
