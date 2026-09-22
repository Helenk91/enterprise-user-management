/**
 * 待办任务 API
 */
import http from './request'

export const getTasks = (params) => http.get('/tasks', { params })
export const getTaskBoard = () => http.get('/tasks/board')
export const createTask = (data) => http.post('/tasks', data)
export const updateTask = (id, data) => http.put(`/tasks/${id}`, data)
export const changeTaskStatus = (id, status) => http.patch(`/tasks/${id}/status`, { status })
export const getMonthTasks = (year, month) => http.get('/tasks/month', { params: { year, month } })
export const getRangeTasks = (start, end) => http.get('/tasks/range', { params: { start, end } })
export const deleteTask = (id) => http.delete(`/tasks/${id}`)
