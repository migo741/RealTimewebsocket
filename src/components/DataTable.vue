<template>
  <div class="data-table">
    <table :aria-busy="loading || undefined">
      <colgroup>
        <col v-if="selectionEnabled" class="data-table__check-col" />
        <col v-for="column in columns" :key="column.key" :style="columnWidth(column)" />
      </colgroup>
      <thead>
        <tr>
          <th v-if="selectionEnabled" class="data-table__check" scope="col">
            <input
              ref="selectAllRef"
              type="checkbox"
              :checked="pageSelection.all"
              :disabled="Boolean(loading) || data.length === 0"
              aria-label="全选当前数据"
              @change="onTogglePage"
            />
          </th>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            :aria-sort="ariaSort(column)"
            :style="columnAlign(column)"
          >
            <button
              v-if="column.sortable"
              type="button"
              class="data-table__sort"
              @click="toggleSort(column)"
            >
              <span>{{ column.title }}</span>
              <span
                class="data-table__sort-mark"
                :data-order="sortMark(column)"
                aria-hidden="true"
              />
            </button>
            <template v-else>{{ column.title }}</template>
          </th>
        </tr>
      </thead>
      <tbody v-if="loading">
        <tr>
          <td class="data-table__state" :colspan="colSpan">
            <slot name="loading">加载中</slot>
          </td>
        </tr>
      </tbody>
      <tbody v-else-if="data.length === 0">
        <tr>
          <td class="data-table__state" :colspan="colSpan">
            <slot name="empty">暂无数据</slot>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr v-for="row in data" :key="resolveRowKey(row)" :class="rowClass(row)">
          <td v-if="selectionEnabled" class="data-table__check">
            <input
              type="checkbox"
              :checked="isSelected(resolveRowKey(row))"
              :aria-label="`选择 ${resolveRowKey(row)}`"
              @change="onToggleRow(row, $event)"
            />
          </td>
          <td v-for="column in columns" :key="column.key" :style="columnAlign(column)">
            <slot
              v-if="hasCellSlot(column.key)"
              :name="cellSlotName(column.key)"
              :row="row"
              :value="cellSlotValue(row, column)"
              :column="column"
            />
            <CellContent v-else-if="column.render" :column="column" :row="row" />
            <template v-else>{{ formatCell(readValue(row, column.key)) }}</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import type { VNode, VNodeChild } from 'vue'

export type SortOrder = 'asc' | 'desc'

export type SortState<K extends string = string> = {
  key: K
  order: SortOrder
}

export type RowKeyValue = string | number

export type RowKeyField<T> = {
  [K in keyof T]-?: T[K] extends RowKeyValue ? Extract<K, string> : never
}[keyof T]

export type RowKey<T> = RowKeyField<T> | ((row: T) => RowKeyValue)

export type ColumnKey<T, ExtraKey extends string = never> = Extract<keyof T, string> | ExtraKey

type ColumnAlign = 'left' | 'center' | 'right'

export interface CellScope<T extends object, K extends string, ExtraKey extends string = never> {
  row: T
  value: K extends keyof T ? T[K] : undefined
  column: Column<T, ExtraKey>
}

export type Column<T extends object, ExtraKey extends string = never> = {
  [K in ColumnKey<T, ExtraKey>]: {
    key: K
    title: string
    sortable?: boolean
    width?: string | number
    align?: ColumnAlign
    render?: (scope: CellScope<T, K, ExtraKey>) => VNodeChild
  }
}[ColumnKey<T, ExtraKey>]

export type DataTableProps<
  T extends object,
  ExtraKey extends string = never,
  Key extends RowKeyValue = RowKeyValue,
> = {
  data: readonly T[]
  columns: readonly Column<T, ExtraKey>[]
  rowKey: RowKey<T>
  loading?: boolean
  selectedKeys?: readonly Key[]
  sort?: SortState<ColumnKey<T, ExtraKey>> | null
}

export type DataTableEmits<
  T extends object,
  ExtraKey extends string = never,
  Key extends RowKeyValue = RowKeyValue,
> = {
  'update:selectedKeys': [keys: Key[]]
  'update:sort': [sort: SortState<ColumnKey<T, ExtraKey>> | null]
  'sort-change': [sort: SortState<ColumnKey<T, ExtraKey>> | null]
}

export type DataTableSlots<T extends object, ExtraKey extends string = never> = {
  loading?: () => VNode[]
  empty?: () => VNode[]
} & {
  [K in ColumnKey<T, ExtraKey> as `cell-${K}`]?: (props: CellScope<T, K, ExtraKey>) => VNode[]
}
</script>

<script
  setup
  lang="ts"
  generic="
    T extends object,
    ExtraKey extends string = never,
    Key extends string | number = string | number
  "
>
import { computed, defineComponent, ref, useSlots, watchEffect } from 'vue'

const props = defineProps<DataTableProps<T, ExtraKey, Key>>()

const emit = defineEmits<DataTableEmits<T, ExtraKey, Key>>()

defineSlots<DataTableSlots<T, ExtraKey>>()

defineOptions({
  name: 'DataTable',
})

const slots = useSlots()
const selectAllRef = ref<HTMLInputElement | null>(null)

// 未传入 sort 时，表格只记住排序指示器；传入 sort（包括 null）后改由父组件控制。
// 这里不排序 data，父组件自行决定本地排序或重新请求。
const internalSort = ref<SortState<ColumnKey<T, ExtraKey>> | null>(null)

const sortControlled = computed(() => props.sort !== undefined)

const activeSort = computed(() =>
  sortControlled.value ? (props.sort ?? null) : internalSort.value,
)

const selectionEnabled = computed(() => props.selectedKeys !== undefined)

const colSpan = computed(() => {
  const count = props.columns.length + (selectionEnabled.value ? 1 : 0)
  return count > 0 ? count : 1
})

const pageSelection = computed(() => {
  const selected = new Set<RowKeyValue>(props.selectedKeys ?? [])
  let selectedCount = 0
  for (const row of props.data) {
    if (selected.has(resolveRowKey(row))) selectedCount += 1
  }
  const total = props.data.length
  return {
    all: total > 0 && selectedCount === total,
    indeterminate: selectedCount > 0 && selectedCount < total,
  }
})

watchEffect(() => {
  const input = selectAllRef.value
  if (!input) return
  input.indeterminate = pageSelection.value.indeterminate
})

function resolveRowKey(row: T): RowKeyValue {
  const resolver = props.rowKey
  const value = typeof resolver === 'function' ? resolver(row) : row[resolver]
  if (typeof value === 'string' || typeof value === 'number') return value
  const source = typeof resolver === 'function' ? 'rowKey function' : `rowKey "${String(resolver)}"`
  throw new Error(`DataTable ${source} must resolve to a string or number`)
}

function readValue(row: T, key: string): unknown {
  if (typeof row !== 'object' || row === null) return undefined
  if (!Object.prototype.hasOwnProperty.call(row, key)) return undefined
  return (row as Record<string, unknown>)[key]
}

function formatCell(value: unknown): string {
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'bigint':
    case 'boolean':
      return String(value)
    default:
      return ''
  }
}

function columnWidth(column: Column<T, ExtraKey>) {
  if (column.width == null) return undefined
  return {
    width: typeof column.width === 'number' ? `${column.width}px` : column.width,
  }
}

function columnAlign(column: Column<T, ExtraKey>) {
  return column.align ? { textAlign: column.align } : undefined
}

function cellSlotName(key: ColumnKey<T, ExtraKey>) {
  return `cell-${key}` as `cell-${ColumnKey<T, ExtraKey>}`
}

function hasCellSlot(key: ColumnKey<T, ExtraKey>) {
  return slots[cellSlotName(key)] != null
}

function cellSlotValue(row: T, column: Column<T, ExtraKey>) {
  return readValue(row, column.key) as CellScope<T, ColumnKey<T, ExtraKey>, ExtraKey>['value']
}

function sortMark(column: Column<T, ExtraKey>): SortOrder | 'none' {
  if (!column.sortable || activeSort.value?.key !== column.key) return 'none'
  return activeSort.value.order
}

function ariaSort(column: Column<T, ExtraKey>): 'ascending' | 'descending' | 'none' | undefined {
  if (!column.sortable) return undefined
  const order = sortMark(column)
  if (order === 'asc') return 'ascending'
  if (order === 'desc') return 'descending'
  return 'none'
}

function toggleSort(column: Column<T, ExtraKey>) {
  if (!column.sortable) return

  const current = activeSort.value
  let next: SortState<ColumnKey<T, ExtraKey>> | null
  if (current?.key !== column.key) {
    next = { key: column.key, order: 'asc' }
  } else if (current.order === 'asc') {
    next = { key: column.key, order: 'desc' }
  } else {
    next = null
  }

  if (!sortControlled.value) internalSort.value = next
  emit('update:sort', next)
  emit('sort-change', next)
}

function isSelected(key: RowKeyValue) {
  return (props.selectedKeys ?? []).some((item) => item === key)
}

function rowClass(row: T) {
  if (!selectionEnabled.value || !isSelected(resolveRowKey(row))) return undefined
  return 'is-selected'
}

function emitSelectedKeys(keys: RowKeyValue[]) {
  emit('update:selectedKeys', keys as Key[])
}

// 全选只覆盖当前 data。不在这份 data 里的已选 key 保持不变，分页后清不清由父组件决定。
function togglePage(checked: boolean) {
  const current: RowKeyValue[] = [...(props.selectedKeys ?? [])]
  const pageKeys = props.data.map((row) => resolveRowKey(row))
  if (checked) {
    const seen = new Set(current)
    for (const key of pageKeys) {
      if (!seen.has(key)) {
        seen.add(key)
        current.push(key)
      }
    }
    emitSelectedKeys(current)
    return
  }
  const pageKeySet = new Set(pageKeys)
  emitSelectedKeys(current.filter((key) => !pageKeySet.has(key)))
}

function toggleRow(row: T, checked: boolean) {
  const key = resolveRowKey(row)
  const current: RowKeyValue[] = [...(props.selectedKeys ?? [])]
  if (checked) {
    if (current.includes(key)) return
    current.push(key)
    emitSelectedKeys(current)
    return
  }
  const next = current.filter((item) => item !== key)
  if (next.length === current.length) return
  emitSelectedKeys(next)
}

function readCheckbox(event: Event) {
  return event.target instanceof HTMLInputElement ? event.target : null
}

function onTogglePage(event: Event) {
  const input = readCheckbox(event)
  if (!input) return
  const checked = input.checked
  input.checked = pageSelection.value.all
  input.indeterminate = pageSelection.value.indeterminate
  togglePage(checked)
}

function onToggleRow(row: T, event: Event) {
  const input = readCheckbox(event)
  if (!input) return
  const checked = input.checked
  input.checked = isSelected(resolveRowKey(row))
  toggleRow(row, checked)
}

function invokeColumnRender(column: Column<T, ExtraKey>, row: T): VNodeChild {
  const render = column.render
  if (!render) return null
  return (render as (scope: { row: T; value: unknown; column: Column<T, ExtraKey> }) => VNodeChild)(
    {
      row,
      value: readValue(row, column.key),
      column,
    },
  )
}

const CellContent = defineComponent({
  name: 'DataTableCell',
  inheritAttrs: false,
  props: {
    column: {
      type: Object,
      required: true,
    },
    row: {
      type: Object,
      required: true,
    },
  },
  setup(cellProps) {
    return () => invokeColumnRender(cellProps.column as Column<T, ExtraKey>, cellProps.row as T)
  },
})
</script>

<style scoped lang="scss">
.data-table {
  width: 100%;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.5;

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 10px 12px;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
    vertical-align: middle;
  }

  th {
    background: #f9fafb;
    color: #4b5563;
    font-weight: 600;
    white-space: nowrap;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  tbody tr:hover td {
    background: #f9fafb;
  }

  tbody tr.is-selected td {
    background: #eff6ff;
  }

  tbody tr.is-selected:hover td {
    background: #e8f1fe;
  }
}

.data-table__check-col {
  width: 44px;
}

.data-table__check {
  width: 44px;
  text-align: center;

  input {
    accent-color: #2563eb;
  }
}

.data-table__sort {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  user-select: none;

  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
}

.data-table__sort-mark {
  position: relative;
  display: inline-block;
  width: 8px;
  height: 12px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    border-right: 4px solid transparent;
    border-left: 4px solid transparent;
  }

  &::before {
    top: 0;
    border-bottom: 4px solid #9ca3af;
  }

  &::after {
    bottom: 0;
    border-top: 4px solid #9ca3af;
  }

  &[data-order='asc']::before {
    border-bottom-color: #111827;
  }

  &[data-order='asc']::after {
    border-top-color: #d1d5db;
  }

  &[data-order='desc']::before {
    border-bottom-color: #d1d5db;
  }

  &[data-order='desc']::after {
    border-top-color: #111827;
  }
}

.data-table__state {
  padding: 28px 12px;
  color: #6b7280;
  text-align: center;
}
</style>
