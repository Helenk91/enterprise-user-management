/**
 * 导出与数据分析 API
 */
import http from './request'

// CSV 导出（浏览器直接下载）
export const downloadUsersCSV = () => http.get('/export/users.csv', { responseType: 'blob' })
export const downloadLogsCSV = () => http.get('/export/logs.csv', { responseType: 'blob' })
export const downloadTasksCSV = () => http.get('/export/tasks.csv', { responseType: 'blob' })
export const downloadNoticesCSV = () => http.get('/export/notices.csv', { responseType: 'blob' })

// 数据分析
export const getAnalyticsTrend = (days = 14) => http.get('/export/analytics/trend', { params: { days } })
export const getAnalyticsHeatmap = (days = 30) => http.get('/export/analytics/heatmap', { params: { days } })
export const getAnalyticsActions = (days = 7) => http.get('/export/analytics/actions', { params: { days } })
export const getAnalyticsHours = (days = 14) => http.get('/export/analytics/hours', { params: { days } })
