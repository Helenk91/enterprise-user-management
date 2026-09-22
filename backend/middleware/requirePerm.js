/**
 * 角色权限中间件
 * 用法：requireRole('admin') 或 requirePerm('user:delete')
 * admin 角色拥有全部权限
 */
const ApiResponse = require('../utils/response');

module.exports = function requirePerm(permCode) {
  return (req, res, next) => {
    if (!req.user) return ApiResponse.unauthorized(res);
    if (req.user.role === 'admin') return next();
    // 非 admin 需要校验权限点（通过角色-权限关联）
    const { query } = require('../db');
    query(
      `SELECT 1 FROM role_permissions rp
       JOIN roles r ON r.id = rp.role_id
       JOIN permissions p ON p.id = rp.perm_id
       WHERE r.role_code = ? AND p.perm_code = ?
       LIMIT 1`,
      [req.user.role, permCode]
    )
      .then((rows) => {
        if (rows.length) return next();
        return ApiResponse.forbidden(res, '没有权限执行此操作');
      })
      .catch(() => ApiResponse.serverError(res));
  };
};
