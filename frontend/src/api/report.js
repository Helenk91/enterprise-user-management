/**
 * 报表 API
 */
import http from './request'

export const getReportCore = () => http.get('/report/core')
export const getReportTrend = (days = 7) => http.get('/report/trend', { params: { days } })
export const getReportDistributions = () => http.get('/report/distributions')
export const getReportTaskCompletion = () => http.get('/report/task-completion')
