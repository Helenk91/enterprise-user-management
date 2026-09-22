/**
 * JWT 工具：签发与校验（带 jti 唯一标识，用于黑名单）
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

const jwtUtil = {
  /**
   * 签发 token
   * @param {object} payload 载荷（通常为 { id, name, role }）
   */
  sign(payload) {
    return jwt.sign(
      { ...payload, jti: crypto.randomUUID() },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  },

  /**
   * 校验 token，成功返回载荷（含 jti），失败返回 null
   */
  verify(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (err) {
      return null;
    }
  },

  /**
   * 从 Authorization: Bearer <token> 中解析 token
   */
  extract(req) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      return header.slice(7);
    }
    return null;
  },
};

module.exports = jwtUtil;
