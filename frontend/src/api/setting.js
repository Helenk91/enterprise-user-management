/**
 * 系统配置 API
 */
import http from './request'

export const getSettings = () => http.get('/settings')
export const createSetting = (data) => http.post('/settings', data)
export const updateSetting = (id, data) => http.put(`/settings/${id}`, data)
export const deleteSetting = (id) => http.delete(`/settings/${id}`)
