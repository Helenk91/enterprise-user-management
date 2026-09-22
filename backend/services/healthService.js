/**
 * 系统健康检查服务
 * 提供 API 健康、数据库连通、内存/磁盘水位、依赖检查等深度探活能力
 */
const os = require('os');
const { query } = require('../db');

class HealthService {
  /**
   * 深度健康检查
   * 返回每项 { name, status: 'ok'|'warn'|'fail', value, detail }
   */
  async fullCheck() {
    const checks = [];

    // 1. 进程状态
    const uptime = os.uptime();
    checks.push({
      name: '进程状态',
      status: uptime > 0 ? 'ok' : 'warn',
      value: `${this._fmtUptime(process.uptime())}`,
      detail: `Node ${process.version} · 内存 ${this._fmtBytes(process.memoryUsage().rss)}`,
    });

    // 2. 数据库连通
    try {
      const [row] = await query('SELECT 1 AS ok');
      checks.push({
        name: '数据库连接',
        status: 'ok',
        value: row && row.ok === 1 ? '连通正常' : '异常',
        detail: 'MySQL · userdb',
      });
    } catch (err) {
      checks.push({ name: '数据库连接', status: 'fail', value: '连接失败', detail: err.message });
    }

    // 3. 内存水位
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memPct = (1 - freeMem / totalMem) * 100;
    checks.push({
      name: '内存水位',
      status: memPct > 90 ? 'warn' : 'ok',
      value: `${memPct.toFixed(1)}%`,
      detail: `已用 ${this._fmtBytes(totalMem - freeMem)} / 共 ${this._fmtBytes(totalMem)}`,
    });

    // 4. 磁盘水位
    const disk = await this.diskUsage();
    checks.push({
      name: '磁盘水位',
      status: disk.pct === null ? 'warn' : disk.pct > 92 ? 'warn' : 'ok',
      value: disk.pct === null ? 'N/A' : `${disk.pct}%`,
      detail: disk.detail,
    });

    // 5. 会话清理（清除 24h 前的过期会话）
    try {
      const r = await query("DELETE FROM sessions WHERE last_active_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)");
      checks.push({
        name: '会话清理',
        status: 'ok',
        value: `清理 ${r.affectedRows} 条`,
        detail: '自动清理 24 小时未活跃会话',
      });
    } catch (err) {
      checks.push({ name: '会话清理', status: 'warn', value: '跳过', detail: err.message });
    }

    // 6. 登录失败统计（安全）
    try {
      const [r] = await query('SELECT COUNT(*) AS cnt FROM users WHERE failed_attempts > 0');
      checks.push({
        name: '安全水位',
        status: r.cnt > 0 ? 'warn' : 'ok',
        value: `${r.cnt} 个账号存在失败记录`,
        detail: 'failed_attempts > 0',
      });
    } catch (err) {
      checks.push({ name: '安全水位', status: 'warn', value: 'N/A', detail: err.message });
    }

    // 7. 表数量与数据规模
    try {
      const rows = await query(
        "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'userdb' ORDER BY TABLE_ROWS DESC"
      );
      checks.push({
        name: '数据规模',
        status: 'ok',
        value: `${rows.length} 张表`,
        detail: rows.map((r) => `${r.TABLE_NAME}(${r.TABLE_ROWS})`).join(' · '),
      });
    } catch (err) {
      checks.push({ name: '数据规模', status: 'warn', value: 'N/A', detail: err.message });
    }

    const failed = checks.filter((c) => c.status === 'fail').length;
    const warnings = checks.filter((c) => c.status === 'warn').length;

    return {
      overall: failed > 0 ? 'fail' : warnings > 0 ? 'warn' : 'ok',
      checkedAt: new Date().toISOString(),
      summary: { total: checks.length, fail: failed, warn: warnings, ok: checks.length - failed - warnings },
      checks,
    };
  }

  /**
   * 快速探活（health 接口）
   */
  async ping() {
    try {
      await query('SELECT 1');
      return { db: 'ok', api: 'ok', time: Date.now() };
    } catch {
      return { db: 'fail', api: 'ok', time: Date.now() };
    }
  }

  /**
   * 数据库表清单（含行数与引擎）
   */
  async tables() {
    return query(
      `SELECT TABLE_NAME AS name, ENGINE AS engine, TABLE_ROWS AS rows_est,
              TABLE_COLLATION AS collation, CREATE_TIME AS created_at
       FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = 'userdb'
       ORDER BY TABLE_NAME`
    );
  }

  /**
   * 数据总量统计（各核心表行数）
   */
  async rowCounts() {
    const tables = ['users', 'logs', 'login_history', 'sessions', 'notices', 'tasks', 'messages', 'files', 'folders', 'dict_types', 'dict_items', 'roles', 'permissions', 'menus', 'settings'];
    const out = {};
    for (const t of tables) {
      try {
        const [r] = await query(`SELECT COUNT(*) AS cnt FROM \`${t}\``);
        out[t] = r.cnt;
      } catch {
        out[t] = -1;
      }
    }
    return out;
  }

  /**
   * 磁盘水位（Windows 各盘符占用率；其他平台返回 N/A）
   */
  async diskUsage() {
    try {
      const exec = require('child_process').execSync('wmic logicaldisk get size,freespace,caption', {
        encoding: 'utf8',
        timeout: 5000,
      });
      const lines = exec
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => /[A-Z]:/.test(l));
      let worst = 0;
      const parts = [];
      lines.forEach((l) => {
        const m = l.match(/([A-Z]):\s+(\d+)\s+(\d+)/);
        if (m) {
          const free = Number(m[2]);
          const size = Number(m[3]);
          if (size > 0) {
            const pct = (1 - free / size) * 100;
            parts.push(`${m[1]}: ${pct.toFixed(1)}%`);
            worst = Math.max(worst, pct);
          }
        }
      });
      return {
        pct: Number(worst.toFixed(1)),
        detail: parts.length ? parts.join(' · ') : '所有盘符中最高占用率',
        ok: true,
      };
    } catch {
      return { pct: null, detail: '无法读取磁盘信息', ok: false };
    }
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
    if (d) parts.push(`${d}天`);
    if (h) parts.push(`${h}小时`);
    parts.push(`${m}分钟`);
    return parts.join(' ');
  }
}

module.exports = new HealthService();
