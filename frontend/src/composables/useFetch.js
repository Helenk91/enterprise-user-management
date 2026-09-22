/**
 * 组合式函数：通用数据加载
 * 统一 loading / error / 重试逻辑
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useFetch(fetcher, options = {}) {
  const { immediate = true, autoRefresh = 0 } = options
  const data = ref(null)
  const loading = ref(false)
  const error = ref('')
  let timer = null

  async function run(...args) {
    loading.value = true
    error.value = ''
    try {
      data.value = await fetcher(...args)
      return data.value
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  function startAuto() {
    if (autoRefresh > 0) {
      timer = setInterval(() => run().catch(() => {}), autoRefresh)
    }
  }

  function stopAuto() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onMounted(() => {
    if (immediate) run().catch(() => {})
    startAuto()
  })

  onBeforeUnmount(stopAuto)

  return { data, loading, error, run, stopAuto }
}
