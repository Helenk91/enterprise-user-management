/**
 * 种子数据脚本
 * 用法: node seed.js
 * 生成：管理员账号 + 若干演示用户 + 演示日志
 * 默认管理员: admin@example.com / admin123
 */
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  charset: config.db.charset,
});

const DEMO_USERS = [
  { name: '系统管理员', email: 'admin@example.com', phone: '13800000001', role: 'admin' },
  { name: '张伟', email: 'zhangwei@example.com', phone: '13800000002', role: 'user' },
  { name: '李娜', email: 'lina@example.com', phone: '13800000003', role: 'user' },
  { name: '王强', email: 'wangqiang@example.com', phone: '13800000004', role: 'user' },
  { name: '赵敏', email: 'zhaomin@example.com', phone: '13800000005', role: 'user' },
  { name: '陈杰', email: 'chenjie@example.com', phone: '13800000006', role: 'user' },
  { name: '刘洋', email: 'liuyang@example.com', phone: '13800000007', role: 'user' },
  { name: '杨静', email: 'yangjing@example.com', phone: '13800000008', role: 'user' },
  { name: '黄磊', email: 'huanglei@example.com', phone: '13800000009', role: 'user' },
  { name: '周婷', email: 'zhouting@example.com', phone: '13800000010', role: 'user' },
  { name: '吴昊', email: 'wuhao@example.com', phone: '13800000011', role: 'user' },
  { name: '徐丽', email: 'xuli@example.com', phone: '13800000012', role: 'user' },
];

async function seed() {
  console.log('开始生成种子数据...');

  const hash = await bcrypt.hash('admin123', 10);

  // 清空旧数据
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE logs');
  await pool.query('DELETE FROM users');
  await pool.query('ALTER TABLE users AUTO_INCREMENT = 1');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  // 插入用户（密码统一 admin123，仅演示）
  const inserted = [];
  for (const [i, u] of DEMO_USERS.entries()) {
    const createdDaysAgo = i * 3 % 10; // 让 created_at 分散在过去几天，便于图表展示
    const [result] = await pool.query(
      `INSERT INTO users (name, email, phone, password, role, status, last_login_at, created_at)
       VALUES (?, ?, ?, ?, ?, 'active', NOW() - INTERVAL ? HOUR, NOW() - INTERVAL ? DAY)`,
      [u.name, u.email, u.phone, hash, u.role, i, createdDaysAgo]
    );
    inserted.push(result.insertId);
  }

  // 演示日志
  const demoLogs = [
    ['LOGIN', 'POST', '/api/auth/login', '用户登录：系统管理员', '系统管理员', '127.0.0.1'],
    ['USER_CREATE', 'POST', '/api/users', '创建用户：张伟（zhangwei@example.com）', '系统管理员', '127.0.0.1'],
    ['USER_UPDATE', 'PUT', '/api/users/3', '修改用户：王强', '系统管理员', '127.0.0.1'],
    ['USER_DELETE', 'DELETE', '/api/users/9', '删除用户 ID=9', '系统管理员', '127.0.0.1'],
    ['LOGIN', 'POST', '/api/auth/login', '用户登录：李娜', '李娜', '127.0.0.1'],
    ['USER_BATCH_DELETE', 'POST', '/api/users/batch-delete', '批量删除 2 个用户', '系统管理员', '127.0.0.1'],
  ];
  for (const [action, method, path, detail, userName, ip] of demoLogs) {
    await pool.query(
      `INSERT INTO logs (action, method, path, detail, user_name, ip, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW() - INTERVAL ? MINUTE)`,
      [action, method, path, detail, userName, ip, Math.floor(Math.random() * 120)]
    );
  }

  console.log(`✔ 用户 ${inserted.length} 个`);
  console.log('✔ 管理员账号: admin@example.com / admin123');
  console.log('✔ 日志 6 条');
  console.log('种子数据完成');
  await pool.end();
}

seed().catch((err) => {
  console.error('种子数据生成失败:', err);
  process.exit(1);
});
