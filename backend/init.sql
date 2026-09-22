-- ============================================================
-- 用户管理系统数据库初始化脚本
-- 用法: mysql -u root -p < init.sql
-- 然后执行: node seed.js  (生成演示数据)
-- ============================================================

CREATE DATABASE IF NOT EXISTS userdb DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE userdb;

-- ---------- 用户表 ----------
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  name          VARCHAR(50)  NOT NULL                COMMENT '姓名',
  email         VARCHAR(100) NOT NULL                COMMENT '邮箱（唯一）',
  phone         VARCHAR(20)  DEFAULT NULL            COMMENT '手机号',
  password      VARCHAR(100) NOT NULL                COMMENT '密码（bcrypt 哈希）',
  role          ENUM('admin','user') NOT NULL DEFAULT 'user' COMMENT '角色',
  status        ENUM('active','disabled') NOT NULL DEFAULT 'active' COMMENT '账号状态',
  last_login_at DATETIME     DEFAULT NULL            COMMENT '最后登录时间',
  last_login_ip VARCHAR(45)  DEFAULT NULL            COMMENT '最后登录 IP',
  failed_attempts INT        NOT NULL DEFAULT 0      COMMENT '连续登录失败次数',
  locked_until   DATETIME    DEFAULT NULL            COMMENT '账号锁定截止时间',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_email (email),
  KEY idx_name (name),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ---------- 操作日志表 ----------
DROP TABLE IF EXISTS logs;
CREATE TABLE logs (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  action     VARCHAR(50)  NOT NULL                COMMENT '操作类型',
  method     VARCHAR(10)  DEFAULT NULL            COMMENT 'HTTP 方法',
  path       VARCHAR(200) DEFAULT NULL            COMMENT '请求路径',
  detail     VARCHAR(500) DEFAULT NULL            COMMENT '操作详情',
  user_name  VARCHAR(50)  DEFAULT NULL            COMMENT '操作人',
  ip         VARCHAR(50)  DEFAULT NULL            COMMENT '来源 IP',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (id),
  KEY idx_action (action),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ---------- 初始化信息 ----------
SELECT 'Database userdb initialized' AS message;
