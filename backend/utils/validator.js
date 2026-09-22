/**
 * 输入校验工具
 * 返回错误信息数组，空数组表示通过
 */
const validator = {
  /**
   * 非空字符串校验
   */
  requiredString(value, fieldName, { min = 1, max = 100 } = {}) {
    if (value === undefined || value === null || typeof value !== 'string') {
      return `${fieldName}不能为空`;
    }
    const v = value.trim();
    if (v.length < min) return `${fieldName}不能为空`;
    if (v.length > max) return `${fieldName}长度不能超过 ${max} 个字符`;
    return null;
  },

  /**
   * 邮箱格式校验
   */
  email(value, fieldName = '邮箱') {
    if (!value || typeof value !== 'string') return `${fieldName}不能为空`;
    const v = value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `${fieldName}格式不正确`;
    return null;
  },

  /**
   * 手机号校验（宽松：5-20 位数字/+/空格/-）
   */
  phone(value, fieldName = '手机号') {
    if (!value) return null; // 选填
    const v = value.trim();
    if (!/^[0-9+\-\s]{5,20}$/.test(v)) return `${fieldName}格式不正确`;
    return null;
  },

  /**
   * 密码强度校验（企业级策略）
   * 规则：8-64 位，必须同时包含大写字母、小写字母、数字、特殊字符
   */
  password(value, fieldName = '密码', { min = 8, max = 64 } = {}) {
    if (!value || typeof value !== 'string') return `${fieldName}不能为空`;
    if (value.length < min) return `${fieldName}长度不能少于 ${min} 位`;
    if (value.length > max) return `${fieldName}长度不能超过 ${max} 位`;
    if (/\s/.test(value)) return `${fieldName}不能包含空格`;
    if (!/[a-z]/.test(value)) return `${fieldName}必须包含小写字母`;
    if (!/[A-Z]/.test(value)) return `${fieldName}必须包含大写字母`;
    if (!/\d/.test(value)) return `${fieldName}必须包含数字`;
    if (!/[^a-zA-Z0-9]/.test(value)) return `${fieldName}必须包含特殊字符`;
    return null;
  },

  /**
   * 枚举值校验
   */
  enum(value, allowed, fieldName = '取值') {
    if (!allowed.includes(value)) return `${fieldName}只能是：${allowed.join('/')}`;
    return null;
  },

  /**
   * 批量校验：返回错误数组
   */
  validateAll(rules) {
    const errors = [];
    for (const { validator: fn, args } of rules) {
      const err = fn(...args);
      if (err) errors.push(err);
    }
    return errors;
  },
};

module.exports = validator;
