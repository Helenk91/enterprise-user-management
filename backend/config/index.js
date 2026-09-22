/**
 * 应用统一配置
 * 集中管理端口、数据库、JWT 等配置项，避免散落各处
 */
require('dotenv').config();

const config = {
  server: {
    port: Number(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'userdb',
    connectionLimit: 10,
    charset: 'utf8mb4',
    timezone: '+08:00',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    blacklistTtlMs: 3 * 60 * 60 * 1000, // 黑名单最长保留 3 小时
  },
  rateLimit: {
    windowMs: 60 * 1000, // 1 分钟窗口
    max: 600,            // 每窗口最多请求数（企业级：支持全站自测与高频操作）
  },
  login: {
    windowMs: 60 * 1000,  // 登录限流窗口
    max: 10,              // 每分钟最多尝试 10 次
    maxFailures: 5,       // 连续失败 N 次锁定
    lockMinutes: 15,      // 锁定时长
  },
};

module.exports = config;
