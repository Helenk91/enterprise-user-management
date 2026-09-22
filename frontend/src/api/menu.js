/**
 * 菜单管理 API
 */
import http from './request'

export const getMenuTree = () => http.get('/menus/tree')
export const getMenus = () => http.get('/menus')
export const createMenu = (data) => http.post('/menus', data)
export const updateMenu = (id, data) => http.put(`/menus/${id}`, data)
export const deleteMenu = (id) => http.delete(`/menus/${id}`)
