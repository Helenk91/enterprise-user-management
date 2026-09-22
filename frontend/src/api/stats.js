/**
 * 统计 API
 */
import http from './request'

export const getOverview = () => http.get('/stats/overview')
export const getTrend = (days = 7) => http.get('/stats/trend', { params: { days } })
export const getRoles = () => http.get('/stats/roles')
