/**
 * 数据字典服务
 */
const { query, queryOne } = require('../db');

class DictService {
  /**
   * 字典类型列表（带项数量）
   */
  async types({ keyword = '' }) {
    let sql = `SELECT t.*, (SELECT COUNT(*) FROM dict_items i WHERE i.type_code = t.type_code) AS item_count
               FROM dict_types t`;
    const params = [];
    if (keyword) {
      sql += ' WHERE type_code LIKE ? OR type_name LIKE ?';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    sql += ' ORDER BY t.id';
    return query(sql, params);
  }

  /**
   * 类型详情
   */
  async typeByCode(typeCode) {
    return queryOne('SELECT * FROM dict_types WHERE type_code = ?', [typeCode]);
  }

  /**
   * 创建类型
   */
  async createType(data) {
    const result = await query('INSERT INTO dict_types (type_code, type_name, remark) VALUES (?, ?, ?)', [
      data.typeCode,
      data.typeName,
      data.remark || null,
    ]);
    return queryOne('SELECT * FROM dict_types WHERE id = ?', [result.insertId]);
  }

  /**
   * 更新类型
   */
  async updateType(id, data) {
    await query('UPDATE dict_types SET type_code = ?, type_name = ?, remark = ? WHERE id = ?', [
      data.typeCode,
      data.typeName,
      data.remark || null,
      id,
    ]);
    return queryOne('SELECT * FROM dict_types WHERE id = ?', [id]);
  }

  /**
   * 删除类型（级联删项）
   */
  async removeType(id) {
    const t = await queryOne('SELECT type_code FROM dict_types WHERE id = ?', [id]);
    if (t) await query('DELETE FROM dict_items WHERE type_code = ?', [t.type_code]);
    const result = await query('DELETE FROM dict_types WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * 某类型下的字典项
   */
  async items(typeCode) {
    return query('SELECT * FROM dict_items WHERE type_code = ? ORDER BY sort, id', [typeCode]);
  }

  /**
   * 创建字典项
   */
  async createItem(data) {
    const result = await query(
      'INSERT INTO dict_items (type_code, label, value, sort, status) VALUES (?, ?, ?, ?, ?)',
      [data.typeCode, data.label, data.value, Number(data.sort) || 0, data.status || 'active']
    );
    return queryOne('SELECT * FROM dict_items WHERE id = ?', [result.insertId]);
  }

  /**
   * 更新字典项
   */
  async updateItem(id, data) {
    await query('UPDATE dict_items SET label = ?, value = ?, sort = ?, status = ? WHERE id = ?', [
      data.label,
      data.value,
      Number(data.sort) || 0,
      data.status || 'active',
      id,
    ]);
    return queryOne('SELECT * FROM dict_items WHERE id = ?', [id]);
  }

  async removeItem(id) {
    const result = await query('DELETE FROM dict_items WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new DictService();
