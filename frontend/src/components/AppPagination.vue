<script setup>
/**
 * 通用分页组件（暗色）
 */
import { computed } from 'vue'

const props = defineProps({
  total: { type: Number, required: true },
  page: { type: Number, required: true },
  pageSize: { type: Number, default: 10 },
})

const emit = defineEmits(['change'])

const totalPages = computed(() => Math.max(Math.ceil(props.total / props.pageSize), 1))

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, props.page - 2)
  const end = Math.min(totalPages.value, props.page + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function go(p) {
  if (p < 1 || p > totalPages.value || p === props.page) return
  emit('change', p)
}
</script>

<template>
  <div class="pagination">
    <span class="page-info">
      共 <b class="num">{{ total }}</b> 条 · 第 <b class="num">{{ page }}/{{ totalPages }}</b> 页
    </span>
    <div class="page-btns">
      <button class="btn btn-small" :disabled="page <= 1" @click="go(page - 1)">‹ 上一页</button>
      <template v-for="p in visiblePages" :key="p">
        <button class="btn btn-small num" :class="{ 'btn-active': p === page }" @click="go(p)">
          {{ p }}
        </button>
      </template>
      <button class="btn btn-small" :disabled="page >= totalPages" @click="go(page + 1)">下一页 ›</button>
    </div>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(94, 130, 204, 0.1);
  flex-wrap: wrap;
  gap: 10px;
}
.page-info {
  font-size: 13px;
  color: var(--text-secondary);
}
.page-info b {
  color: var(--text-primary);
  font-weight: 600;
}
.page-btns {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.btn-active {
  background: var(--gradient-main);
  border-color: transparent;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
}
.btn-active:hover {
  background: var(--gradient-main);
  filter: brightness(1.1);
}
</style>
