/**
 * 角色权限 API
 */
import http from './request'

export const getRoles = () => http.get('/roles')
export const createRole = (data) => http.post('/roles', data)
export const updateRole = (id, data) => http.put(`/roles/${id}`, data)
export const deleteRole = (id) => http.delete(`/roles/${id}`)
export const getPermissions = () => http.get('/roles/permissions')
export const getRolePerms = (id) => http.get(`/roles/${id}/permissions`)
export const assignPerms = (id, permIds) => http.put(`/roles/${id}/permissions`, { permIds })
