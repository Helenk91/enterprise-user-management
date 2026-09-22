/**
 * 日志工具
 * - 控制台输出
 * - 异步写入 logs 表（失败不阻塞主流程）
 */
const { query } = require('../db');

const logger = {
  info(message, meta = {}) {
    console.log(`[INFO]  ${new Date().toLocaleString()}  ${message}`, meta);
  },

  error(message, meta = {}) {
    console.error(`[ERROR] ${new Date().toLocaleString()}  ${message}`, meta);
  },

  /**
   * 记录操作日志（写入数据库 logs 表）
   * @param {object} entry { action, method, path, detail, userName, ip }
   */
  async logToDb(entry) {
    try {
      await query(
        `INSERT INTO logs (action, method, path, detail, user_name, ip)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          entry.action || '',
          entry.method || '',
          entry.path || '',
          entry.detail || '',
          entry.userName || 'anonymous',
          entry.ip || '',
        ]
      );
    } catch (err) {
      // 日志写入失败不影响业务
      console.error('[LOG_DB_ERROR]', err.message);
    }
  },
};

module.exports = logger;
