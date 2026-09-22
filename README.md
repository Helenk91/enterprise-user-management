# 企业管理系统 v4.0（Enterprise Management System）

**Vue 3 + Express + MySQL 全栈企业级系统**：白色科技感设计、JWT 登录鉴权、账号锁定、令牌黑名单、登录限流、RBAC 权限、操作审计、数据可视化仪表盘、数据大屏、API 文档中心、系统工具。

---

## 一、项目总览

| 项 | 值 |
| --- | --- |
| 前端 | Vue 3 + Vite + Pinia + Vue Router + ECharts |
| 后端 | Node.js + Express 4（routes → controllers → services 分层） |
| 数据库 | MySQL 8.4.6（库名 `userdb`，16 张表） |
| 认证 | JWT（jti 黑名单 + 2 小时有效期） |
| 授权 | RBAC（角色-权限-菜单） |
| 安全 | bcryptjs + Helmet + 登录锁定 + 限流 + CORS 白名单 |
| 语言 | 简体中文 |

---

## 二、目录结构

```
D:\VSCODE\test
├── backend/                        # 后端服务（端口 3000）
│   ├── config/                     # 配置（jwt/限流/cors/数据库）
│   ├── middleware/                 # 中间件
│   │   ├── auth.js                 #   JWT 鉴权
│   │   ├── requirePerm.js          #   RBAC 权限校验
│   │   ├── rateLimit.js            #   登录/全局限流
│   │   └── tokenBlacklist.js       #   JWT 黑名单
│   ├── controllers/                # 控制器（22 个）
│   │   ├── authController.js       #   认证
│   │   ├── userController.js       #   用户 CRUD/导入/批量/重置
│   │   ├── profileController.js    #   个人资料
│   │   ├── securityController.js   #   登录历史/会话
│   │   ├── noticeController.js     #   公告
│   │   ├── taskController.js       #   任务
│   │   ├── messageController.js    #   消息
│   │   ├── fileController.js       #   文件/文件夹
│   │   ├── dictController.js       #   数据字典
│   │   ├── roleController.js       #   角色/权限
│   │   ├── menuController.js       #   菜单
│   │   ├── settingController.js    #   系统配置
│   │   ├── extController.js        #   仪表盘/监控聚合
│   │   └── toolController.js       #   系统工具/健康检查
│   ├── services/                   # 业务服务（17 个）
│   ├── routes/                     # 路由（16 个文件）
│   ├── utils/                      # 工具（response/logger/validator）
│   ├── migrate.sql                 # 建库 + 种子数据（16 表）
│   └── server.js                   # 入口
├── frontend/                       # 前端应用（端口 5173）
│   └── src/
│       ├── api/                    # 接口模块（16 个）
│       ├── components/             # 通用组件（8 个）
│       ├── composables/            # 组合式函数（3 个）
│       ├── router/                 # 路由 + 守卫
│       ├── stores/                 # Pinia 状态
│       ├── utils/                  # 工具库（6 个）
│       └── views/                  # 页面（22 个）
├── README.md
```

---

## 三、快速启动

### 1. 数据库

```bash
# MySQL 8.4 客户端路径（本机）
D:\mysql\mysql-8.4.6-winx64\bin\mysql.exe -u root -proot -e "source D:/VSCODE/test/backend/migrate.sql"
```

> 库 `userdb` 将自动创建 16 张表并写入种子数据（管理员账号、角色、权限、菜单、字典等）。

### 2. 后端

```bash
cd D:\VSCODE\test\backend
npm install          # 首次
node server.js       # 监听 3000
```

### 3. 前端

```bash
cd D:\VSCODE\test\frontend
npm install          # 首次
npm run dev          # 监听 5173
```

### 4. 登录

| 角色 | 账号 | 密码 |
| --- | --- | --- |
| 管理员 | admin@example.com | admin123 |

---

## 四、功能清单（25 个页面 / 70+ 接口）

### 工作台
| 页面 | 说明 |
| --- | --- |
| 数据概览 | 统计卡、月度/趋势/角色/部门/操作 5 张图表、在线用户、最近动态 |
| 用户管理 | 搜索分页、创建/编辑/删除、批量启用禁用、批量删除、CSV 导出、批量导入、重置密码 |
| 操作日志 | 审计日志分页 + 类型/关键词筛选 |

### 业务中心
| 页面 | 说明 |
| --- | --- |
| 待办任务 | 看板三列 + 拖拽流转 + 优先级 + 逾期标记 |
| 任务日历 | 按月日历视图 + 点击卡片一键标记完成 |
| 团队通讯录 | 成员卡片视图 + 部门筛选 + 搜索 + 一键发邮件 |
| 通知公告 | 公告 CRUD + 三级优先级 + 顶栏铃铛直达 |
| 消息中心 | 全部/未读 Tab + 已读/全部已读/删除 |
| 文件管理 | 文件夹树 + 文件记录 + 下载 |

### 系统管理
| 页面 | 说明 |
| --- | --- |
| 角色权限 | 角色卡片 + 按模块勾选权限点（RBAC） |
| 菜单管理 | 菜单扁平表 + 父级/可见性 |
| 数据字典 | 类型 + 字典项 CRUD |
| 系统配置 | 配置 CRUD + 按前缀分组 |
| 系统监控 | CPU/内存/负载/在线指标 + 主机信息，5 秒自动刷新 |

### 账户与安全
| 页面 | 说明 |
| --- | --- |
| 登录历史 | 分页登录记录 |
| 个人中心 | 资料查看 + 编辑双模式 |

### 数据中心与支持
| 页面 | 说明 |
| --- | --- |
| 综合报表 | 核心指标 + 近 7 天注册/操作趋势 + 部门/地区分布 + 任务完成率 |
| 数据大屏 | 全屏可视化：6 指标 + 4 图表 + 在线用户，10 秒自动刷新 |
| 数据分析 | 操作趋势/热力/行为/时段 4 图分析 |
| 数据导出 | 一键导出用户/日志/任务/公告 CSV |
| 系统工具 | 深度健康检查 + 数据规模 + 表结构 + 缓存/安全状态 |
| API 文档 | 70+ 接口分组检索 + 一键复制 |
| 帮助中心 | 快速上手 + FAQ + 技术架构 |

> 全局能力：白色科技主题 ↔ 深色主题一键切换（localStorage 持久化）、顶栏全局功能搜索、通知铃铛（未读徽标 + 最新 5 条公告）。

---

## 五、安全特性（企业级）

| 防护 | 实现 |
| --- | --- |
| 密码存储 | bcryptjs 哈希（10 轮 salt） |
| 令牌安全 | JWT 带 jti，有效期 2 小时，登出/改密立即加入黑名单 |
| 暴力破解 | 连续 5 次密码错误锁定 15 分钟（DB 持久化） |
| 登录限流 | 同一 IP 每分钟最多 10 次登录尝试 |
| 全局限流 | 每 IP 每分钟 120 次请求 |
| 密码策略 | ≥8 位，强制大小写/数字/特殊字符 |
| RBAC | 角色-权限点，admin 全通 |
| 安全响应头 | Helmet 全套 |
| CORS 白名单 | 仅允许 localhost:5173 |
| 请求体限制 | 100KB |
| 审计日志 | 登录/登出/改密/增删改/健康检查全部落库 |
| 输入防护 | SQL 参数化 + 校验器 |
| 会话管理 | 多端会话列表 + 强制下线 |

---

## 六、接口文档

> 统一返回格式：`{ code, message, data }`；除注册/登录外均需 `Authorization: Bearer <token>`。

### 认证 `/api/auth`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /auth/register | 注册（密码强度校验） |
| POST | /auth/login | 登录（限流+锁定+写历史+建会话） |
| POST | /auth/logout | 登出（token 入黑名单） |
| GET | /auth/me | 当前用户 |
| PUT | /auth/password | 修改密码（登出全部会话） |

### 用户 `/api/users`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /users | 分页列表（搜索/角色/状态/部门/地区过滤） |
| GET | /users/:id | 详情 |
| POST | /users | 创建 |
| PUT | /users/:id | 更新 |
| DELETE | /users/:id | 删除 |
| POST | /users/batch-delete | 批量删除 |
| GET | /users/export/csv | 导出 CSV |
| POST | /users/import | 批量导入 |
| POST | /users/batch-status | 批量启用/禁用 |
| POST | /users/:id/reset-password | 重置密码 |

### 统计 `/api/stats`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /stats/overview | 总览（总数/今日新增/启用/最新） |
| GET | /stats/trend | 注册趋势（按天） |
| GET | /stats/roles | 角色分布 |

### 日志 `/api/logs`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /logs | 审计日志分页（action/keyword 过滤） |

### 个人资料 `/api/profile`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /profile | 资料 |
| PUT | /profile | 更新（性别/部门/地区/简介等） |
| PUT | /profile/avatar | 更新头像 |
| GET | /profile/stats | 部门/地区/性别分布 |

### 安全 `/api/security`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /security/login-history | 登录历史分页 |
| GET | /security/sessions | 会话列表 |
| DELETE | /security/sessions/:id | 强制下线 |

### 公告 `/api/notices`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /notices | 分页 |
| GET | /notices/latest | 最新 5 条 |
| GET | /notices/:id | 详情 |
| POST | /notices | 发布 |
| PUT | /notices/:id | 修改 |
| DELETE | /notices/:id | 删除 |

### 任务 `/api/tasks`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /tasks | 分页 |
| GET | /tasks/board | 看板 + 统计 |
| GET | /tasks/month | 按月日历数据 |
| POST | /tasks | 创建 |
| PUT | /tasks/:id | 更新 |
| PATCH | /tasks/:id/status | 变更状态 |
| DELETE | /tasks/:id | 删除 |

### 消息 `/api/messages`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /messages | 分页（read 过滤） |
| GET | /messages/unread-count | 未读数 |
| PUT | /messages/read-all | 全部已读 |
| PUT | /messages/:id/read | 单条已读 |
| DELETE | /messages/:id | 删除 |

### 文件 `/api/files`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /files/tree | 文件夹树 |
| GET | /files/stats | 统计 |
| POST | /files/folder | 创建文件夹 |
| GET | /files?folderId= | 文件列表 |
| POST | /files | 登记文件 |
| GET | /files/:id/download | 下载 |
| DELETE | /files/:id | 删除 |

### 字典 `/api/dict`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /dict/types | 类型列表 |
| GET | /dict/items | 字典项 |
| POST | /dict/items | 新增 |
| PUT | /dict/items/:id | 修改 |
| DELETE | /dict/items/:id | 删除 |

### 角色 `/api/roles`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /roles | 角色列表（含权限点） |
| GET | /roles/permissions | 全部权限点 |
| PUT | /roles/:id/permissions | 分配权限 |

### 菜单 `/api/menus`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /menus/tree | 菜单树 |

### 配置 `/api/settings`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /settings | 配置列表（prefix 过滤） |
| PUT | /settings/:key | 更新 |

### 仪表盘 `/api/dashboard`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /dashboard/monthly | 月度注册 |
| GET | /dashboard/heatmap | 活跃热力 |
| GET | /dashboard/actions | 操作分布 |
| GET | /dashboard/system | 系统概览 |

### 监控 `/api/monitor`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /monitor/server | 服务器信息（CPU/内存/负载/进程） |
| GET | /monitor/online | 在线用户 |

### 工具 `/api/tools`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /tools/health | 深度健康检查（7 项） |
| GET | /tools/ping | 快速探活 |
| GET | /tools/tables | 表清单 |
| GET | /tools/row-counts | 各表行数 |
| GET | /tools/api-list | 接口清单 |
| GET | /tools/cache-stats | 缓存/黑名单统计 |

### 导出 `/api/export`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /export/users.csv | 用户导出 |
| GET | /export/logs.csv | 日志导出 |
| GET | /export/tasks.csv | 任务导出 |
| GET | /export/notices.csv | 公告导出 |
| GET | /export/analytics/trend | 注册趋势 |
| GET | /export/analytics/heatmap | 活跃热力 |
| GET | /export/analytics/actions | 操作分布 |
| GET | /export/analytics/hours | 时段分布 |

### 报表 `/api/report`
| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /report/core | 核心指标 |
| GET | /report/trend | 近 N 天注册/操作趋势 |
| GET | /report/distributions | 角色/部门/地区分布 |
| GET | /report/task-completion | 任务完成率 |

---

## 七、数据库设计（16 张表）

| 表 | 用途 | 关键字段 |
| --- | --- | --- |
| users | 用户 | email/password/role/status/gender/birthday/avatar/department/region/bio/failed_attempts/locked_until |
| logs | 审计日志 | action/detail/user_id/ip/created_at |
| login_history | 登录历史 | user_id/ip/device/status/created_at |
| sessions | 会话 | user_id/token_id/ip/device/last_active_at |
| notices | 公告 | title/content/priority/author/status |
| tasks | 任务 | title/description/priority/status/due_date/user_id |
| messages | 消息 | title/content/user_id/is_read |
| folders | 文件夹 | name/parent_id |
| files | 文件记录 | name/size/type/folder_id/user_id/download_count |
| dict_types | 字典类型 | name/code |
| dict_items | 字典项 | type_id/label/value/sort |
| roles | 角色 | name/code/description |
| permissions | 权限点 | name/code/module |
| role_permissions | 角色-权限 | role_id/permission_id |
| menus | 菜单 | title/path/icon/parent_id/visible/sort |
| settings | 系统配置 | key/value/group/description |

---

## 八、部署到 Linux 服务器

```bash
# 1. 安装依赖（Ubuntu 示例）
sudo apt update && sudo apt install -y nginx mysql-server
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 2. 上传项目
#   scp -r backend frontend root@你的服务器:/opt/ems

# 3. 初始化数据库
mysql -u root -p -e "source /opt/ems/backend/migrate.sql"

# 4. 启动后端（pm2）
cd /opt/ems/backend && npm install --production
pm2 start server.js --name ems-backend

# 5. 构建并托管前端
cd /opt/ems/frontend && npm install && npm run build
# Nginx 配置：
#   server {
#     listen 80;
#     root /opt/ems/frontend/dist;
#     location /api { proxy_pass http://127.0.0.1:3000; }
#     location / { try_files $uri $uri/ /index.html; }
#   }
```

---

## 九、开发约定

- 新增接口：services 写业务 → controllers 写响应 → routes 挂载 → routes/index.js 注册 → 前端 api/ 封装
- 前端新增页面：views/ 建组件 → router/ 注册 → App.vue 导航组添加
- 敏感操作必须写审计日志（logger.logToDb）
- 密码/令牌一律不允许出现在日志与前端存储明文
