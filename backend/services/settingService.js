/**
 * 系统配置服务
 */
const { query, queryOne } = require('../db');

class SettingService {
  /**
   * 全部配置
   */
  async all() {
    return query('SELECT * FROM settings ORDER BY id');
  }

  /**
   * 按 key 获取
   */
  async get(key) {
    const row = await queryOne('SELECT config_value FROM settings WHERE config_key = ?', [key]);
    return row ? row.config_value : null;
  }

  /**
   * 更新
   */
  async set(key, value, description) {
    const exist = await queryOne('SELECT id FROM settings WHERE config_key = ?', [key]);
    if (exist) {
      await query('UPDATE settings SET config_value = ?, description = COALESCE(?, description) WHERE id = ?', [
        value,
        description || null,
        exist.id,
      ]);
    } else {
      await query('INSERT INTO settings (config_key, config_value, description) VALUES (?, ?, ?)', [
        key,
        value,
        description || null,
      ]);
    }
    return queryOne('SELECT * FROM settings WHERE config_key = ?', [key]);
  }

  /**
   * 删除
   */
  async remove(id) {
    const result = await query('DELETE FROM settings WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new SettingService();
