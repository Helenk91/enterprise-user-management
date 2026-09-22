/**
 * 服务端数据导出服务
 * 生成 CSV 文本（UTF-8 BOM），供各模块导出
 */
const { query } = require('../db');

class ExportService {
  /**
   * 导出用户列表
   */
  async usersCSV() {
    const rows = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.department, u.region, u.status, u.created_at
       FROM users u ORDER BY u.id`
    );
    const headers = ['ID', '姓名', '邮箱', '手机号', '角色', '部门', '地区', '状态', '注册时间'];
    const lines = rows.map((r) => [
      r.id,
      r.name,
      r.email,
      r.phone || '',
      r.role === 'admin' ? '管理员' : '普通用户',
      r.department || '',
      r.region || '',
      r.status === 1 ? '启用' : '禁用',
      r.created_at ? new Date(r.created_at).toLocaleString('zh-CN') : '',
    ]);
    return this.buildCsv(headers, lines, '用户数据');
  }

  /**
   * 导出审计日志
   */
  async logsCSV() {
    const rows = await query(
      `SELECT id, action, detail, user_name, ip, created_at
       FROM logs
       ORDER BY id DESC LIMIT 5000`
    );
    const headers = ['ID', '操作类型', '详情', '操作人', 'IP', '时间'];
    const lines = rows.map((r) => [
      r.id,
      r.action,
      r.detail || '',
      r.user_name || '-',
      r.ip || '-',
      r.created_at ? new Date(r.created_at).toLocaleString('zh-CN') : '',
    ]);
    return this.buildCsv(headers, lines, '操作日志');
  }

  /**
   * 导出任务清单
   */
  async tasksCSV() {
    const rows = await query(
      `SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date, u.name AS user_name, t.created_at
       FROM tasks t LEFT JOIN users u ON u.id = t.user_id ORDER BY t.id`
    );
    const headers = ['ID', '标题', '描述', '优先级', '状态', '截止日期', '负责人', '创建时间'];
    const pri = { high: '高', medium: '中', low: '低' };
    const st = { todo: '待办', doing: '进行中', done: '已完成' };
    const lines = rows.map((r) => [
      r.id,
      r.title,
      r.description || '',
      pri[r.priority] || r.priority,
      st[r.status] || r.status,
      r.due_date ? String(r.due_date).slice(0, 10) : '',
      r.user_name || '-',
      r.created_at ? new Date(r.created_at).toLocaleString('zh-CN') : '',
    ]);
    return this.buildCsv(headers, lines, '任务数据');
  }

  /**
   * 导出公告
   */
  async noticesCSV() {
    const rows = await query(
      `SELECT id, title, content, type, status, author, published_at, created_at
       FROM notices ORDER BY id`
    );
    const headers = ['ID', '标题', '内容', '类型', '状态', '作者', '发布时间'];
    const pri = { notice: '通知', announcement: '公告' };
    const lines = rows.map((r) => [
      r.id,
      r.title,
      (r.content || '').replace(/\n/g, ' '),
      pri[r.type] || r.type,
      r.status === 'published' ? '已发布' : '草稿',
      r.author || '-',
      r.published_at ? new Date(r.published_at).toLocaleString('zh-CN') : '',
    ]);
    return this.buildCsv(headers, lines, '公告数据');
  }

  /**
   * 审计分析：近 N 天活跃趋势（登录/操作次数）
   */
  async activityTrend(days = 14) {
    const n = Math.min(Math.max(Number(days) || 14, 7), 90);
    return query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS count
       FROM logs
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY day`,
      [n]
    );
  }

  /**
   * 审计分析：30 天活跃热力（天 × 小时）
   */
  async activityHeatmap(days = 30) {
    const n = Math.min(Math.max(Number(days) || 30, 7), 90);
    const rows = await query(
      `SELECT DATE(created_at) AS day, HOUR(created_at) AS hour, COUNT(*) AS count
       FROM logs
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at), HOUR(created_at)
       ORDER BY day, hour`,
      [n]
    );
    // 组装 [ [dayIndex, hour, count], ... ]
    const dayMap = {};
    let idx = 0;
    for (const r of rows) {
      if (!(r.day in dayMap)) dayMap[r.day] = idx++;
    }
    return rows.map((r) => [dayMap[r.day], r.hour, r.count]);
  }

  /**
   * 审计分析：操作分布
   */
  async actionStats(days = 7) {
    const n = Math.min(Math.max(Number(days) || 7, 1), 30);
    return query(
      `SELECT action AS name, COUNT(*) AS value
       FROM logs
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY action
       ORDER BY value DESC
       LIMIT 12`,
      [n]
    );
  }

  /**
   * 审计分析：活跃时段（0-23 点）
   */
  async hourStats(days = 14) {
    const n = Math.min(Math.max(Number(days) || 14, 7), 90);
    const rows = await query(
      `SELECT HOUR(created_at) AS hour, COUNT(*) AS value
       FROM logs
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY HOUR(created_at)
       ORDER BY hour`,
      [n]
    );
    const out = [];
    for (let h = 0; h < 24; h++) {
      const hit = rows.find((r) => Number(r.hour) === h);
      out.push({ hour: `${String(h).padStart(2, '0')}:00`, value: hit ? hit.value : 0 });
    }
    return out;
  }

  /**
   * 构建 CSV 文本
   */
  buildCsv(headers, lines, title) {
    const esc = (v) => {
      const s = String(v ?? '');
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const head = headers.map(esc).join(',');
    const body = lines.map((row) => row.map(esc).join(',')).join('\r\n');
    // UTF-8 BOM
    return '\uFEFF' + `${head}\r\n${body}`;
  }
}

module.exports = new ExportService();
