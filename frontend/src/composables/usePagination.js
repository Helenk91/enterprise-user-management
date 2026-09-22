/**
 * 组合式函数：分页
 * 统一管理页码 / 页大小 / 总条数 / 跳页逻辑
 */
import { ref, computed } from 'vue'

export function usePagination(initial = { page: 1, pageSize: 10 }) {
  const page = ref(initial.page || 1)
  const pageSize = ref(initial.pageSize || 10)
  const total = ref(0)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const hasPrev = computed(() => page.value > 1)
  const hasNext = computed(() => page.value < totalPages.value)

  function setTotal(n) {
    total.value = Number(n) || 0
  }

  function go(p) {
    page.value = Math.min(Math.max(1, p), totalPages.value)
  }

  function reset() {
    page.value = 1
  }

  function pages() {
    const arr = []
    const t = totalPages.value
    const cur = page.value
    const push = (n) => arr.push(n)
    if (t <= 7) {
      for (let i = 1; i <= t; i++) push(i)
    } else {
      push(1)
      if (cur > 3) push('...')
      const start = Math.max(2, cur - 1)
      const end = Math.min(t - 1, cur + 1)
      for (let i = start; i <= end; i++) push(i)
      if (cur < t - 2) push('...')
      push(t)
    }
    return arr
  }

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasPrev,
    hasNext,
    setTotal,
    go,
    reset,
    pages,
  }
}
