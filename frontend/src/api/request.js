/**
 * axios 实例封装
 * - 自动注入 JWT token
 * - 统一错误处理
 * - 401 时自动登出并跳转登录页
 */
import axios from 'axios'
import storage from '../utils/storage'

const TOKEN_KEY = 'userdb_token'

export function getToken() {
  return storage.get(TOKEN_KEY)
}

export function setToken(token) {
  storage.set(TOKEN_KEY, token, 7 * 24 * 60 * 60 * 1000) // 7 天
}

export function clearToken() {
  storage.remove(TOKEN_KEY)
}

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// 请求拦截：注入 token
http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：统一错误提示 + 401 处理
http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status
    const serverMessage = err.response?.data?.message

    if (status === 401) {
      clearToken()
      // 避免在登录页反复跳转
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
      return Promise.reject(new Error('登录已过期，请重新登录'))
    }

    const message = serverMessage || err.message || '网络请求失败，请稍后重试'
    return Promise.reject(new Error(message))
  }
)

export default http
