/**
 * 认证 API
 */
import http from './request'

export const login = (data) => http.post('/auth/login', data)
export const register = (data) => http.post('/auth/register', data)
export const getMe = () => http.get('/auth/me')
export const logout = () => http.post('/auth/logout')
export const changePassword = (data) => http.put('/auth/password', data)
