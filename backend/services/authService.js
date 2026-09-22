/**
 * 认证服务：注册 / 登录（含账号锁定）/ 修改密码
 */
const bcrypt = require('bcryptjs');
const userService = require('./userService');
const jwtUtil = require('../utils/jwt');
const config = require('../config');

class AuthService {
  /**
   * 注册新用户（首个用户自动成为 admin）
   */
  async register({ name, email, password, phone = '' }) {
    const exists = await userService.emailExists(email);
    if (exists) {
      const err = new Error('该邮箱已被注册');
      err.code = 'EMAIL_EXISTS';
      throw err;
    }

    const total = (await userService.list({ pageSize: 1 })).total;
    const role = total === 0 ? 'admin' : 'user';

    const user = await userService.create({ name, email, phone, password, role });
    const token = jwtUtil.sign({ id: user.id, name: user.name, role: user.role });

    return { user, token };
  }

  /**
   * 登录（连续失败锁定）
   */
  async login({ email, password, ip = '' }) {
    const user = await userService.findByEmailWithPassword(email);
    if (!user) {
      // 统一错误信息，不暴露账号是否存在
      const err = new Error('邮箱或密码错误');
      err.code = 'BAD_CREDENTIALS';
      throw err;
    }

    // 账号锁定检查
    if (await userService.isLocked(user.id)) {
      const err = new Error(`登录失败次数过多，账号已锁定，请 ${config.login.lockMinutes} 分钟后再试`);
      err.code = 'ACCOUNT_LOCKED';
      throw err;
    }

    if (user.status !== 'active') {
      const err = new Error('该账号已被禁用');
      err.code = 'ACCOUNT_DISABLED';
      throw err;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      // 记录失败次数，达到阈值自动锁定
      const result = await userService.recordFailedAttempt(user.id);
      if (result.locked) {
        const err = new Error(`密码错误次数过多，账号已锁定，请 ${result.lockMinutes} 分钟后再试`);
        err.code = 'ACCOUNT_LOCKED';
        throw err;
      }
      const err = new Error('邮箱或密码错误');
      err.code = 'BAD_CREDENTIALS';
      throw err;
    }

    // 登录成功：更新登录信息并重置计数
    await userService.touchLogin(user.id, ip);

    const token = jwtUtil.sign({ id: user.id, name: user.name, role: user.role });
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return { user: safeUser, token };
  }

  /**
   * 修改密码：验证旧密码 -> 更新新密码
   * 更新后旧 token 通过黑名单全部失效（由调用方处理当前 token）
   */
  async changePassword(id, { oldPassword, newPassword }) {
    const user = await userService.findById(id);
    if (!user) {
      const err = new Error('用户不存在');
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    // 通过邮箱+密码查询校验旧密码
    const withPwd = await userService.findByEmailWithPassword(user.email);
    const ok = await bcrypt.compare(oldPassword, withPwd.password);
    if (!ok) {
      const err = new Error('原密码不正确');
      err.code = 'OLD_PASSWORD_WRONG';
      throw err;
    }

    await userService.changePassword(id, newPassword);
    return true;
  }
}

module.exports = new AuthService();
