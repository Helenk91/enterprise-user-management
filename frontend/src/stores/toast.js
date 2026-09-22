/**
 * 组合式 Toast Store
 * 包装 utils/toast 的响应式状态，供组合式 API 页面使用
 */
import { state, toast } from '../utils/toast'

export function useToast() {
  return toast
}

export { state }
