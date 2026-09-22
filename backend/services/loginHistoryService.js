/**
 * 登录历史服务
 */
const { query } = require('../db');

class LoginHistoryService {
  /**
   * 记录登录历史
   */
  async record({ userId, email, ip = '', userAgent = '', status = 'success' }) {
    const device = /mobile|android|iphone/i.test(userAgent) ? 'mobile' : 'desktop';
    await query(
      `INSERT INTO login_history (user_id, email, ip, user_agent, device, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, email, ip || null, (userAgent || '').slice(0, 290), device, status]
    );
  }

  /**
   * 分页查询某用户登录历史
   */
  async listByUser(userId, { page = 1, pageSize = 10, status = '' }) {
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 100);
    let where = ' WHERE user_id = ?';
    const params = [userId];
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }
    const [countRow] = await query(`SELECT COUNT(*) AS total FROM login_history${where}`, params);
    const total = countRow.total;
    const list = await query(
      `SELECT id, ip, user_agent, device, location, status, created_at
       FROM login_history${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, ps, (p - 1) * ps]
    );
    return { list, total, page: p, pageSize: ps };
  }
}

module.exports = new LoginHistoryService();
