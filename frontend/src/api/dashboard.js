/**
 * 仪表盘增强 API
 */
import http from './request'

export const getMonthly = (months = 6) => http.get('/dashboard/monthly', { params: { months } })
export const getHeatmap = (days = 30) => http.get('/dashboard/heatmap', { params: { days } })
export const getActions = (days = 7) => http.get('/dashboard/actions', { params: { days } })
export const getSystem = () => http.get('/dashboard/system')
