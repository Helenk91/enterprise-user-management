/**
 * 统一错误处理中间件
 * - 捕获路由中抛出的异常
 * - 将 MySQL 错误映射为友好提示
 */
const ApiResponse = require('../utils/response');
const logger = require('../utils/logger');

module.exports = function errorHandler(err, req, res, next) {
  // CORS 拒绝
  if (err && err.message === 'Not allowed by CORS') {
    return ApiResponse.forbidden(res, '请求来源不被允许（CORS）');
  }

  // 请求体超出限制
  if (err && err.type === 'entity.too.large') {
    return ApiResponse.badRequest(res, '请求体过大，最大 100KB');
  }

  logger.error(`Unhandled: ${err.message}`, { stack: err.stack });

  // 数据库唯一键冲突
  if (err.code === 'ER_DUP_ENTRY') {
    return ApiResponse.conflict(res, '数据已存在（唯一字段冲突）');
  }

  // 数据库连接失败
  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    return ApiResponse.serverError(res, '数据库连接失败，请稍后重试');
  }

  return ApiResponse.serverError(res, '服务器内部错误');
};
