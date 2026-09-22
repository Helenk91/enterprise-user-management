/**
 * 用户 API（扩展：导入 / 批量状态 / 重置密码）
 */
import http from './request'

export const getUsers = (params) => http.get('/users', { params })
export const getUser = (id) => http.get(`/users/${id}`)
export const createUser = (data) => http.post('/users', data)
export const updateUser = (id, data) => http.put(`/users/${id}`, data)
export const deleteUser = (id) => http.delete(`/users/${id}`)
export const batchDeleteUsers = (ids) => http.post('/users/batch-delete', { ids })
export const exportCsv = (params) =>
  http.get('/users/export/csv', { params, responseType: 'blob' })

/** 批量导入用户 { rows: [...] } */
export const importUsers = (rows) => http.post('/users/import', { rows })
/** 批量启用/禁用 { ids, status } */
export const batchStatus = (ids, status) => http.post('/users/batch-status', { ids, status })
/** 重置用户密码 */
export const resetPassword = (id, password) => http.post(`/users/${id}/reset-password`, { password })
