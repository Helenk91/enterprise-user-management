/**
 * 请求日志中间件
 * 记录每个请求：方法、路径、状态码、耗时、来源 IP
 */
const logger = require('../utils/logger');

module.exports = function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '-';
    logger.info(
      `${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`,
      { ip }
    );
  });

  next();
};
