/**
 * JWT 黑名单（内存实现）
 * 登出后的 token 立即失效；定时清理过期条目防止内存膨胀
 */
const config = require('../config');

const blacklist = new Map(); // jti -> expireAt

const tokenBlacklist = {
  /**
   * 加入黑名单
   */
  add(payload) {
    if (!payload || !payload.jti) return;
    const ttl = payload.exp ? payload.exp * 1000 - Date.now() : config.jwt.blacklistTtlMs;
    if (ttl <= 0) return;
    blacklist.set(payload.jti, Date.now() + ttl);
  },

  /**
   * 是否已在黑名单
   */
  has(jti) {
    if (!jti) return false;
    const expireAt = blacklist.get(jti);
    if (!expireAt) return false;
    if (Date.now() > expireAt) {
      blacklist.delete(jti);
      return false;
    }
    return true;
  },

  /**
   * 清理过期条目
   */
  cleanup() {
    const now = Date.now();
    for (const [jti, expireAt] of blacklist) {
      if (now > expireAt) blacklist.delete(jti);
    }
  },

  /**
   * 统计信息（监控用）
   */
  stats() {
    this.cleanup();
    return {
      engine: 'memory-map',
      entries: blacklist.size,
      lastCleanup: new Date().toISOString(),
      autoCleanupMinutes: 10,
    };
  },
};

// 每 10 分钟自动清理一次
setInterval(() => tokenBlacklist.cleanup(), 10 * 60 * 1000).unref();

module.exports = tokenBlacklist;
