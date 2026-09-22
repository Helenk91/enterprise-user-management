<script setup>
/**
 * 系统监控
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getServerInfo, getOnlineUsers } from '../api/monitor'
import { useToast } from '../stores/toast'
import { formatTime } from '../utils/format'

const toast = useToast()

const server = ref(null)
const online = ref({ count: 0, users: [] })
const loading = ref(false)
let timer = null

function formatBytes(b) {
  if (!b) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let n = Number(b)
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`
}

async function load() {
  loading.value = true
  try {
    const [s, o] = await Promise.all([getServerInfo(), getOnlineUsers()])
    server.value = s?.data || null
    online.value = o?.data || { count: 0, users: [] }
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  timer = setInterval(load, 5000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div>
    <div class="page-head">
      <h2>系统监控</h2>
      <span class="sub">服务器实时运行状态 · 每 5 秒自动刷新</span>
    </div>

    <div v-if="loading && !server" class="loading-bar"><span class="spinner" />加载中…</div>
    <template v-else-if="server">
      <!-- 核心指标 -->
      <div class="metric-grid mb-16">
        <div class="metric-card glass-card hoverable">
          <div class="metric-label">CPU 使用率</div>
          <div class="metric-value num">{{ server.cpuUsage }}%</div>
          <div class="metric-bar">
            <div class="metric-fill" :style="{ width: server.cpuUsage + '%', background: server.cpuUsage > 80 ? 'var(--danger)' : 'var(--gradient-main)' }" />
          </div>
        </div>
        <div class="metric-card glass-card hoverable">
          <div class="metric-label">内存使用率</div>
          <div class="metric-value num">{{ server.memUsage }}%</div>
          <div class="metric-bar">
            <div class="metric-fill" :style="{ width: server.memUsage + '%', background: server.memUsage > 80 ? 'var(--danger)' : 'var(--gradient-main)' }" />
          </div>
          <div class="metric-sub num">{{ formatBytes(server.usedMem) }} / {{ formatBytes(server.totalMem) }}</div>
        </div>
        <div class="metric-card glass-card hoverable">
          <div class="metric-label">系统负载</div>
          <div class="metric-value num">{{ server.loadAvg?.[0] ?? '—' }}</div>
          <div class="metric-sub">1 / 5 / 15 分钟：{{ server.loadAvg?.join(' / ') }}</div>
        </div>
        <div class="metric-card glass-card hoverable">
          <div class="metric-label">在线用户</div>
          <div class="metric-value num" style="-webkit-text-fill-color: var(--success)">{{ online.count }}</div>
          <div class="metric-sub">30 分钟内活跃</div>
        </div>
      </div>

      <div class="monitor-grid">
        <!-- 主机信息 -->
        <section class="glass-card">
          <div class="card-head">
            <div class="card-title">主机信息</div>
            <span class="pill pill-success">运行中</span>
          </div>
          <div class="info-list">
            <div class="info-row"><span class="info-key">主机名</span><span class="info-val num">{{ server.hostname }}</span></div>
            <div class="info-row"><span class="info-key">操作系统</span><span class="info-val">{{ server.platform }}</span></div>
            <div class="info-row"><span class="info-key">CPU 型号</span><span class="info-val">{{ server.cpuModel }}</span></div>
            <div class="info-row"><span class="info-key">CPU 核心</span><span class="info-val num">{{ server.cpuCores }} 核</span></div>
            <div class="info-row"><span class="info-key">架构</span><span class="info-val num">{{ server.arch }}</span></div>
            <div class="info-row"><span class="info-key">系统运行时长</span><span class="info-val">{{ server.uptime }}</span></div>
          </div>
        </section>

        <!-- 运行环境 -->
        <section class="glass-card">
          <div class="card-head">
            <div class="card-title">运行环境</div>
            <span class="pill pill-info">Node.js</span>
          </div>
          <div class="info-list">
            <div class="info-row"><span class="info-key">Node 版本</span><span class="info-val num">{{ server.nodeVersion }}</span></div>
            <div class="info-row"><span class="info-key">进程运行时长</span><span class="info-val">{{ server.processUptime }}</span></div>
            <div class="info-row"><span class="info-key">数据库状态</span><span class="info-val"><span class="pill pill-success">已连接</span></span></div>
            <div class="info-row"><span class="info-key">后端端口</span><span class="info-val num">3000</span></div>
            <div class="info-row"><span class="info-key">前端端口</span><span class="info-val num">5173</span></div>
            <div class="info-row"><span class="info-key">监控刷新</span><span class="info-val num">5s 自动</span></div>
          </div>
        </section>

        <!-- 在线用户 -->
        <section class="glass-card online-panel">
          <div class="card-head">
            <div class="card-title">在线用户</div>
            <span class="pill pill-success">{{ online.count }} 人在线</span>
          </div>
          <div v-if="!online.users?.length" class="empty-state">暂无在线用户</div>
          <div v-else class="online-list">
            <div v-for="u in online.users" :key="u.user_id" class="online-item">
              <span class="online-avatar">{{ (u.name || '?').charAt(0) }}</span>
              <div class="online-main">
                <div class="online-name">{{ u.name }}</div>
                <div class="online-sub num">{{ u.ip }} · {{ u.device }}</div>
              </div>
              <span class="online-time text-xs num">{{ u.last_active_at?.slice(11, 19) }}</span>
            </div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.metric-card {
  padding: 18px 20px;
}
.metric-label {
  font-size: 12.5px;
  color: var(--text-muted);
  font-weight: 600;
}
.metric-value {
  font-size: 30px;
  font-weight: 800;
  background: var(--gradient-main);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 6px 0 10px;
}
.metric-bar {
  height: 6px;
  background: var(--bg-canvas);
  border-radius: 999px;
  overflow: hidden;
}
.metric-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}
.metric-sub {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 8px;
}
.monitor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}
.online-panel {
  grid-column: 1 / -1;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-subtle);
}
.card-title {
  font-size: 15px;
  font-weight: 700;
}
.info-list {
  padding: 8px 18px 16px;
}
.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 4px;
  border-bottom: 1px solid #f0f3fa;
  font-size: 13px;
}
.info-row:last-child {
  border-bottom: none;
}
.info-key {
  color: var(--text-muted);
}
.info-val {
  color: var(--text-primary);
  font-weight: 500;
  max-width: 60%;
  text-align: right;
}
.online-list {
  padding: 10px 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.online-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--bg-panel);
}
.online-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--gradient-main);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.online-main {
  flex: 1;
}
.online-name {
  font-weight: 600;
  font-size: 13.5px;
}
.online-sub {
  font-size: 11.5px;
  color: var(--text-muted);
}
.online-time {
  color: var(--text-muted);
}
@media (max-width: 900px) {
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .monitor-grid {
    grid-template-columns: 1fr;
  }
  .online-panel {
    grid-column: auto;
  }
}
</style>
