/**
 * 个人资料 API
 */
import http from './request'

export const getProfile = () => http.get('/profile')
export const updateProfile = (data) => http.put('/profile', data)
export const updateAvatar = (avatar) => http.put('/profile/avatar', { avatar })
export const getProfileStats = () => http.get('/profile/stats')
