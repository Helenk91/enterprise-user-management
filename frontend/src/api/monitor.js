/**
 * 系统监控 API
 */
import http from './request'

export const getServerInfo = () => http.get('/monitor/server')
export const getOnlineUsers = () => http.get('/monitor/online')
