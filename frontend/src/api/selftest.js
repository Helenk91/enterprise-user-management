/**
 * 系统自测 API
 */
import http from './request'

/** 执行全链路自检（管理员） */
export const runSelfTest = () => http.post('/selftest/run')
