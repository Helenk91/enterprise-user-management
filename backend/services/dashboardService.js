/**
 * 扩展统计服务（仪表盘增强）
 */
const { query } = require('../db');

class DashboardService {
  /**
   * 月度注册统计（近 N 个月，含环比）
   */
  async monthlyRegistrations(months = 6) {
    const rows = await query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS cnt
       FROM users
       WHERE created_at >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL ? MONTH)
       GROUP BY month ORDER BY month`,
      [Number(months) - 1]
    );
    return rows;
  }

  /**
   * 近 30 天活跃热力图数据（每天注册/登录活跃数）
   */
  async activityHeatmap(days = 30) {
    return query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS cnt
       FROM users
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY day ORDER BY day`,
      [Number(days) - 1]
    );
  }

  /**
   * 操作类型分布（近 7 天）
   */
  async actionDistribution(days = 7) {
    return query(
      `SELECT action AS name, COUNT(*) AS value FROM logs
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY action ORDER BY value DESC`,
      [Number(days)]
    );
  }

  /**
   * 系统概览（数据库状态等）
   */
  async systemOverview() {
    const [userRow] = await query('SELECT COUNT(*) AS cnt FROM users');
    const [logRow] = await query('SELECT COUNT(*) AS cnt FROM logs');
    const [taskRow] = await query('SELECT COUNT(*) AS cnt FROM tasks');
    const [fileRow] = await query('SELECT COUNT(*) AS cnt FROM files');
    const [msgRow] = await query('SELECT COUNT(*) AS cnt FROM messages');
    return {
      users: userRow.cnt,
      logs: logRow.cnt,
      tasks: taskRow.cnt,
      files: fileRow.cnt,
      messages: msgRow.cnt,
    };
  }

  /**
   * 存储统计
   */
  async storageStats() {
    const [row] = await query(
      `SELECT type, SUM(size) AS bytes, COUNT(*) AS cnt FROM files GROUP BY type`
    );
    return row || null;
  }
}

module.exports = new DashboardService();
