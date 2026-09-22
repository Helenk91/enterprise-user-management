/**
 * 格式化工具
 */
export const format = {
  /**
   * 时间格式化为本地字符串
   * @param {string|Date} value ISO 字符串或 Date
   */
  dateTime(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  },  /**
   * 相对时间（x 分钟前 / x 小时前 / 日期）
   */
  relativeTime(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    const diff = Date.now() - d.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < minute) return '刚刚';
    if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`;
    if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
    if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`;
    return this.dateTime(value);
  },

  /**
   * 角色中文名
   */
  roleText(role) {
    return role === 'admin' ? '管理员' : role === 'user' ? '普通用户' : role || '-';
  },

  /**
   * 状态中文名
   */
  statusText(status) {
    return status === 'active' ? '启用' : status === 'disabled' ? '禁用' : status || '-';
  },
};

/**
 * 时间格式化别名（兼容 formatTime 命名导入）
 */
export const formatTime = (value) => format.dateTime(value);

export default format;
