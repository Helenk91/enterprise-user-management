/**
 * 登录历史 / 会话安全 API
 */
import http from './request'

export const getLoginHistory = (params) => http.get('/security/login-history', { params })
export const getSessions = () => http.get('/security/sessions')
export const revokeSession = (id) => http.delete(`/security/sessions/${id}`)
