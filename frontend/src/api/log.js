/**
 * 操作日志 API
 */
import http from './request'

export const getLogs = (params) => http.get('/logs', { params })
