/**
 * 系统工具控制器
 * 健康检查 / 数据规模 / 接口清单 / 缓存统计
 */
const healthService = require('../services/healthService');
const tokenBlacklist = require('../middleware/tokenBlacklist');
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

class ToolController {
  /**
   * GET /api/tools/health
   */
  async health(req, res, next) {
    try {
      const result = await healthService.fullCheck();
      logger.logToDb({
        action: 'TOOL_HEALTH',
        method: req.method,
        path: req.originalUrl,
        detail: `深度健康检查：${result.overall}`,
        userName: req.user.name,
        ip: req.ip,
      });
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tools/ping
   */
  async ping(req, res, next) {
    try {
      const result = await healthService.ping();
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tools/tables
   */
  async tables(req, res, next) {
    try {
      const tables = await healthService.tables();
      return ApiResponse.success(res, tables);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tools/row-counts
   */
  async rowCounts(req, res, next) {
    try {
      const counts = await healthService.rowCounts();
      return ApiResponse.success(res, counts);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tools/api-list
   */
  async apiList(req, res, next) {
    const list = [
      { method: 'POST', path: '/api/auth/login', desc: '登录（限流+锁定+记录历史）' },
      { method: 'POST', path: '/api/auth/register', desc: '注册（密码强度校验）' },
      { method: 'POST', path: '/api/auth/logout', desc: '登出（token 加入黑名单）' },
      { method: 'GET', path: '/api/auth/me', desc: '获取当前登录用户' },
      { method: 'PUT', path: '/api/auth/password', desc: '修改密码（登出所有会话）' },
      { method: 'GET', path: '/api/users', desc: '用户分页列表' },
      { method: 'GET', path: '/api/users/:id', desc: '用户详情' },
      { method: 'POST', path: '/api/users', desc: '创建用户' },
      { method: 'PUT', path: '/api/users/:id', desc: '更新用户' },
      { method: 'DELETE', path: '/api/users/:id', desc: '删除用户' },
      { method: 'POST', path: '/api/users/batch-delete', desc: '批量删除' },
      { method: 'GET', path: '/api/users/export/csv', desc: '导出 CSV' },
      { method: 'POST', path: '/api/users/import', desc: '批量导入' },
      { method: 'POST', path: '/api/users/batch-status', desc: '批量启用/禁用' },
      { method: 'POST', path: '/api/users/:id/reset-password', desc: '管理员重置密码' },
      { method: 'GET', path: '/api/stats/overview', desc: '仪表盘概览' },
      { method: 'GET', path: '/api/stats/trend', desc: '注册趋势' },
      { method: 'GET', path: '/api/stats/roles', desc: '角色分布' },
      { method: 'GET', path: '/api/logs', desc: '操作日志分页' },
      { method: 'GET', path: '/api/profile', desc: '个人资料' },
      { method: 'PUT', path: '/api/profile', desc: '更新资料' },
      { method: 'PUT', path: '/api/profile/avatar', desc: '更新头像' },
      { method: 'GET', path: '/api/profile/stats', desc: '分布统计' },
      { method: 'GET', path: '/api/security/login-history', desc: '登录历史' },
      { method: 'GET', path: '/api/security/sessions', desc: '会话列表' },
      { method: 'DELETE', path: '/api/security/sessions/:id', desc: '下线会话' },
      { method: 'GET', path: '/api/notices', desc: '公告分页' },
      { method: 'GET', path: '/api/notices/latest', desc: '最新公告' },
      { method: 'POST', path: '/api/notices', desc: '发布公告' },
      { method: 'PUT', path: '/api/notices/:id', desc: '修改公告' },
      { method: 'DELETE', path: '/api/notices/:id', desc: '删除公告' },
      { method: 'GET', path: '/api/tasks', desc: '任务分页' },
      { method: 'GET', path: '/api/tasks/board', desc: '任务看板' },
      { method: 'POST', path: '/api/tasks', desc: '创建任务' },
      { method: 'PATCH', path: '/api/tasks/:id/status', desc: '变更任务状态' },
      { method: 'GET', path: '/api/messages', desc: '消息分页' },
      { method: 'GET', path: '/api/messages/unread-count', desc: '未读数' },
      { method: 'PUT', path: '/api/messages/read-all', desc: '全部已读' },
      { method: 'GET', path: '/api/files/tree', desc: '文件夹树' },
      { method: 'GET', path: '/api/files/stats', desc: '文件统计' },
      { method: 'POST', path: '/api/files/folder', desc: '创建文件夹' },
      { method: 'GET', path: '/api/dict/types', desc: '字典类型' },
      { method: 'GET', path: '/api/dict/items', desc: '字典项' },
      { method: 'GET', path: '/api/roles', desc: '角色列表' },
      { method: 'GET', path: '/api/roles/permissions', desc: '权限点' },
      { method: 'PUT', path: '/api/roles/:id/permissions', desc: '分配权限' },
      { method: 'GET', path: '/api/menus/tree', desc: '菜单树' },
      { method: 'GET', path: '/api/settings', desc: '系统配置' },
      { method: 'GET', path: '/api/dashboard/monthly', desc: '月度注册' },
      { method: 'GET', path: '/api/dashboard/heatmap', desc: '活跃热力' },
      { method: 'GET', path: '/api/dashboard/actions', desc: '操作分布' },
      { method: 'GET', path: '/api/dashboard/system', desc: '系统概览' },
      { method: 'GET', path: '/api/monitor/server', desc: '服务器信息' },
      { method: 'GET', path: '/api/monitor/online', desc: '在线用户' },
      { method: 'GET', path: '/api/tools/health', desc: '深度健康检查' },
      { method: 'GET', path: '/api/tools/ping', desc: '快速探活' },
      { method: 'GET', path: '/api/tools/tables', desc: '数据库表清单' },
      { method: 'GET', path: '/api/tools/row-counts', desc: '各表行数' },
      { method: 'GET', path: '/api/tools/api-list', desc: '接口清单' },
      { method: 'GET', path: '/api/tools/cache-stats', desc: '缓存统计' },
    ];
    return ApiResponse.success(res, list);
  }

  /**
   * GET /api/tools/cache-stats
   */
  async cacheStats(req, res, next) {
    try {
      const stats = tokenBlacklist.stats();
      return ApiResponse.success(res, stats);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ToolController();
