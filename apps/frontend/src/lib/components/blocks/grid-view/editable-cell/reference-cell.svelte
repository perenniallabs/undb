<script lang="ts">
  import type { ReferenceField } from "@undb/table"
  import ForeignRecordsPickerDropdown from "../../reference/foreign-records-picker-dropdown.svelte"
  import { Button } from "$lib/components/ui/button"
  import { writable, type Readable, type Writable } from "svelte/store"
  import { getRecordsStore } from "$lib/store/records.store"
  import { getTable } from "$lib/store/table.store"
  import { cn } from "$lib/utils"

  const table = getTable()

  export let tableId: string
  export let field: ReferenceField
  export let value: string[] = []
  export let displayValue: string[]
  export let viewId: Readable<string | undefined>
  export let isEditing: boolean
  export let isSelected: boolean
  export let recordId: string
  export let onValueChange = (value: string[]) => {}
  export let r: Writable<string | null>

  $: selected = writable<string[]>(value)

  let hasValue = Array.isArray(value) && value.length > 0

  $: selected, (hasValue = Array.isArray(value) && value.length > 0)

  $: hasValueReactive = Array.isArray($selected) && $selected.length > 0
  $: if (hasValue && !hasValueReactive) {
    hasValue = hasValueReactive
  }

  const recordStore = getRecordsStore()

  function onSuccess(id?: string) {
    if (id) {
      recordStore.invalidateRecord($table, id, $viewId)
    }
  }
</script>

<div class={cn("overflow-hidden", $$restProps.class)}>
  <div class="flex w-full items-center justify-between gap-1">
    <div class="flex flex-1 items-center gap-1 truncate">
      <ForeignRecordsPickerDropdown
        shouldUpdate
        onOpenChange={(open) => {
          if (!open) {
            hasValue = hasValueReactive
          }
        }}
        {onValueChange}
        {field}
        {tableId}
        {recordId}
        {r}
        bind:isSelected={hasValue}
        bind:selected
        let:builder
        {onSuccess}
      >
        {#if hasValueReactive}
          <Button size="xs" variant="link" class="px-0" builders={[builder]}>
            {$selected.length} Linked Records
          </Button>
        {:else}
          <Button size="xs" variant="link" type="button" class="text-muted-foreground px-0" builders={[builder]}
            >+ Link Records</Button
          >
        {/if}
      </ForeignRecordsPickerDropdown>
    </div>

    {#if (isSelected || isEditing) && hasValueReactive}
      <ForeignRecordsPickerDropdown
        {onValueChange}
        {onSuccess}
        shouldUpdate
        {field}
        {tableId}
        {recordId}
        {r}
        bind:selected
        isSelected={false}
        let:builder
      >
        <Button variant="link" class="px-2" builders={[builder]}>+</Button>
      </ForeignRecordsPickerDropdown>
    {/if}
  </div>
</div>
