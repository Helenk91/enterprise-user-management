/**
 * 通知公告 API
 */
import http from './request'

export const getNotices = (params) => http.get('/notices', { params })
export const getLatestNotices = () => http.get('/notices/latest')
export const getNotice = (id) => http.get(`/notices/${id}`)
export const createNotice = (data) => http.post('/notices', data)
export const updateNotice = (id, data) => http.put(`/notices/${id}`, data)
export const deleteNotice = (id) => http.delete(`/notices/${id}`)
