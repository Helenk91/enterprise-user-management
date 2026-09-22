/**
 * 轻量 Toast 提示系统
 * 用法：
 *   import { toast } from '../utils/toast'
 *   toast.success('操作成功')
 *   toast.error('出错了')
 *   toast.info('提示信息')
 */
import { reactive } from 'vue'

const state = reactive({
  items: [],
  nextId: 1,
})

let seed = 1
function push(type, message, duration = 2600) {
  const id = seed++
  state.items.push({ id, type, message })
  setTimeout(() => {
    const idx = state.items.findIndex((i) => i.id === id)
    if (idx > -1) state.items.splice(idx, 1)
  }, duration)
}

export const toast = {
  success: (msg) => push('success', msg),
  error: (msg) => push('error', msg),
  info: (msg) => push('info', msg),
}

export { state }
