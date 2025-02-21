<script lang="ts">
  import { Checkbox } from "$lib/components/ui/checkbox"
  import NumberInput from "$lib/components/ui/input/number-input.svelte"
  import { Label } from "$lib/components/ui/label/index.js"
  import { Separator } from "$lib/components/ui/separator"
  import type { IDateFieldConstraint, INumberFieldConstraint } from "@undb/table"
  import * as Popover from "$lib/components/ui/popover"
  import { Button } from "$lib/components/ui/button"
  import { cn } from "$lib/utils"
  import { CalendarIcon } from "lucide-svelte"
  import { DateFormatter, getLocalTimeZone, parseAbsolute } from "@internationalized/date"
  import { isDate, isString } from "radash"
  import { RangeCalendar } from "$lib/components/ui/range-calendar"

  const df = new DateFormatter("en-US", {
    dateStyle: "long",
  })

  export let constraint: IDateFieldConstraint | undefined
  export let display: boolean | undefined
  export let defaultValue: [string | Date | null | undefined, string | Date | null | undefined] | undefined = undefined
  export let placeholder: string | undefined = "Default value..."
  export let disabled: boolean | undefined

  function parse(value: string) {
    try {
      return parseAbsolute(value, getLocalTimeZone())
    } catch {
      return undefined
    }
  }

  function getCalendarDate(value: string | Date | null | undefined) {
    return isString(value) ? parse(value) : isDate(value) ? parse(value.toISOString()) : undefined
  }

  $: internalValue = {
    start: getCalendarDate(defaultValue?.[0]),
    end: getCalendarDate(defaultValue?.[1]),
  }
  let open = false
</script>

<div class="space-y-2">
  <div class="space-y-1">
    <Label for="defaultValue" class="text-xs font-normal">Default value</Label>
    <Popover.Root portal="body" bind:open openFocus>
      <Popover.Trigger asChild let:builder>
        <Button
          variant="outline"
          {...$$restProps}
          {disabled}
          class={cn(
            "w-full justify-start text-left font-normal",
            !defaultValue && "text-muted-foreground",
            $$restProps.class,
          )}
          builders={[builder]}
        >
          <CalendarIcon class="mr-2 h-4 w-4" />
          {#if internalValue?.start}
            {#if internalValue.end}
              {df.format(internalValue.start.toDate())} - {df.format(internalValue.end.toDate())}
            {:else}
              {df.format(internalValue.start.toDate())}
            {/if}
          {:else}
            <span class="text-muted-foreground text-xs">
              {placeholder}
            </span>
          {/if}
        </Button>
      </Popover.Trigger>
      <Popover.Content class="w-auto p-0" align="start">
        <RangeCalendar
          value={internalValue}
          placeholder={internalValue?.start}
          onValueChange={(v) => {
            const start = v.start?.toDate(getLocalTimeZone())
            const end = v.end?.toDate(getLocalTimeZone())

            const startDate = start ? start.toISOString() : undefined
            const endDate = end ? end.toISOString() : undefined

            defaultValue = [startDate, endDate]
            open = false
          }}
          initialFocus
          numberOfMonths={2}
        />
      </Popover.Content>
    </Popover.Root>
  </div>
  {#if constraint}
    <div class="pt-2">
      <Separator />
    </div>
    <div class="flex items-center space-x-2">
      <Checkbox id="required" bind:checked={constraint.required} />
      <Label for="required" class="text-xs font-normal">Mark as required field.</Label>
    </div>
  {/if}
</div>
