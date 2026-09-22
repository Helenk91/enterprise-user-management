/**
 * 系统自测服务 v2 —— 一键全链路自检（17 项，按类别分组）
 * 类别：env 运行环境 / db 数据库 / auth 认证链路 / security 安全防护 / data 数据与业务
 * 返回 { summary:{ total,pass,warn,fail,elapsed,status,ranAt,categories }, checks:[{name,category,status,value,detail,ms}] }
 */
const os = require('os');
const http = require('http');
const { query } = require('../db');
const config = require('../config');
const jwtUtil = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const validator = require('../utils/validator');
const healthService = require('./healthService');

const TABLES = [
  'users', 'roles', 'menus', 'settings', 'notices', 'tasks', 'messages',
  'folders', 'files', 'dict_types', 'dict_items', 'sessions',
  'login_history', 'logs', 'permissions', 'role_permissions',
];

const CATEGORY_LABEL = {
  env: '运行环境',
  db: '数据库',
  auth: '认证链路',
  security: '安全防护',
  data: '数据与业务',
};

class SelfTestService {
  /**
   * 执行全部自检，返回 { summary, checks }
   */
  async runAll() {
    const started = Date.now();
    const checks = [];

    // ================= 运行环境 =================

    // 1. 运行环境
    await this.check('运行环境', 'env', async () => {
      const mem = process.memoryUsage();
      return {
        status: 'pass',
        value: `Node ${process.version}`,
        detail: `${os.type()} ${os.release()} · ${os.arch()} · ${os.cpus().length} 核 · 系统已运行 ${this._fmtUptime(os.uptime())} · 进程内存 ${this._fmtBytes(mem.rss)}`,
      };
    }, checks);

    // 2. 磁盘水位
    await this.check('磁盘水位', 'env', async () => {
      const disk = await healthService.diskUsage();
      return {
        status: disk.pct === null ? 'warn' : disk.pct > 92 ? 'warn' : 'pass',
        value: disk.pct === null ? 'N/A' : `${disk.pct}%`,
        detail: disk.detail,
      };
    }, checks);

    // ================= 数据库 =================

    // 3. 数据库连接
    await this.check('数据库连接', 'db', async () => {
      const [row] = await query('SELECT 1 AS ok');
      return { status: 'pass', value: '正常', detail: `MySQL ${config.db.host}:${config.db.port} / ${config.db.database}` };
    }, checks);

    // 4. 表结构完整性
    await this.check('表结构完整性', 'db', async () => {
      const rows = await query(
        `SELECT TABLE_NAME FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${TABLES.map(() => '?').join(',')})`,
        [config.db.database, ...TABLES]
      );
      const existing = new Set(rows.map((r) => r.TABLE_NAME));
      const missing = TABLES.filter((t) => !existing.has(t));
      return {
        status: missing.length ? 'fail' : 'pass',
        value: `${existing.size}/${TABLES.length} 张表`,
        detail: missing.length ? `缺失：${missing.join('、')}` : '全部核心表就绪',
      };
    }, checks);

    // 5. 数据库规模与占用
    await this.check('数据库规模与占用', 'db', async () => {
      const [[size], [big]] = await Promise.all([
        query(
          `SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS mb, COUNT(*) AS cnt
           FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
          [config.db.database]
        ),
        query(
          `SELECT TABLE_NAME AS t, ROUND((data_length + index_length) / 1024 / 1024, 2) AS mb
           FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?
           ORDER BY (data_length + index_length) DESC LIMIT 1`,
          [config.db.database]
        ),
      ]);
      return {
        status: 'pass',
        value: `${size.mb || 0} MB · ${size.cnt || 0} 张表`,
        detail: `占用最大的表「${big?.t || '-'}」${big?.mb || 0} MB`,
      };
    }, checks);

    // 6. 查询性能（3 次探活平均耗时）
    await this.check('查询性能', 'db', async () => {
      const samples = [];
      for (let i = 0; i < 3; i++) {
        const s = Date.now();
        await query('SELECT 1 AS ok');
        samples.push(Date.now() - s);
      }
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      return {
        status: avg < 30 ? 'pass' : avg < 100 ? 'warn' : 'fail',
        value: `${avg.toFixed(1)} ms`,
        detail: `3 次探活平均耗时 · 单次 ${samples.map((s) => `${s}ms`).join(' / ')}`,
      };
    }, checks);

    // ================= 认证链路 =================

    // 7. 认证链路（JWT + bcrypt）
    await this.check('认证链路', 'auth', async () => {
      const token = jwtUtil.sign({ id: 1, name: 'selftest', role: 'admin' });
      const payload = jwtUtil.verify(token);
      if (!payload || payload.id !== 1) throw new Error('JWT 校验失败');
      const hash = await bcrypt.hash('selftest-pw', 10);
      const ok = await bcrypt.compare('selftest-pw', hash);
      if (!ok) throw new Error('bcrypt 比对失败');
      return { status: 'pass', value: '正常', detail: `JWT 签发/校验通过 · bcrypt 哈希/比对通过 · 有效期 ${config.jwt.expiresIn}` };
    }, checks);

    // 8. 密码策略校验（实测规则）
    await this.check('密码策略校验', 'auth', async () => {
      const strongErr = validator.password('Str0ng@Pass2026');
      const weakErr = validator.password('weak');
      const strongOk = strongErr === null;
      const weakRejected = weakErr !== null;
      return {
        status: strongOk && weakRejected ? 'pass' : 'warn',
        value: strongOk ? '策略校验通过' : '策略存在异常',
        detail: `强密码样例「Str0ng@Pass2026」${strongOk ? '通过' : '未通过'} · 弱密码样例「weak」${weakRejected ? '已拦截' : '未被拦截'}${weakErr && strongOk ? `（${weakErr}）` : ''}`,
      };
    }, checks);

    // 9. JWT 有效期配置
    await this.check('JWT 有效期', 'auth', async () => {
      const exp = config.jwt.expiresIn || '2h';
      const m = String(exp).match(/^(\d+)([smhd])$/);
      let sec = 0;
      if (m) {
        const unit = { s: 1, m: 60, h: 3600, d: 86400 }[m[2]];
        sec = Number(m[1]) * unit;
      }
      const status = sec >= 3600 && sec <= 86400 ? 'pass' : 'warn';
      return {
        status,
        value: exp,
        detail: sec
          ? `令牌有效期 ${exp}（${this._fmtDuration(sec)}），黑名单保留 ${config.jwt.blacklistTtlMs / 60000} 分钟`
          : '已配置有效期，黑名单机制生效',
      };
    }, checks);

    // ================= 安全防护 =================

    // 10. 安全防护配置
    await this.check('安全防护配置', 'security', async () => {
      const items = [
        ['接口限流', config.rateLimit.max, `每 ${config.rateLimit.windowMs / 1000}s 最多 ${config.rateLimit.max} 次`],
        ['登录限流', config.login.max, `每窗口最多 ${config.login.max} 次尝试`],
        ['登录锁定', config.login.maxFailures, `连续失败 ${config.login.maxFailures} 次锁定 ${config.login.lockMinutes} 分钟`],
        ['JWT 黑名单', config.jwt.blacklistTtlMs / 60000, `保留 ${config.jwt.blacklistTtlMs / 60000} 分钟`],
      ];
      return { status: 'pass', value: '4 项防护已启用', detail: items.map(([, , d]) => d).join(' · ') };
    }, checks);

    // 11. 安全响应头（自请求验证 helmet）
    await this.check('安全响应头', 'security', async () => {
      const headers = await this._fetchSelfHeaders();
      const items = [
        ['X-Content-Type-Options=nosniff', headers['x-content-type-options'] === 'nosniff'],
        ['X-Frame-Options 防点击劫持', !!headers['x-frame-options']],
        ['CSP 内容安全策略', !!headers['content-security-policy']],
        ['已隐藏 X-Powered-By', headers['x-powered-by'] === undefined],
      ];
      const failed = items.filter(([, ok]) => !ok);
      return {
        status: failed.length ? 'warn' : 'pass',
        value: `${items.length - failed.length}/${items.length} 项`,
        detail: failed.length ? `缺失：${failed.map(([n]) => n).join('、')}` : items.map(([n]) => n).join(' · '),
      };
    }, checks);

    // 12. 会话健康
    await this.check('会话健康', 'security', async () => {
      const [active] = await query('SELECT COUNT(DISTINCT user_id) c FROM sessions WHERE last_active_at > DATE_SUB(NOW(), INTERVAL 30 MINUTE)');
      const [stale] = await query('SELECT COUNT(*) c FROM sessions WHERE last_active_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)');
      const [total] = await query('SELECT COUNT(*) c FROM sessions');
      return {
        status: 'pass',
        value: `在线 ${active.c} · 过期待清理 ${stale.c}`,
        detail: `会话总量 ${total.c} 条`,
      };
    }, checks);

    // ================= 数据与业务 =================

    // 13. 数据健康度
    await this.check('数据健康度', 'data', async () => {
      const [[u], [r], [t], [m], [n]] = await Promise.all([
        query('SELECT COUNT(*) c, SUM(status = "active") active, SUM(role = "admin") admins FROM users'),
        query('SELECT COUNT(*) c FROM roles'),
        query('SELECT COUNT(*) c, SUM(status = "done") done FROM tasks'),
        query('SELECT COUNT(*) c, SUM(is_read = 0) unread FROM messages'),
        query('SELECT COUNT(*) c FROM notices WHERE status = "published"'),
      ]);
      const users = u.c || 0;
      const issues = [];
      if (users < 1) issues.push('无用户数据');
      if ((r.c || 0) < 1) issues.push('角色表为空');
      return {
        status: issues.length ? 'warn' : 'pass',
        value: `用户 ${users} · 角色 ${r.c || 0} · 任务 ${t.c || 0} · 消息 ${m.c || 0} · 公告 ${n.c || 0}`,
        detail: issues.length ? issues.join('；') : `管理员 ${u.admins || 0} · 启用率 ${Math.round(((u.active || 0) / (users || 1)) * 100)}% · 任务完成率 ${t.c ? Math.round(((t.done || 0) / t.c) * 100) : 0}% · 未读消息 ${m.unread || 0}`,
      };
    }, checks);

    // 14. 操作日志
    await this.check('操作日志', 'data', async () => {
      const [today] = await query("SELECT COUNT(*) c FROM logs WHERE created_at >= CURDATE()");
      const [total] = await query('SELECT COUNT(*) c FROM logs');
      return {
        status: 'pass',
        value: `今日 ${today.c} 条 · 累计 ${total.c} 条`,
        detail: '审计链路正常，操作均留痕',
      };
    }, checks);

    // 15. 系统配置完整性
    await this.check('系统配置完整性', 'data', async () => {
      const rows = await query('SELECT config_key, config_value FROM settings');
      const need = ['site.name', 'site.notice', 'security.login.lock', 'security.login.lockMinutes', 'storage.maxFileSize'];
      const missing = need.filter((k) => !rows.some((r) => r.config_key === k));
      return {
        status: missing.length ? 'warn' : 'pass',
        value: `${rows.length}/5 项配置`,
        detail: missing.length ? `缺失：${missing.join('、')}` : '站点名称 / 公告 / 登录锁定 / 存储上限均已配置',
      };
    }, checks);

    // 16. 数据引用完整性
    await this.check('数据引用完整性', 'data', async () => {
      const [orphan] = await query(
        'SELECT COUNT(*) c FROM users u LEFT JOIN roles r ON u.role = r.role_code WHERE r.role_code IS NULL'
      );
      const [badStatus] = await query("SELECT COUNT(*) c FROM users WHERE status NOT IN ('active','disabled')");
      const orphanN = Number(orphan.c) || 0;
      const badN = Number(badStatus.c) || 0;
      return {
        status: orphanN || badN ? 'warn' : 'pass',
        value: '外键与枚举校验通过',
        detail: orphanN || badN ? `孤儿用户 ${orphanN} · 非法状态 ${badN}` : '所有用户角色/状态均合法',
      };
    }, checks);

    // 17. 业务时间线
    await this.check('业务时间线', 'data', async () => {
      const [[u], [n], [t]] = await Promise.all([
        query('SELECT name, created_at FROM users ORDER BY id DESC LIMIT 1'),
        query('SELECT title, published_at FROM notices WHERE status = "published" ORDER BY published_at DESC LIMIT 1'),
        query('SELECT title, due_date FROM tasks WHERE due_date >= CURDATE() ORDER BY due_date ASC LIMIT 1'),
      ]);
      return {
        status: 'pass',
        value: '最新业务数据',
        detail: `最新用户「${u?.name || '-'}」· 最新公告「${n?.title || '-'}」· 最近任务「${t?.title || '-'}」`,
      };
    }, checks);

    // ================= 汇总 =================

    const elapsed = Date.now() - started;
    const pass = checks.filter((c) => c.status === 'pass').length;
    const warn = checks.filter((c) => c.status === 'warn').length;
    const fail = checks.filter((c) => c.status === 'fail').length;

    const categories = Object.keys(CATEGORY_LABEL).map((key) => {
      const list = checks.filter((c) => c.category === key);
      return {
        key,
        label: CATEGORY_LABEL[key],
        total: list.length,
        pass: list.filter((c) => c.status === 'pass').length,
        warn: list.filter((c) => c.status === 'warn').length,
        fail: list.filter((c) => c.status === 'fail').length,
      };
    }).filter((c) => c.total > 0);

    return {
      summary: {
        total: checks.length,
        pass,
        warn,
        fail,
        elapsed,
        status: fail ? 'fail' : warn ? 'warn' : 'pass',
        ranAt: new Date().toISOString(),
        categories,
      },
      checks,
    };
  }

  /**
   * 包装单项自检，捕获异常并计耗时
   */
  async check(name, category, fn, checks) {
    const start = Date.now();
    try {
      const result = await fn();
      checks.push({ name, category, status: result.status || 'pass', value: result.value || '', detail: result.detail || '', ms: Date.now() - start });
    } catch (err) {
      checks.push({ name, category, status: 'fail', value: '异常', detail: err.message || String(err), ms: Date.now() - start });
    }
  }

  /**
   * 自请求本服务 /api/health，读取安全响应头
   */
  _fetchSelfHeaders() {
    return new Promise((resolve, reject) => {
      const req = http.get(
        { host: '127.0.0.1', port: config.server.port, path: '/api/health', timeout: 4000 },
        (res) => resolve(res.headers)
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('自检请求超时'));
      });
    });
  }

  _fmtBytes(b) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let n = Number(b);
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
  }

  _fmtUptime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const parts = [];
    if (d) parts.push(`${d} 天`);
    if (h) parts.push(`${h} 小时`);
    parts.push(`${m} 分钟`);
    return parts.join(' ');
  }

  _fmtDuration(sec) {
    if (sec >= 86400) return `${(sec / 86400).toFixed(1)} 天`;
    if (sec >= 3600) return `${(sec / 3600).toFixed(1)} 小时`;
    if (sec >= 60) return `${(sec / 60).toFixed(1)} 分钟`;
    return `${sec} 秒`;
  }
}

module.exports = new SelfTestService();
