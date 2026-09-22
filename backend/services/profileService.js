/**
 * 个人资料服务
 */
const { query, queryOne } = require('../db');

class ProfileService {
  /**
   * 获取完整资料
   */
  async getProfile(id) {
    return queryOne(
      `SELECT id, name, email, phone, role, status, gender, birthday, avatar,
              department, region, bio, last_login_at, last_login_ip, created_at
       FROM users WHERE id = ?`,
      [id]
    );
  }

  /**
   * 更新资料（姓名/手机号/性别/生日/部门/地区/简介）
   */
  async updateProfile(id, data) {
    const name = (data.name || '').trim();
    await query(
      `UPDATE users SET
         name = COALESCE(NULLIF(?, ''), name),
         phone = ?,
         gender = ?,
         birthday = ?,
         department = ?,
         region = ?,
         bio = ?
       WHERE id = ?`,
      [
        name,
        data.phone || null,
        data.gender || 'unknown',
        data.birthday || null,
        data.department || null,
        data.region || null,
        data.bio || null,
        id,
      ]
    );
    return this.getProfile(id);
  }

  /**
   * 更新头像
   */
  async updateAvatar(id, avatar) {
    await query('UPDATE users SET avatar = ? WHERE id = ?', [avatar || null, id]);
    return this.getProfile(id);
  }

  /**
   * 部门分布统计（仪表盘）
   */
  async departmentStats() {
    return query(
      `SELECT COALESCE(NULLIF(department, ''), '未设置') AS name, COUNT(*) AS value
       FROM users GROUP BY department ORDER BY value DESC`
    );
  }

  /**
   * 地区分布统计（仪表盘）
   */
  async regionStats() {
    return query(
      `SELECT COALESCE(NULLIF(region, ''), '未知') AS name, COUNT(*) AS value
       FROM users GROUP BY region ORDER BY value DESC LIMIT 10`
    );
  }

  /**
   * 性别分布统计
   */
  async genderStats() {
    return query(
      `SELECT gender AS name, COUNT(*) AS value FROM users GROUP BY gender`
    );
  }
}

module.exports = new ProfileService();
