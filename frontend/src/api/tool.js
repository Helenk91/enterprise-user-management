/**
 * 系统工具 API
 */
import http from './request'

export const getHealth = () => http.get('/tools/health')
export const getPing = () => http.get('/tools/ping')
export const getTables = () => http.get('/tools/tables')
export const getRowCounts = () => http.get('/tools/row-counts')
export const getApiList = () => http.get('/tools/api-list')
export const getCacheStats = () => http.get('/tools/cache-stats')
/** 服务器运行时信息（OS + CPU + 内存 + Node） */
export const getServerInfo = () => http.get('/monitor/server')
