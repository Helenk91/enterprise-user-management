/**
 * 菜单管理服务
 */
const { query, queryOne } = require('../db');

class MenuService {
  /**
   * 菜单树（按父级分组）
   */
  async tree() {
    const rows = await query('SELECT * FROM menus ORDER BY sort, id');
    const map = {};
    rows.forEach((m) => (map[m.id] = { ...m, children: [] }));
    const tree = [];
    rows.forEach((m) => {
      if (m.parent_id && map[m.parent_id]) map[m.parent_id].children.push(map[m.id]);
      else tree.push(map[m.id]);
    });
    return tree;
  }

  /**
   * 全部菜单（扁平，带父级名）
   */
  async flat() {
    const rows = await query(
      `SELECT m.*, p.name AS parent_name FROM menus m
       LEFT JOIN menus p ON p.id = m.parent_id ORDER BY m.sort, m.id`
    );
    return rows;
  }

  async create(data) {
    const result = await query(
      'INSERT INTO menus (name, path, icon, parent_id, sort, visible) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.path || null, data.icon || null, Number(data.parentId) || 0, Number(data.sort) || 0, data.visible === false ? 0 : 1]
    );
    return queryOne('SELECT * FROM menus WHERE id = ?', [result.insertId]);
  }

  async update(id, data) {
    await query(
      'UPDATE menus SET name = ?, path = ?, icon = ?, parent_id = ?, sort = ?, visible = ? WHERE id = ?',
      [
        data.name,
        data.path || null,
        data.icon || null,
        Number(data.parentId) || 0,
        Number(data.sort) || 0,
        data.visible === false ? 0 : 1,
        id,
      ]
    );
    return queryOne('SELECT * FROM menus WHERE id = ?', [id]);
  }

  async remove(id) {
    await query('UPDATE menus SET parent_id = 0 WHERE parent_id = ?', [id]);
    const result = await query('DELETE FROM menus WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new MenuService();
