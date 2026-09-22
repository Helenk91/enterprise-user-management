/**
 * 文件管理 API
 */
import http from './request'

export const getFileTree = () => http.get('/files/tree')
export const getFiles = (params) => http.get('/files', { params })
export const getFileStats = () => http.get('/files/stats')
export const createFolder = (data) => http.post('/files/folder', data)
export const createFile = (data) => http.post('/files', data)
export const recordDownload = (id) => http.post(`/files/${id}/download`)
export const deleteFile = (id) => http.delete(`/files/${id}`)
export const deleteFolder = (id) => http.delete(`/files/folder/${id}`)
