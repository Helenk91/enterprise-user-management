/**
 * 表单校验工具
 * 提供常用校验规则与统一的错误消息
 */
import { REGEX } from './constants'

export const RULES = {
  required(message = '该项为必填项') {
    return (v) => (v === undefined || v === null || String(v).trim() === '' ? message : '')
  },
  email(message = '邮箱格式不正确') {
    return (v) => (!v || REGEX.email.test(v) ? '' : message)
  },
  phone(message = '手机号格式不正确') {
    return (v) => (!v || REGEX.phone.test(v) ? '' : message)
  },
  minLength(n, message) {
    return (v) => (v && v.length >= n ? '' : message || `长度不能少于 ${n} 位`)
  },
  maxLength(n, message) {
    return (v) => (v && v.length <= n ? '' : message || `长度不能超过 ${n} 位`)
  },
  password(message = '密码需≥8位，含大小写、数字、特殊字符') {
    return (v) => (!v || REGEX.password.test(v) ? '' : message)
  },
  integer(message = '请输入整数') {
    return (v) => (!v || /^-?\d+$/.test(v) ? '' : message)
  },
  numberRange(min, max, message) {
    return (v) => (!v || (Number(v) >= min && Number(v) <= max) ? '' : message || `取值范围 ${min} ~ ${max}`)
  },
  match(field, message) {
    return (v, values) => (values[field] === v ? '' : message || '两次输入不一致')
  },
  ip(message = 'IP 地址格式不正确') {
    return (v) => (!v || REGEX.ipv4.test(v) ? '' : message)
  },
}

/**
 * 执行一组校验
 * @param {Object} values 表单值
 * @param {Object} rules 字段 -> 规则函数数组
 * @returns {{ok: boolean, errors: Object}}
 */
export function validate(values, rules) {
  const errors = {}
  for (const [field, fns] of Object.entries(rules)) {
    const arr = Array.isArray(fns) ? fns : [fns]
    for (const fn of arr) {
      const msg = fn(values[field], values)
      if (msg) {
        errors[field] = msg
        break
      }
    }
  }
  return { ok: Object.keys(errors).length === 0, errors }
}

/**
 * 必填校验（快速版）
 */
export function requireFields(values, fields) {
  const missing = fields.filter((f) => !values[f] || String(values[f]).trim() === '')
  return missing
}

/**
 * 校验返回第一条错误消息
 */
export function firstError(errors) {
  return Object.values(errors)[0] || ''
}
