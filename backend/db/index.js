/**
 * MySQL 连接池（mysql2 promise API）
 */
const mysql = require('mysql2/promise');
const config = require('../config');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  charset: config.db.charset,
  timezone: config.db.timezone,
  dateStrings: true, // DATETIME 原样返回字符串，避免时区偏移导致日期错位
});

/**
 * 通用查询辅助：自动解构 [rows]
 */
async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * 单行查询
 */
async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

module.exports = { pool, query, queryOne };
