/**
 * 简单限流中间件（内存滑动窗口）
 * 防止单 IP 高频请求
 */
const config = require('../config');

const hits = new Map(); // ip -> number[]（时间戳数组）

function cleanup(ip, now, windowMs) {
  const arr = hits.get(ip);
  if (!arr) return;
  while (arr.length && now - arr[0] > windowMs) arr.shift();
  if (arr.length === 0) hits.delete(ip);
}

module.exports = function rateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const { windowMs, max } = config.rateLimit;

  cleanup(ip, now, windowMs);

  const arr = hits.get(ip) || [];
  if (arr.length >= max) {
    return res.status(429).json({
      code: 429,
      message: '请求过于频繁，请稍后再试',
      data: null,
    });
  }

  arr.push(now);
  hits.set(ip, arr);
  next();
};
