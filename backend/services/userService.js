/**
 * 用户业务服务
 * 封装用户相关的数据访问与业务规则
 */
const { query, queryOne } = require('../db');
const bcrypt = require('bcryptjs');
const config = require('../config');

const USER_FIELDS =
  'id, name, email, phone, role, status, gender, department, region, bio, last_login_at, last_login_ip, created_at, updated_at';

class UserService {
  /**
   * 分页 + 关键词搜索
   */
  async list({ keyword = '', page = 1, pageSize = 10 }) {
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 100);

    let where = '';
    const params = [];
    if (keyword.trim()) {
      where = ' WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
      const like = `%${keyword.trim()}%`;
      params.push(like, like, like);
    }

    const [countRow] = await query(
      `SELECT COUNT(*) AS total FROM users${where}`,
      params
    );
    const total = countRow.total;

    const list = await query(
      `SELECT ${USER_FIELDS} FROM users${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, ps, (p - 1) * ps]
    );

    return { list, total, page: p, pageSize: ps };
  }

  /**
   * 按 ID 查询
   */
  async findById(id) {
    return queryOne(`SELECT ${USER_FIELDS} FROM users WHERE id = ?`, [id]);
  }

  /**
   * 按邮箱查询（含密码与锁定字段，仅内部使用）
   */
  async findByEmailWithPassword(email) {
    return queryOne(
      'SELECT id, name, email, password, role, status, failed_attempts, locked_until FROM users WHERE email = ?',
      [email]
    );
  }

  /**
   * 创建用户
   */
  async create({ name, email, phone = '', password, role = 'user', gender = '', department = '', region = '', bio = '' }) {
    const hash = await bcrypt.hash(password, 10);
    const safeGender = ['male', 'female', 'unknown'].includes(gender) ? gender : 'unknown';
    const result = await query(
      'INSERT INTO users (name, email, phone, password, role, gender, department, region, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name.trim(), email.trim(), phone.trim(), hash, role, safeGender, department, region, bio]
    );
    return this.findById(result.insertId);
  }

  /**
   * 更新用户资料
   */
  async update(id, { name, email, phone, role, status, gender, department, region, bio }) {
    const safeGender = ['male', 'female', 'unknown'].includes(gender) ? gender : 'unknown';
    await query(
      'UPDATE users SET name = ?, email = ?, phone = ?, role = ?, status = ?, gender = ?, department = ?, region = ?, bio = ? WHERE id = ?',
      [
        name.trim(),
        email.trim(),
        (phone || '').trim(),
        role,
        status,
        safeGender,
        department || '',
        region || '',
        bio || '',
        id,
      ]
    );
    return this.findById(id);
  }

  /**
   * 删除用户
   */
  async remove(id) {
    const result = await query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * 批量删除
   */
  async removeMany(ids) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const result = await query(`DELETE FROM users WHERE id IN (${placeholders})`, ids);
    return result.affectedRows;
  }

  /**
   * 更新最后登录信息（时间 + IP），并重置连续失败计数
   */
  async touchLogin(id, ip = '') {
    await query(
      'UPDATE users SET last_login_at = NOW(), last_login_ip = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?',
      [ip || null, id]
    );
  }

  /**
   * 记录一次登录失败；连续失败达到阈值时锁定账号
   * @returns {object} { locked, lockMinutes } 本次是否触发锁定
   */
  async recordFailedAttempt(id) {
    await query(
      'UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = ?',
      [id]
    );
    // 查询最新计数
    const [cur] = await query(
      'SELECT failed_attempts FROM users WHERE id = ?',
      [id]
    );
    const count = cur.failed_attempts;
    if (count >= config.login.maxFailures) {
      await query(
        'UPDATE users SET locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE), failed_attempts = 0 WHERE id = ?',
        [config.login.lockMinutes, id]
      );
      return { locked: true, lockMinutes: config.login.lockMinutes };
    }
    return { locked: false };
  }

  /**
   * 账号是否处于锁定期
   */
  async isLocked(id) {
    const row = await queryOne(
      'SELECT locked_until FROM users WHERE id = ? AND locked_until > NOW()',
      [id]
    );
    return !!row;
  }

  /**
   * 修改密码
   */
  async changePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE users SET password = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?',
      [hash, id]
    );
    return true;
  }

  /**
   * 邮箱是否已被占用
   */
  async emailExists(email, excludeId) {
    const row = excludeId
      ? await queryOne('SELECT id FROM users WHERE email = ? AND id <> ?', [email, excludeId])
      : await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    return !!row;
  }

  /**
   * 批量导入用户（返回成功/失败统计）
   * rows: [{ name, email, phone, password, department, region, role }]
   */
  async bulkCreate(rows) {
    let success = 0;
    const failures = [];
    for (const row of rows) {
      try {
        if (!row.name || !row.email || !row.password) {
          failures.push(`${row.email || row.name || '未知行'}：缺少必填字段`);
          continue;
        }
        if (await this.emailExists(row.email)) {
          failures.push(`${row.email}：邮箱已存在`);
          continue;
        }
        await this.create({
          name: row.name,
          email: row.email,
          phone: row.phone || '',
          password: row.password,
          role: row.role === 'admin' ? 'admin' : 'user',
          gender: row.gender || '',
          department: row.department || '',
          region: row.region || '',
        });
        success++;
      } catch (err) {
        failures.push(`${row.email || '未知'}: ${err.message}`);
      }
    }
    return { success, failures };
  }

  /**
   * 批量更新状态
   */
  async bulkStatus(ids, status) {
    if (!ids.length) return 0;
    const placeholders = ids.map(() => '?').join(',');
    const result = await query(
      `UPDATE users SET status = ? WHERE id IN (${placeholders})`,
      [status, ...ids]
    );
    return result.affectedRows;
  }

  /**
   * 管理员重置用户密码
   */
  async resetPassword(id, newPassword) {
    return this.changePassword(id, newPassword);
  }
}

module.exports = new UserService();
