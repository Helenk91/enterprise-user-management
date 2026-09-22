<script setup>
/**
 * 通用数据表格组件
 * 支持：列配置、排序、空态、加载态、行点击、插槽扩展
 * 用法：
 *   <DataTable :columns="[{key:'name',label:'姓名',sortable:true}]" :rows="list" :loading="loading" :total="total" @sort="onSort">
 *     <template #actions="{ row }">...</template>
 *   </DataTable>
 */
import { ref, computed } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  emptyText: { type: String, default: '暂无数据' },
  rowKey: { type: String, default: 'id' },
  striped: { type: Boolean, default: true },
  dense: { type: Boolean, default: false },
})

const emit = defineEmits(['sort', 'row-click'])

const sortState = ref({ key: '', order: '' })

function toggleSort(col) {
  if (!col.sortable) return
  if (sortState.value.key !== col.key) {
    sortState.value = { key: col.key, order: 'asc' }
  } else if (sortState.value.order === 'asc') {
    sortState.value = { key: col.key, order: 'desc' }
  } else {
    sortState.value = { key: '', order: '' }
  }
  emit('sort', { ...sortState.value })
}

const sortedRows = computed(() => {
  const { key, order } = sortState.value
  if (!key || !order) return props.rows
  return [...props.rows].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    const na = Number(va)
    const nb = Number(vb)
    if (!isNaN(na) && !isNaN(nb)) {
      return order === 'asc' ? na - nb : nb - na
    }
    return order === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
  })
})

const sortIcon = (col) => {
  if (sortState.value.key !== col.key) return '↕'
  return sortState.value.order === 'asc' ? '↑' : '↓'
}
</script>

<template>
  <div class="dt-wrap" :class="{ dense }">
    <div v-if="loading" class="dt-loading">
      <span class="spinner" />
      数据加载中…
    </div>

    <table v-else class="dt-table" :class="{ striped }">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="{ sortable: col.sortable, [col.align || 'left']: true }"
            :style="col.width ? { width: col.width } : {}"
            @click="toggleSort(col)"
          >
            <span class="th-inner">
              {{ col.label }}
              <span v-if="col.sortable" class="sort-ic">{{ sortIcon(col) }}</span>
            </span>
          </th>
          <th v-if="$slots.actions" class="right">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in sortedRows" :key="row[rowKey]" @click="$emit('row-click', row)">
          <td
            v-for="col in columns"
            :key="col.key"
            :class="[col.align || 'left', { 'cell-num': col.numeric }]"
          >
            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
              {{ col.formatter ? col.formatter(row[col.key], row) : row[col.key] }}
            </slot>
          </td>
          <td v-if="$slots.actions" class="right">
            <slot name="actions" :row="row" />
          </td>
        </tr>
        <tr v-if="!sortedRows.length">
          <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="dt-empty">{{ emptyText }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="total > 0" class="dt-count">
      共 <b class="num">{{ total }}</b> 条记录
    </div>
  </div>
</template>

<style scoped>
.dt-wrap {
  position: relative;
  width: 100%;
}
.dt-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  padding: 48px 0;
  color: var(--text-muted);
  font-size: 13px;
}
.dt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
.dt-table th {
  text-align: left;
  padding: 12px 14px;
  background: #f4f7fc;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  border-bottom: 1px solid var(--border-subtle);
  white-space: nowrap;
}
.dt-table th.sortable {
  cursor: pointer;
  user-select: none;
}
.dt-table th.sortable:hover {
  color: var(--primary);
}
.sort-ic {
  font-size: 11px;
  margin-left: 4px;
  opacity: 0.7;
}
.dt-table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  vertical-align: middle;
}
.dt-table.striped tbody tr:nth-child(even) {
  background: #fafcff;
}
.dt-table tbody tr {
  transition: background 0.12s;
}
.dt-table tbody tr:hover {
  background: var(--bg-hover);
}
.cell-num {
  font-variant-numeric: tabular-nums;
}
.right {
  text-align: right;
}
.center {
  text-align: center;
}
.dt-empty {
  text-align: center;
  color: var(--text-muted);
  padding: 44px 0;
  font-size: 13px;
}
.dt-count {
  padding: 12px 4px 2px;
  font-size: 12.5px;
  color: var(--text-muted);
  border-top: 1px solid #eef2f9;
}
.dense td {
  padding: 8px 12px;
}
</style>
