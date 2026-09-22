-- ============================================================
-- 用户管理系统 企业版数据库增量迁移脚本
-- 对已存在的 userdb 执行增量升级（新增表 + 扩展字段）
-- ============================================================

USE userdb;

-- ---------- 1. 用户表扩展字段 ----------
ALTER TABLE users
  ADD COLUMN gender ENUM('male','female','unknown') NOT NULL DEFAULT 'unknown' COMMENT '性别',
  ADD COLUMN birthday DATE DEFAULT NULL COMMENT '生日',
  ADD COLUMN avatar VARCHAR(200) DEFAULT NULL COMMENT '头像URL',
  ADD COLUMN department VARCHAR(50) DEFAULT NULL COMMENT '部门',
  ADD COLUMN region VARCHAR(50) DEFAULT NULL COMMENT '所在地区',
  ADD COLUMN bio VARCHAR(200) DEFAULT NULL COMMENT '个性签名';

-- ---------- 2. 登录历史 ----------
CREATE TABLE IF NOT EXISTS login_history (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  email       VARCHAR(100) DEFAULT NULL,
  ip          VARCHAR(50)  DEFAULT NULL,
  user_agent  VARCHAR(300) DEFAULT NULL,
  device      VARCHAR(50)  DEFAULT NULL COMMENT '设备类型',
  location    VARCHAR(100) DEFAULT NULL COMMENT '归属地',
  status      VARCHAR(20)  DEFAULT 'success' COMMENT 'success/failed',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user (user_id),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录历史表';

-- ---------- 3. 在线会话 ----------
CREATE TABLE IF NOT EXISTS sessions (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  jti           VARCHAR(64)  NOT NULL COMMENT '令牌唯一标识',
  ip            VARCHAR(50)  DEFAULT NULL,
  user_agent    VARCHAR(300) DEFAULT NULL,
  device        VARCHAR(50)  DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_jti (jti),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='在线会话表';

-- ---------- 4. 通知公告 ----------
CREATE TABLE IF NOT EXISTS notices (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(200) NOT NULL,
  content     TEXT,
  type        VARCHAR(20)  DEFAULT 'notice' COMMENT 'notice/announcement',
  status      VARCHAR(20)  DEFAULT 'published' COMMENT 'draft/published',
  author      VARCHAR(50)  DEFAULT NULL,
  published_at DATETIME    DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知公告表';

-- ---------- 5. 待办任务 ----------
CREATE TABLE IF NOT EXISTS tasks (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  priority    ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  status      ENUM('todo','doing','done') NOT NULL DEFAULT 'todo',
  due_date    DATETIME DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='待办任务表';

-- ---------- 6. 站内消息 ----------
CREATE TABLE IF NOT EXISTS messages (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  to_user_id  INT UNSIGNED NOT NULL,
  from_user   VARCHAR(50)  DEFAULT NULL,
  title       VARCHAR(200) NOT NULL,
  content     VARCHAR(500) DEFAULT NULL,
  type        VARCHAR(20)  DEFAULT 'system',
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  read_at     DATETIME DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_to_read (to_user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='站内消息表';

-- ---------- 7. 文件管理（虚拟） ----------
CREATE TABLE IF NOT EXISTS folders (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  parent_id   INT UNSIGNED NOT NULL DEFAULT 0,
  owner_id    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0=公共',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件夹表';

CREATE TABLE IF NOT EXISTS files (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(200) NOT NULL,
  size        BIGINT NOT NULL DEFAULT 0 COMMENT '字节',
  type        VARCHAR(30)  DEFAULT 'file' COMMENT 'file/image/doc/video',
  ext         VARCHAR(10)  DEFAULT NULL,
  folder_id   INT UNSIGNED NOT NULL DEFAULT 0,
  owner_id    INT UNSIGNED NOT NULL DEFAULT 0,
  downloads   INT UNSIGNED NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_folder (folder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件表';

-- ---------- 8. 数据字典 ----------
CREATE TABLE IF NOT EXISTS dict_types (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type_code   VARCHAR(50)  NOT NULL,
  type_name   VARCHAR(100) NOT NULL,
  remark      VARCHAR(200) DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_type (type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典类型表';

CREATE TABLE IF NOT EXISTS dict_items (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type_code   VARCHAR(50)  NOT NULL,
  label       VARCHAR(100) NOT NULL,
  value       VARCHAR(100) NOT NULL,
  sort        INT NOT NULL DEFAULT 0,
  status      VARCHAR(20)  DEFAULT 'active',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_type (type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='字典项表';

-- ---------- 9. 角色与权限（RBAC 简版） ----------
CREATE TABLE IF NOT EXISTS roles (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_code   VARCHAR(50)  NOT NULL,
  role_name   VARCHAR(100) NOT NULL,
  description VARCHAR(200) DEFAULT NULL,
  status      VARCHAR(20)  DEFAULT 'active',
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

CREATE TABLE IF NOT EXISTS permissions (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  perm_code   VARCHAR(50)  NOT NULL,
  perm_name   VARCHAR(100) NOT NULL,
  module      VARCHAR(50)  DEFAULT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_perm (perm_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限点表';

CREATE TABLE IF NOT EXISTS role_permissions (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id     INT UNSIGNED NOT NULL,
  perm_id     INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_rp (role_id, perm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- ---------- 10. 菜单管理 ----------
CREATE TABLE IF NOT EXISTS menus (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  path        VARCHAR(200) DEFAULT NULL,
  icon        VARCHAR(30)  DEFAULT NULL,
  parent_id   INT UNSIGNED NOT NULL DEFAULT 0,
  sort        INT NOT NULL DEFAULT 0,
  visible     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单表';

-- ---------- 11. 系统配置 ----------
CREATE TABLE IF NOT EXISTS settings (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  config_key   VARCHAR(100) NOT NULL,
  config_value VARCHAR(500) DEFAULT NULL,
  description  VARCHAR(200) DEFAULT NULL,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ---------- 12. 默认数据 ----------
INSERT IGNORE INTO settings (config_key, config_value, description) VALUES
  ('site.name', '用户管理系统', '站点名称'),
  ('site.notice', '欢迎使用用户管理系统企业版', '首页公告'),
  ('security.login.lock', '5', '连续失败锁定次数'),
  ('security.login.lockMinutes', '15', '锁定分钟数'),
  ('storage.maxFileSize', '10485760', '最大上传字节数');

INSERT IGNORE INTO dict_types (type_code, type_name, remark) VALUES
  ('gender', '性别', '用户性别字典'),
  ('priority', '优先级', '任务优先级'),
  ('task_status', '任务状态', '任务状态字典'),
  ('notice_type', '公告类型', '通知公告类型'),
  ('device', '设备类型', '登录设备');

INSERT IGNORE INTO dict_items (type_code, label, value, sort) VALUES
  ('gender', '男', 'male', 1), ('gender', '女', 'female', 2), ('gender', '保密', 'unknown', 3),
  ('priority', '高', 'high', 1), ('priority', '中', 'medium', 2), ('priority', '低', 'low', 3),
  ('task_status', '待办', 'todo', 1), ('task_status', '进行中', 'doing', 2), ('task_status', '已完成', 'done', 3),
  ('notice_type', '通知', 'notice', 1), ('notice_type', '公告', 'announcement', 2),
  ('device', '桌面端', 'desktop', 1), ('device', '移动端', 'mobile', 2);

INSERT IGNORE INTO roles (role_code, role_name, description) VALUES
  ('admin', '系统管理员', '拥有全部权限'),
  ('operator', '运营人员', '内容管理权限'),
  ('viewer', '访客', '只读权限');

INSERT IGNORE INTO permissions (perm_code, perm_name, module) VALUES
  ('user:view', '查看用户', '用户管理'), ('user:create', '新增用户', '用户管理'),
  ('user:update', '编辑用户', '用户管理'), ('user:delete', '删除用户', '用户管理'),
  ('user:export', '导出用户', '用户管理'), ('user:import', '导入用户', '用户管理'),
  ('notice:manage', '管理公告', '内容管理'), ('task:manage', '管理任务', '内容管理'),
  ('file:manage', '管理文件', '内容管理'), ('dict:manage', '管理字典', '系统管理'),
  ('role:manage', '管理角色', '系统管理'), ('menu:manage', '管理菜单', '系统管理'),
  ('setting:manage', '管理系统配置', '系统管理'), ('log:view', '查看日志', '系统管理'),
  ('monitor:view', '查看监控', '系统管理');

INSERT IGNORE INTO menus (name, path, icon, parent_id, sort) VALUES
  ('仪表盘', '/', '◈', 0, 1),
  ('用户管理', '/users', '▤', 0, 2),
  ('操作日志', '/logs', '≡', 0, 3),
  ('通知公告', '/notices', '◆', 0, 4),
  ('待办任务', '/tasks', '☑', 0, 5),
  ('消息中心', '/messages', '✉', 0, 6),
  ('文件管理', '/files', '▣', 0, 7),
  ('角色权限', '/roles', '♛', 0, 8),
  ('菜单管理', '/menus', '☰', 0, 9),
  ('数据字典', '/dict', '▤', 0, 10),
  ('系统配置', '/settings', '⚙', 0, 11),
  ('系统监控', '/monitor', '◎', 0, 12),
  ('个人中心', '/profile', '◉', 0, 13),
  ('登录历史', '/login-history', '⌛', 0, 14),
  ('会话管理', '/sessions', '⇄', 0, 15);

INSERT IGNORE INTO folders (name, parent_id, owner_id) VALUES
  ('我的文件', 0, 0), ('项目资料', 0, 0), ('共享文档', 0, 0), ('图片素材', 0, 0);

INSERT IGNORE INTO files (name, size, type, ext, folder_id, downloads) VALUES
  ('项目计划书.docx', 245760, 'doc', 'docx', 2, 12),
  ('产品需求文档.pdf', 1024000, 'doc', 'pdf', 2, 8),
  ('公司LOGO.png', 56320, 'image', 'png', 4, 45),
  ('年度报表.xlsx', 348160, 'file', 'xlsx', 2, 21),
  ('README.md', 2048, 'file', 'md', 1, 33);

SELECT 'Enterprise migration done' AS message;
