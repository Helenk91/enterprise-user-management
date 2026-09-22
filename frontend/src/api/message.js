/**
 * 消息中心 API
 */
import http from './request'

export const getMessages = (params) => http.get('/messages', { params })
export const getUnreadCount = () => http.get('/messages/unread-count')
export const getLatestNotices = () => http.get('/notices/latest')
export const markMessageRead = (id) => http.put(`/messages/${id}/read`)
export const markAllRead = () => http.put('/messages/read-all')
export const deleteMessage = (id) => http.delete(`/messages/${id}`)
