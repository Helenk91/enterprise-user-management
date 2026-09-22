/**
 * 日志控制器：分页查询操作日志
 */
const { query } = require('../db');
const ApiResponse = require('../utils/response');

class LogController {
  /**
   * GET /api/logs?page=&pageSize=&action=&keyword=
   */
  async list(req, res, next) {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);
      const action = (req.query.action || '').trim();
      const keyword = (req.query.keyword || '').trim();

      let where = ' WHERE 1=1';
      const params = [];
      if (action) {
        where += ' AND action = ?';
        params.push(action);
      }
      if (keyword) {
        where += ' AND (detail LIKE ? OR user_name LIKE ?)';
        const like = `%${keyword}%`;
        params.push(like, like);
      }

      const [countRow] = await query(`SELECT COUNT(*) AS total FROM logs${where}`, params);
      const total = countRow.total;
      const list = await query(
        `SELECT id, action, method, path, detail, user_name, ip, created_at
         FROM logs${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, pageSize, (page - 1) * pageSize]
      );

      return ApiResponse.success(res, { list, total, page, pageSize });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LogController();
