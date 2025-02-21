<script lang="ts">
  import { TemplateFactory, type ITemplateDTO } from "@undb/template"
  import { writable } from "svelte/store"
  import { derived } from "svelte/store"
  import { setTable } from "$lib/store/table.store"
  import TemplateGridView from "$lib/components/blocks/template/template-grid-view.svelte"
  import KanbanView from "$lib/components/blocks/kanban-view/kanban-view.svelte"
  import { cn } from "$lib/utils"
  import { HardDriveIcon, DatabaseIcon, ViewIcon, ChevronRightIcon } from "lucide-svelte"
  import * as Collapsible from "$lib/components/ui/collapsible"
  import { setTemplate } from "$lib/store/template.store"
  import RecordDetailSheet from "$lib/components/blocks/record-detail/record-detail-sheet.svelte"
  import GalleryView from "$lib/components/blocks/gallery-view/gallery-view.svelte"
  import CalendarView from "$lib/components/blocks/calendar-view/calendar-view.svelte"
  import ListView from "$lib/components/blocks/list-view/list-view.svelte"

  export let template: ITemplateDTO

  setTemplate(writable(template))

  let t = TemplateFactory.create(template.template.template, [], "preview")
  let tables = t.flatMap((base) => base.tables.map(({ table }) => table))
  let bases = t.map((base) => base.base)

  let currentBaseId = writable<string | undefined>(bases.at(0)?.id.value)
  let currentBase = derived(currentBaseId, ($currentBaseId) => {
    return bases.find((base) => base.id.value === $currentBaseId)
  })
  let currentTableId = writable<string | undefined>(tables.at(0)?.id.value)
  let currentViewId = writable<string | undefined>(undefined)
  let currentTable = derived(currentTableId, ($currentTableId) => {
    return tables.find((table) => table.id.value === $currentTableId)
  })
  let records = derived(currentTableId, ($currentTableId) => {
    return t.flatMap((base) => base.tables.find((t) => t.table.id.value === $currentTableId)?.records ?? [])
  })

  let currentView = derived([currentTable, currentViewId], ([$currentTable, $currentViewId]) => {
    return $currentTable?.views.getViewById($currentViewId)
  })

  let r = writable<string | null>(null)
  let recordDo = derived([records, r], ([$records, $r]) => {
    return $records.find((record) => record.id.value === $r)
  })

  $: if ($currentTable) {
    setTable(writable($currentTable))
  }

  let open: Record<string, boolean> =
    tables.length > 0
      ? {
          [tables.at(0)!.baseId]: true,
          [tables.at(0)!.id.value]: true,
        }
      : {}
</script>

{#if template.template.type === "base"}
  <div class="flex h-full overflow-auto">
    <div class="f-full w-[350px] border-r px-4 py-2">
      <nav class="items-start gap-1 px-1.5 text-sm font-medium">
        {#if bases?.length}
          <ul>
            {#each bases as base}
              {#if base}
                {@const active = base.id.value === $currentTable?.baseId && !$currentTableId && !$currentViewId}
                {@const baseTables = tables.filter((t) => t?.baseId === base.id.value)}
                <Collapsible.Root bind:open={open[base.id.value]}>
                  <div
                    class={cn(
                      "group flex h-8 items-center justify-between gap-1 overflow-hidden pl-4 pr-2 transition-all",
                      active ? "text-background rounded-md bg-gray-800/90" : "hover:bg-gray-100",
                    )}
                  >
                    <button
                      class={cn(
                        "flex h-full flex-1 items-center overflow-hidden font-normal text-gray-600",
                        active && "text-background font-medium",
                      )}
                    >
                      <HardDriveIcon class="mr-2 h-4 w-4" />
                      <span class="truncate">
                        {base.name.value}
                      </span>
                    </button>

                    <div
                      class={cn(
                        "item-center text-muted-foreground flex justify-center gap-2 opacity-0 transition-all group-hover:opacity-100",
                        active && "text-background",
                      )}
                    >
                      <Collapsible.Trigger class="h-full">
                        <ChevronRightIcon
                          class={cn(
                            "text-muted-foreground h-4 w-4 transition-all",
                            open[base.id.value] && "rotate-90",
                            active && "text-background",
                          )}
                        />
                      </Collapsible.Trigger>
                    </div>
                  </div>
                  <Collapsible.Content class="space-y-1 pt-1">
                    {#each baseTables as table}
                      {#if table}
                        {@const active = table.id.value === $currentTableId && !$currentViewId}
                        {@const views = table.views.views.filter((view) => !view.isDefault)}
                        <Collapsible.Root bind:open={open[table.id.value]}>
                          <div
                            class={cn(
                              "group flex h-8 cursor-pointer items-center justify-between gap-1 truncate rounded-md pl-8 pr-2 transition-all",
                              active ? "bg-gray-800/90" : "hover:bg-gray-100",
                            )}
                          >
                            <button
                              on:click={() => {
                                $currentTableId = table.id.value
                                $currentViewId = undefined
                              }}
                              title={table.name.value}
                              class={cn(
                                "flex h-full flex-1 items-center overflow-hidden font-normal text-gray-600",
                                active && "text-background font-medium",
                              )}
                            >
                              <DatabaseIcon class="mr-2 h-4 w-4" />
                              <span class="truncate">
                                {table.name.value}
                              </span>
                            </button>
                            <div class="flex items-center gap-2 opacity-0 transition-all group-hover:opacity-100">
                              {#if views.length > 0}
                                <Collapsible.Trigger
                                  on:click={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    open[table.id.value] = !open[table.id.value]
                                  }}
                                  class={cn(
                                    "flex h-5 w-5 items-center justify-center rounded-md hover:bg-gray-200",
                                    active && "hover:bg-primary",
                                  )}
                                >
                                  <ChevronRightIcon
                                    class={cn(
                                      "text-muted-foreground h-4 w-4 transition-all",
                                      open[table.id.value] && "rotate-90",
                                      active && "text-background",
                                    )}
                                  />
                                </Collapsible.Trigger>
                              {/if}
                            </div>
                          </div>
                          <Collapsible.Content>
                            {#each views as view}
                              {@const active = view.id.value === $currentViewId}
                              <div
                                class={cn(
                                  "group flex h-8 items-center justify-between gap-1 rounded-sm pl-14 pr-2 transition-all",
                                  active ? "bg-gray-800/90" : "hover:bg-gray-100",
                                )}
                              >
                                <button
                                  class={cn(
                                    "flex h-full flex-1 items-center text-xs font-normal",
                                    active && "text-background font-medium",
                                  )}
                                  on:click={() => {
                                    $currentTableId = table.id.value
                                    $currentViewId = view.id.value
                                  }}
                                >
                                  <ViewIcon type={view.type} class="mr-2 h-4 w-4" />
                                  {view.name.value}
                                </button>
                              </div>
                            {/each}
                          </Collapsible.Content>
                        </Collapsible.Root>
                      {/if}
                    {/each}
                  </Collapsible.Content>
                </Collapsible.Root>
              {/if}
            {/each}
          </ul>
        {/if}
      </nav>
    </div>
    {#key $currentTableId}
      {#if $currentTable}
        <section class="flex h-full flex-1 flex-col overflow-auto">
          {#if $currentView?.type === "grid"}
            <TemplateGridView viewId={currentViewId} records={$records} {r} />
          {:else if $currentView?.type === "kanban"}
            <KanbanView viewId={currentViewId} records={$records} {r} disableRecordQuery readonly />
          {:else if $currentView?.type === "gallery"}
            <GalleryView viewId={currentViewId} records={$records} {r} readonly disableRecordQuery />
          {:else if $currentView?.type === "calendar"}
            <CalendarView viewId={currentViewId} records={$records} {r} readonly disableRecordQuery />
          {:else if $currentView?.type === "list"}
            <ListView viewId={currentViewId} records={$records} {r} readonly disableRecordQuery />
          {/if}
        </section>
      {/if}
    {/key}
  </div>
{/if}

<RecordDetailSheet viewId={currentViewId} readonly recordDo={$recordDo} isLoading={false} {r} />
