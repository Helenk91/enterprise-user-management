/**
 * 在线会话服务
 */
const { query } = require('../db');

class SessionService {
  /**
   * 记录新会话（登录时）
   */
  async create({ userId, jti, ip = '', userAgent = '' }) {
    const device = /mobile|android|iphone/i.test(userAgent) ? 'mobile' : 'desktop';
    await query(
      `INSERT INTO sessions (user_id, jti, ip, user_agent, device) VALUES (?, ?, ?, ?, ?)`,
      [userId, jti, ip || null, (userAgent || '').slice(0, 290), device]
    );
  }

  /**
   * 刷新活跃时间
   */
  async touch(jti) {
    await query('UPDATE sessions SET last_active_at = NOW() WHERE jti = ?', [jti]).catch(() => {});
  }

  /**
   * 删除会话（踢下线/登出时）
   */
  async remove(jti) {
    await query('DELETE FROM sessions WHERE jti = ?', [jti]);
  }

  /**
   * 清理过期会话
   */
  async cleanup(expireHours = 12) {
    await query(
      `DELETE FROM sessions WHERE last_active_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [expireHours]
    );
  }

  /**
   * 当前用户会话列表
   */
  async listByUser(userId) {
    return query(
      `SELECT id, jti, ip, device, user_agent, created_at, last_active_at
       FROM sessions WHERE user_id = ? ORDER BY last_active_at DESC`,
      [userId]
    );
  }

  /**
   * 在线用户统计（仪表盘）
   */
  async onlineCount() {
    const [row] = await query(
      `SELECT COUNT(DISTINCT user_id) AS cnt FROM sessions
       WHERE last_active_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)`
    );
    return row.cnt;
  }

  /**
   * 在线用户列表（最近活跃）
   */
  async onlineUsers(limit = 8) {
    return query(
      `SELECT s.user_id, u.name, u.email, u.avatar, s.ip, s.device, s.last_active_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       JOIN (
         SELECT user_id, MAX(last_active_at) AS latest
         FROM sessions WHERE last_active_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
         GROUP BY user_id
       ) t ON t.user_id = s.user_id AND t.latest = s.last_active_at
       ORDER BY s.last_active_at DESC LIMIT ?`,
      [limit]
    );
  }
}

module.exports = new SessionService();
