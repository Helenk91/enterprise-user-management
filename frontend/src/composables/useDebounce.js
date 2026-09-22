/**
 * 组合式函数：防抖
 * 用于搜索输入等高频触发场景
 */
import { ref, watch, onBeforeUnmount } from 'vue'

export function useDebounce(value, delay = 300) {
  const debounced = ref(value)
  let timer = null

  watch(value, (v) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = v
    }, delay)
  })

  onBeforeUnmount(() => clearTimeout(timer))

  return debounced
}

export function debounceFn(fn, delay = 300) {
  let timer = null
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}
