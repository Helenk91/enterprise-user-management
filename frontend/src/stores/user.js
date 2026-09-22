/**
 * Pinia 用户状态
 * 管理登录态、用户信息、登出（登出调用后端黑名单）
 */
import { defineStore } from 'pinia'
import { login as apiLogin, getMe, logout as apiLogout } from '../api/auth'
import storage from '../utils/storage'

const USER_KEY = 'userdb_user'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: storage.get('userdb_token') || '',
    user: storage.get(USER_KEY) || null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    displayName: (state) => state.user?.name || '未登录',
  },

  actions: {
    /**
     * 登录：保存 token 与用户信息
     */
    async login(payload) {
      const res = await apiLogin(payload)
      this.token = res.data.token
      this.user = res.data.user
      storage.set('userdb_token', res.data.token, 24 * 60 * 60 * 1000)
      storage.set(USER_KEY, res.data.user, 24 * 60 * 60 * 1000)
      return res.data.user
    },

    /**
     * 拉取当前用户信息（刷新页面后恢复登录态）
     */
    async fetchMe() {
      if (!this.token) return null
      try {
        const res = await getMe()
        this.user = res.data
        storage.set(USER_KEY, res.data, 24 * 60 * 60 * 1000)
        return res.data
      } catch (err) {
        this.logout()
        throw err
      }
    },

    /**
     * 登出：调用后端使 token 加入黑名单
     */
    async logout() {
      if (this.token) {
        try {
          await apiLogout()
        } catch {
          // 网络异常也继续本地登出
        }
      }
      this.clearLocal()
    },

    /**
     * 仅清本地状态
     */
    clearLocal() {
      this.token = ''
      this.user = null
      storage.remove('userdb_token')
      storage.remove(USER_KEY)
    },
  },
})
