/**
 * 通知公告服务
 */
const { query, queryOne } = require('../db');

class NoticeService {
  /**
   * 分页查询（published 供普通用户，全部供管理）
   */
  async list({ page = 1, pageSize = 10, keyword = '', status = '', type = '' }) {
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 100);
    let where = ' WHERE 1=1';
    const params = [];
    if (keyword) {
      where += ' AND (title LIKE ? OR content LIKE ?)';
      const like = `%${keyword}%`;
      params.push(like, like);
    }
    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      where += ' AND type = ?';
      params.push(type);
    }
    const [countRow] = await query(`SELECT COUNT(*) AS total FROM notices${where}`, params);
    const total = countRow.total;
    const list = await query(
      `SELECT id, title, type, status, author, published_at, created_at
       FROM notices${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, ps, (p - 1) * ps]
    );
    return { list, total, page: p, pageSize: ps };
  }

  /**
   * 详情（content 单独返回）
   */
  async findById(id) {
    return queryOne(
      `SELECT id, title, content, type, status, author, published_at, created_at
       FROM notices WHERE id = ?`,
      [id]
    );
  }

  /**
   * 创建
   */
  async create(data) {
    const result = await query(
      `INSERT INTO notices (title, content, type, status, author, published_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.content || '',
        data.type || 'notice',
        data.status || 'published',
        data.author || '系统',
        data.status === 'published' ? new Date() : null,
      ]
    );
    return this.findById(result.insertId);
  }

  /**
   * 更新
   */
  async update(id, data) {
    await query(
      `UPDATE notices SET title = ?, content = ?, type = ?, status = ?,
       published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN NOW() ELSE published_at END
       WHERE id = ?`,
      [data.title, data.content || '', data.type || 'notice', data.status || 'published', data.status, id]
    );
    return this.findById(id);
  }

  /**
   * 删除
   */
  async remove(id) {
    const result = await query('DELETE FROM notices WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * 首页最新公告（用户端）
   */
  async latest(limit = 5) {
    return query(
      `SELECT id, title, type, published_at FROM notices
       WHERE status = 'published' ORDER BY published_at DESC LIMIT ?`,
      [limit]
    );
  }
}

module.exports = new NoticeService();
