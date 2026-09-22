/**
 * 统计服务：仪表盘数据
 */
const { query, queryOne } = require('../db');

class StatsService {
  /**
   * 概览统计：总数 / 今日新增 / 启用数 / 最新注册
   */
  async overview() {
    const totalRow = await queryOne('SELECT COUNT(*) AS total FROM users');
    const todayRow = await queryOne(
      "SELECT COUNT(*) AS todayNew FROM users WHERE DATE(created_at) = CURDATE()"
    );
    const activeRow = await queryOne(
      "SELECT COUNT(*) AS active FROM users WHERE status = 'active'"
    );
    const latest = await queryOne(
      'SELECT name, role, created_at FROM users ORDER BY id DESC LIMIT 1'
    );

    return {
      total: totalRow.total,
      todayNew: todayRow.todayNew,
      active: activeRow.active,
      latestUser: latest || null,
    };
  }

  /**
   * 近 N 天注册趋势（按本地日期字符串补齐空天）
   */
  async registerTrend(days = 7) {
    const rows = await query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS count
       FROM users
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
       ORDER BY day ASC`,
      [days - 1]
    );

    const map = new Map(rows.map((r) => [r.day, r.count]));

    // 用本地时间补齐每一天
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      result.push({ day: key, count: map.get(key) || 0 });
    }
    return result;
  }

  /**
   * 角色分布
   */
  async roleDistribution() {
    const rows = await query(
      'SELECT role, COUNT(*) AS count FROM users GROUP BY role'
    );
    return rows;
  }
}

module.exports = new StatsService();
