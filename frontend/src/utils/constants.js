/**
 * 全局常量定义
 * 集中管理所有状态枚举、映射与配置，供各页面复用
 */

/* ===== 部门选项（与种子数据保持一致） ===== */
export const DEPARTMENTS = ['技术部', '市场部', '销售部', '财务部', '人事部', '产品部', '运营部', '法务部', '客服部', '设计部']

/* ===== 用户状态 ===== */
export const USER_STATUS = {
  1: { label: '启用', pill: 'pill-success' },
  0: { label: '禁用', pill: 'pill-danger' },
}

export const USER_ROLE = {
  admin: { label: '管理员', pill: 'pill-violet' },
  user: { label: '普通用户', pill: 'pill-info' },
}

export const GENDER = {
  male: { label: '男', pill: 'pill-info' },
  female: { label: '女', pill: 'pill-danger' },
  unknown: { label: '保密', pill: 'pill-default' },
}

/* ===== 任务 ===== */
export const TASK_STATUS = {
  todo: { label: '待办', color: '#2563eb', icon: '◌' },
  doing: { label: '进行中', color: '#e8960c', icon: '◐' },
  done: { label: '已完成', color: '#0fa968', icon: '●' },
}

export const TASK_PRIORITY = {
  high: { label: '高', pill: 'pill-danger' },
  medium: { label: '中', pill: 'pill-warning' },
  low: { label: '低', pill: 'pill-success' },
}

/* ===== 公告 ===== */
export const NOTICE_PRIORITY = {
  normal: { label: '普通', pill: 'pill-info' },
  important: { label: '重要', pill: 'pill-warning' },
  urgent: { label: '紧急', pill: 'pill-danger' },
}

/* ===== 消息 ===== */
export const MESSAGE_READ = {
  1: { label: '已读', pill: 'pill-success' },
  0: { label: '未读', pill: 'pill-warning' },
}

/* ===== 审计操作 ===== */
export const ACTION_TEXT = {
  LOGIN: '登录',
  LOGOUT: '登出',
  REGISTER: '注册',
  USER_CREATE: '创建用户',
  USER_UPDATE: '修改用户',
  USER_DELETE: '删除用户',
  USER_BATCH_DELETE: '批量删除',
  PASSWORD_CHANGE: '修改密码',
  PROFILE_UPDATE: '更新资料',
  NOTICE_CREATE: '发布公告',
  NOTICE_UPDATE: '修改公告',
  NOTICE_DELETE: '删除公告',
  TASK_CREATE: '创建任务',
  SESSION_KICK: '下线会话',
  USER_IMPORT: '导入用户',
  USER_BATCH_STATUS: '批量改状态',
  PASSWORD_RESET: '重置密码',
  FILE_CREATE: '上传文件',
  TOOL_HEALTH: '健康检查',
}

export const ACTION_PILL = {
  LOGIN: 'pill-success',
  LOGOUT: 'pill-info',
  REGISTER: 'pill-violet',
  USER_CREATE: 'pill-info',
  USER_UPDATE: 'pill-info',
  USER_DELETE: 'pill-danger',
  USER_BATCH_DELETE: 'pill-danger',
  PASSWORD_CHANGE: 'pill-violet',
  PROFILE_UPDATE: 'pill-info',
  NOTICE_CREATE: 'pill-violet',
  NOTICE_UPDATE: 'pill-violet',
  NOTICE_DELETE: 'pill-danger',
  TASK_CREATE: 'pill-info',
  SESSION_KICK: 'pill-warning',
  USER_IMPORT: 'pill-success',
  USER_BATCH_STATUS: 'pill-warning',
  PASSWORD_RESET: 'pill-danger',
  FILE_CREATE: 'pill-info',
  TOOL_HEALTH: 'pill-success',
}

/* ===== 字典类型映射（后端 dict 表） ===== */
export const DICT_TYPE_LABEL = {
  gender: '性别',
  department: '部门',
  region: '地区',
  notice_priority: '公告优先级',
  task_priority: '任务优先级',
}

/* ===== 分页默认值 ===== */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

/* ===== 主题 ===== */
export const THEME = {
  name: 'white-tech',
  version: 'v4.0.0',
  brand: '企业管理系统',
  brandEn: 'ENTERPRISE',
}

/* ===== 正则 ===== */
export const REGEX = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^1[3-9]\d{9}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/,
  ipv4: /^(\d{1,3}\.){3}\d{1,3}$/,
}
