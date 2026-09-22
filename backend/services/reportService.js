/**
 * 综合报表服务
 * 聚合用户 / 任务 / 公告 / 日志，生成统计报表
 */
const { query } = require('../db');

class ReportService {
  /**
   * 核心指标
   */
  async core() {
    const [u] = await query('SELECT COUNT(*) AS cnt, SUM(status = 1) AS active FROM users');
    const [t] = await query('SELECT COUNT(*) AS cnt, SUM(status = "todo") AS todo, SUM(status = "doing") AS doing, SUM(status = "done") AS done FROM tasks');
    const [n] = await query("SELECT COUNT(*) AS cnt FROM notices WHERE status = 'published'");
    const [l] = await query('SELECT COUNT(*) AS cnt FROM logs');
    const [m] = await query('SELECT COUNT(*) AS cnt FROM messages');
    return {
      users: u.cnt,
      activeUsers: u.active || 0,
      tasks: t.cnt,
      tasksTodo: t.todo || 0,
      tasksDoing: t.doing || 0,
      tasksDone: t.done || 0,
      notices: n.cnt,
      logs: l.cnt,
      messages: m.cnt,
    };
  }

  /**
   * 近 7 天注册/操作对比
   */
  async trend(days = 7) {
    const n = Math.min(Math.max(Number(days) || 7, 7), 90);
    const regs = await query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS count FROM users
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at) ORDER BY day`,
      [n]
    );
    const ops = await query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS count FROM logs
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at) ORDER BY day`,
      [n]
    );
    const regMap = Object.fromEntries(regs.map((r) => [String(r.day), r.count]));
    const opMap = Object.fromEntries(ops.map((r) => [String(r.day), r.count]));
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      out.push({ day: key, registrations: regMap[key] || 0, operations: opMap[key] || 0 });
    }
    return out;
  }

  /**
   * 用户角色/部门/地区分布（复用统计）
   */
  async distributions() {
    const roles = await query('SELECT role, COUNT(*) AS count FROM users GROUP BY role');
    const departments = await query('SELECT department AS name, COUNT(*) AS count FROM users WHERE department IS NOT NULL AND department <> "" GROUP BY department');
    const regions = await query('SELECT region AS name, COUNT(*) AS count FROM users WHERE region IS NOT NULL AND region <> "" GROUP BY region');
    return { roles, departments, regions };
  }

  /**
   * 任务完成率
   */
  async taskCompletion() {
    const [r] = await query('SELECT COUNT(*) AS total, SUM(status = "done") AS done FROM tasks');
    const total = Number(r.total) || 0;
    const done = Number(r.done) || 0;
    return { total, done, rate: total ? Math.round((done / total) * 1000) / 10 : 0 };
  }
}

module.exports = new ReportService();
