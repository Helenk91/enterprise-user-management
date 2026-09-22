/**
 * 待办任务服务
 */
const { query, queryOne } = require('../db');

class TaskService {
  /**
   * 分页列表
   */
  async list(userId, { page = 1, pageSize = 10, status = '', priority = '', keyword = '' }) {
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 100);
    let where = ' WHERE user_id = ?';
    const params = [userId];
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }
    if (priority) {
      where += ' AND priority = ?';
      params.push(priority);
    }
    if (keyword) {
      where += ' AND title LIKE ?';
      params.push(`%${keyword}%`);
    }
    const [countRow] = await query(`SELECT COUNT(*) AS total FROM tasks${where}`, params);
    const total = countRow.total;
    const list = await query(
      `SELECT id, title, description, priority, status, due_date, completed_at, created_at
       FROM tasks${where} ORDER BY
         FIELD(status, 'todo', 'doing', 'done'),
         FIELD(priority, 'high', 'medium', 'low'),
         id DESC
       LIMIT ? OFFSET ?`,
      [...params, ps, (p - 1) * ps]
    );
    return { list, total, page: p, pageSize: ps };
  }

  /**
   * 看板数据（三列分组）
   */
  async board(userId) {
    const rows = await query(
      `SELECT id, title, priority, status, due_date FROM tasks
       WHERE user_id = ? ORDER BY FIELD(priority,'high','medium','low'), id DESC`,
      [userId]
    );
    return {
      todo: rows.filter((r) => r.status === 'todo'),
      doing: rows.filter((r) => r.status === 'doing'),
      done: rows.filter((r) => r.status === 'done'),
    };
  }

  async findById(id, userId) {
    return queryOne('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
  }

  /**
   * 创建
   */
  async create(userId, data) {
    const result = await query(
      `INSERT INTO tasks (user_id, title, description, priority, status, due_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, data.title, data.description || null, data.priority || 'medium', data.status || 'todo', data.dueDate || null]
    );
    return this.findById(result.insertId, userId);
  }

  /**
   * 更新（含状态流转，完成时记录时间）
   */
  async update(id, userId, data) {
    await query(
      `UPDATE tasks SET title = ?, description = ?, priority = ?, status = ?,
       due_date = ?,
       completed_at = CASE WHEN ? = 'done' THEN NOW() ELSE NULL END
       WHERE id = ? AND user_id = ?`,
      [
        data.title,
        data.description || null,
        data.priority || 'medium',
        data.status || 'todo',
        data.dueDate || null,
        data.status || 'todo',
        id,
        userId,
      ]
    );
    return this.findById(id, userId);
  }

  /**
   * 快速更新状态
   */
  async changeStatus(id, userId, status) {
    await query(
      `UPDATE tasks SET status = ?,
       completed_at = CASE WHEN ? = 'done' THEN NOW() ELSE NULL END
       WHERE id = ? AND user_id = ?`,
      [status, status, id, userId]
    );
    return this.findById(id, userId);
  }

  async remove(id, userId) {
    const result = await query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }

  /**
   * 日历数据（某月有截止日期的任务）
   */
  async month(userId, year, month) {
    const y = parseInt(year, 10) || new Date().getFullYear();
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate(); // 真实月末（如 9 月为 30）
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const end = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return this.range(userId, start, end);
  }

  /**
   * 任意日期范围的任务（周/日/月视图通用）
   */
  async range(userId, start, end) {
    return query(
      `SELECT id, title, description, priority, status, due_date, created_at
       FROM tasks
       WHERE user_id = ? AND due_date IS NOT NULL AND due_date BETWEEN ? AND ?
       ORDER BY due_date, FIELD(priority, 'high', 'medium', 'low'), id`,
      [userId, start, end]
    );
  }

  /**
   * 全部任务（供报表/导出，含用户名）
   */
  async allWithUser() {
    return query(
      `SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date, u.name AS user_name, t.created_at
       FROM tasks t LEFT JOIN users u ON u.id = t.user_id
       ORDER BY t.id DESC`
    );
  }

  /**
   * 统计（仪表盘/个人）
   */
  async stats(userId) {
    const rows = await query(
      `SELECT status, COUNT(*) AS cnt FROM tasks WHERE user_id = ? GROUP BY status`,
      [userId]
    );
    const map = { todo: 0, doing: 0, done: 0 };
    rows.forEach((r) => (map[r.status] = r.cnt));
    const [dueRow] = await query(
      `SELECT COUNT(*) AS cnt FROM tasks
       WHERE user_id = ? AND status <> 'done' AND due_date IS NOT NULL AND due_date < NOW()`,
      [userId]
    );
    return { ...map, overdue: dueRow.cnt };
  }
}

module.exports = new TaskService();
