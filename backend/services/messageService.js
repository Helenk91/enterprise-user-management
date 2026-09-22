/**
 * 站内消息服务
 */
const { query, queryOne } = require('../db');

class MessageService {
  /**
   * 分页列表
   */
  async list(userId, { page = 1, pageSize = 10, isRead = '' }) {
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 100);
    let where = ' WHERE to_user_id = ?';
    const params = [userId];
    if (isRead === '0' || isRead === '1') {
      where += ' AND is_read = ?';
      params.push(Number(isRead));
    }
    const [countRow] = await query(`SELECT COUNT(*) AS total FROM messages${where}`, params);
    const total = countRow.total;
    const list = await query(
      `SELECT id, from_user, title, content, type, is_read, created_at
       FROM messages${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, ps, (p - 1) * ps]
    );
    return { list, total, page: p, pageSize: ps };
  }

  /**
   * 未读数
   */
  async unreadCount(userId) {
    const [row] = await query(
      'SELECT COUNT(*) AS cnt FROM messages WHERE to_user_id = ? AND is_read = 0',
      [userId]
    );
    return row.cnt;
  }

  /**
   * 标记已读
   */
  async markRead(id, userId) {
    await query('UPDATE messages SET is_read = 1, read_at = NOW() WHERE id = ? AND to_user_id = ?', [
      id,
      userId,
    ]);
    return true;
  }

  /**
   * 全部已读
   */
  async markAllRead(userId) {
    await query('UPDATE messages SET is_read = 1, read_at = NOW() WHERE to_user_id = ? AND is_read = 0', [
      userId,
    ]);
    return true;
  }

  /**
   * 发送系统消息
   */
  async send({ toUserId, fromUser = '系统', title, content, type = 'system' }) {
    const result = await query(
      'INSERT INTO messages (to_user_id, from_user, title, content, type) VALUES (?, ?, ?, ?, ?)',
      [toUserId, fromUser, title, content, type]
    );
    return queryOne('SELECT * FROM messages WHERE id = ?', [result.insertId]);
  }

  /**
   * 删除
   */
  async remove(id, userId) {
    const result = await query('DELETE FROM messages WHERE id = ? AND to_user_id = ?', [id, userId]);
    return result.affectedRows > 0;
  }
}

module.exports = new MessageService();
