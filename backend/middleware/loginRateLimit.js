/**
 * 登录接口专用限流
 * 防止暴力破解：同一 IP 每分钟最多尝试 N 次
 */
const config = require('../config');

const hits = new Map(); // ip -> number[]（时间戳数组）

function cleanup(ip, now, windowMs) {
  const arr = hits.get(ip);
  if (!arr) return;
  while (arr.length && now - arr[0] > windowMs) arr.shift();
  if (arr.length === 0) hits.delete(ip);
}

module.exports = function loginRateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const { windowMs, max } = config.login;

  cleanup(ip, now, windowMs);

  const arr = hits.get(ip) || [];
  if (arr.length >= max) {
    return res.status(429).json({
      code: 429,
      message: `登录尝试过于频繁，请 ${Math.ceil(windowMs / 60000)} 分钟后再试`,
      data: null,
    });
  }

  arr.push(now);
  hits.set(ip, arr);
  next();
};
