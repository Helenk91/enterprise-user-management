/**
 * 数据字典 API
 */
import http from './request'

export const getDictTypes = (params) => http.get('/dict/types', { params })
export const createDictType = (data) => http.post('/dict/types', data)
export const updateDictType = (id, data) => http.put(`/dict/types/${id}`, data)
export const deleteDictType = (id) => http.delete(`/dict/types/${id}`)
export const getDictItems = (typeCode) => http.get('/dict/items', { params: { typeCode } })
export const createDictItem = (data) => http.post('/dict/items', data)
export const updateDictItem = (id, data) => http.put(`/dict/items/${id}`, data)
export const deleteDictItem = (id) => http.delete(`/dict/items/${id}`)
