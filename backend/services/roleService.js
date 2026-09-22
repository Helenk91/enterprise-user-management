/**
 * 角色与权限服务（RBAC）
 */
const { query, queryOne } = require('../db');

class RoleService {
  /**
   * 角色列表
   */
  async list() {
    return query(
      `SELECT r.*, (SELECT COUNT(*) FROM role_permissions rp WHERE rp.role_id = r.id) AS perm_count
       FROM roles r ORDER BY r.id`
    );
  }

  /**
   * 创建角色
   */
  async create(data) {
    const result = await query(
      'INSERT INTO roles (role_code, role_name, description) VALUES (?, ?, ?)',
      [data.roleCode, data.roleName, data.description || null]
    );
    return queryOne('SELECT * FROM roles WHERE id = ?', [result.insertId]);
  }

  /**
   * 更新角色
   */
  async update(id, data) {
    await query('UPDATE roles SET role_code = ?, role_name = ?, description = ?, status = ? WHERE id = ?', [
      data.roleCode,
      data.roleName,
      data.description || null,
      data.status || 'active',
      id,
    ]);
    return queryOne('SELECT * FROM roles WHERE id = ?', [id]);
  }

  async remove(id) {
    await query('DELETE FROM role_permissions WHERE role_id = ?', [id]);
    const result = await query('DELETE FROM roles WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * 权限点清单（按模块分组）
   */
  async permissions() {
    const rows = await query('SELECT * FROM permissions ORDER BY id');
    const groups = {};
    rows.forEach((p) => {
      const mod = p.module || '其他';
      (groups[mod] = groups[mod] || []).push(p);
    });
    return groups;
  }

  /**
   * 角色已分配权限
   */
  async rolePermIds(roleId) {
    const rows = await query('SELECT perm_id FROM role_permissions WHERE role_id = ?', [roleId]);
    return rows.map((r) => r.perm_id);
  }

  /**
   * 分配权限
   */
  async assignPerms(roleId, permIds) {
    await query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
    const ids = [...new Set((permIds || []).map(Number).filter((n) => n > 0))];
    for (const pid of ids) {
      await query('INSERT INTO role_permissions (role_id, perm_id) VALUES (?, ?)', [roleId, pid]);
    }
    return ids.length;
  }

  /**
   * 用户角色映射（users.role 关联 roles 表）
   */
  async userRoleCodes() {
    return query('SELECT id, role_code, role_name FROM roles');
  }
}

module.exports = new RoleService();
