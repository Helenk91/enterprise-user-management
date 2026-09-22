/**
 * 系统监控服务
 * 提供服务器运行时信息（OS + Node + 数据库连通）
 */
const os = require('os');

class MonitorService {
  /**
   * 服务器信息
   */
  async serverInfo() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // CPU 使用率（取 1s 采样差值）
    const start = this._cpuTimes(cpus);
    await new Promise((r) => setTimeout(r, 300));
    const end = this._cpuTimes(os.cpus());
    const cpuPct = this._cpuUsage(start, end);

    const uptime = os.uptime();
    return {
      hostname: os.hostname(),
      platform: `${os.type()} ${os.release()}`,
      arch: os.arch(),
      cpuModel: cpus[0]?.model || 'unknown',
      cpuCores: cpus.length,
      cpuUsage: Number(cpuPct.toFixed(1)),
      loadAvg: loadAvg.map((n) => Number(n.toFixed(2))),
      totalMem,
      freeMem,
      usedMem: totalMem - freeMem,
      memUsage: Number(((1 - freeMem / totalMem) * 100).toFixed(1)),
      uptime: this._formatUptime(uptime),
      nodeVersion: process.version,
      processUptime: this._formatUptime(process.uptime()),
    };
  }

  _cpuTimes(cpus) {
    let idle = 0;
    let total = 0;
    cpus.forEach((cpu) => {
      for (const type in cpu.times) total += cpu.times[type];
      idle += cpu.times.idle;
    });
    return { idle, total };
  }

  _cpuUsage(start, end) {
    const idleDiff = end.idle - start.idle;
    const totalDiff = end.total - start.total;
    return totalDiff > 0 ? ((totalDiff - idleDiff) / totalDiff) * 100 : 0;
  }

  _formatUptime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const parts = [];
    if (d) parts.push(`${d} 天`);
    if (h) parts.push(`${h} 小时`);
    parts.push(`${m} 分钟`);
    return parts.join(' ');
  }
}

module.exports = new MonitorService();
