<script lang="ts">
  import { getTable } from "$lib/store/table.store"
  import type { Readable } from "svelte/store"
  import GridView from "../grid-view/grid-view.svelte"
  import KanbanView from "../kanban-view/kanban-view.svelte"
  import GalleryView from "../gallery-view/gallery-view.svelte"
  import ListView from "../list-view/list-view.svelte"
  import { r } from "$lib/store/records.store"
  import CalendarView from "../calendar-view/calendar-view.svelte"

  const table = getTable()
  export let viewId: Readable<string>

  $: view = $table.views.getViewById($viewId)
</script>

{#key $viewId}
  {#if view}
    {#if view.type === "kanban"}
      <KanbanView {viewId} {r} />
    {:else if view.type === "grid"}
      <GridView {viewId} {r} />
    {:else if view.type === "gallery"}
      <GalleryView {viewId} {r} />
    {:else if view.type === "list"}
      <ListView {viewId} {r} />
    {:else if view.type === "calendar"}
      <CalendarView {viewId} {r} />
    {/if}
  {/if}
{/key}
