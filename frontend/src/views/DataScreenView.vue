<script setup>
/**
 * 数据大屏：全屏式可视化监控
 * 支持全屏模式与 10s 自动刷新
 */
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getOverview, getTrend, getRoles } from '../api/stats'
import { getMonthly, getActions, getSystem, getHeatmap } from '../api/dashboard'
import { getServerInfo, getOnlineUsers } from '../api/monitor'
import { useToast } from '../stores/toast'

const toast = useToast()

const fullscreen = ref(false)
const clock = ref('')
const server = ref(null)
const online = ref([])
const onlineCount = ref(0)
const overview = ref({ total: 0, todayNew: 0, active: 0 })
const heatmapData = ref([])
const rowCounts = ref({})

let charts = {}
let timer = null
let clockTimer = null

const DARK = {
  axis: '#8aa0c8',
  split: 'rgba(90,140,255,0.12)',
  tooltip: {
    backgroundColor: 'rgba(10,20,45,0.92)',
    borderColor: 'rgba(90,150,255,0.3)',
    textStyle: { color: '#e6edf7' },
  },
}

function tickClock() {
  const d = new Date()
  clock.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

async function load() {
  try {
    const [ov, trend, roles, mon, act, sys, heat, srv, ol] = await Promise.all([
      getOverview(),
      getTrend(14),
      getRoles(),
      getMonthly(6),
      getActions(7),
      getSystem(),
      getHeatmap(30),
      getServerInfo(),
      getOnlineUsers(),
    ])
    overview.value = ov?.data || {}
    server.value = srv?.data || null
    online.value = ol?.data?.users || []
    onlineCount.value = ol?.data?.count || 0
    heatmapData.value = heat?.data || []
    rowCounts.value = sys?.data || {}

    await nextTick()
    if (!charts.trend) initCharts()
    renderCharts({ trend: trend?.data || [], roles: roles?.data || [], mon: mon?.data || [], act: act?.data || [] })
  } catch (e) {
    toast.error(e.message)
  }
}

function initCharts() {
  charts = {
    trend: echarts.init(document.getElementById('bigTrend')),
    roles: echarts.init(document.getElementById('bigRoles')),
    mon: echarts.init(document.getElementById('bigMon')),
    actions: echarts.init(document.getElementById('bigActions')),
  }
}

function renderCharts({ trend, roles, mon, act }) {
  charts.trend.setOption({
    tooltip: { trigger: 'axis', ...DARK.tooltip },
    grid: { left: 46, right: 20, top: 30, bottom: 28 },
    xAxis: { type: 'category', data: trend.map((d) => d.day.slice(5)), axisLine: { lineStyle: { color: '#2a3f6e' } }, axisLabel: { color: DARK.axis } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: DARK.split } }, axisLabel: { color: DARK.axis } },
    series: [{
      name: '注册数',
      type: 'line',
      smooth: true,
      symbolSize: 6,
      data: trend.map((d) => d.count),
      lineStyle: { color: '#38bdf8', width: 3, shadowColor: 'rgba(56,189,248,0.6)', shadowBlur: 14 },
      itemStyle: { color: '#38bdf8' },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(56,189,248,0.35)' }, { offset: 1, color: 'rgba(56,189,248,0)' }]) },
    }],
  })

  charts.roles.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 人 ({d}%)', ...DARK.tooltip },
    legend: { bottom: 0, textStyle: { color: DARK.axis } },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '44%'],
      itemStyle: { borderRadius: 6, borderColor: '#0a1224', borderWidth: 2 },
      label: { color: '#cfe0ff', fontSize: 11 },
      data: roles.map((r) => ({ name: r.role === 'admin' ? '管理员' : '普通用户', value: r.count })),
      color: ['#a78bfa', '#38bdf8'],
    }],
  })

  charts.mon.setOption({
    tooltip: { trigger: 'axis', ...DARK.tooltip },
    grid: { left: 46, right: 20, top: 30, bottom: 28 },
    xAxis: { type: 'category', data: mon.map((d) => d.month), axisLine: { lineStyle: { color: '#2a3f6e' } }, axisLabel: { color: DARK.axis } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: DARK.split } }, axisLabel: { color: DARK.axis } },
    series: [{
      type: 'bar',
      barWidth: '45%',
      data: mon.map((d) => d.cnt),
      itemStyle: { borderRadius: [6, 6, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#38bdf8' }, { offset: 1, color: '#2563eb' }]) },
    }],
  })

  charts.actions.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...DARK.tooltip },
    grid: { left: 14, right: 40, top: 12, bottom: 8, containLabel: true },
    xAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: DARK.split } }, axisLabel: { color: DARK.axis } },
    yAxis: { type: 'category', data: act.map((d) => d.name), axisLine: { lineStyle: { color: '#2a3f6e' } }, axisLabel: { color: '#cfe0ff', fontSize: 11 } },
    series: [{
      type: 'bar',
      barWidth: '50%',
      data: act.map((d) => d.value),
      itemStyle: { borderRadius: [0, 6, 6, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#2563eb' }, { offset: 1, color: '#38bdf8' }]) },
    }],
  })
}

function toggleFullscreen() {
  fullscreen.value = !fullscreen.value
  if (fullscreen.value) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
  setTimeout(() => Object.values(charts).forEach((c) => c?.resize()), 300)
}

function fmtBytes(b) {
  if (!b) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let n = Number(b)
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++ }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`
}

onMounted(() => {
  tickClock()
  clockTimer = setInterval(tickClock, 1000)
  load()
  timer = setInterval(load, 10000)
})

onBeforeUnmount(() => {
  clearInterval(timer)
  clearInterval(clockTimer)
  Object.values(charts).forEach((c) => c?.dispose())
})
</script>

<template>
  <div class="big-screen" :class="{ full: fullscreen }">
    <!-- 顶部 -->
    <div class="bs-header">
      <div class="bs-title">
        <span class="bs-deco" />
        <h1>数据监控大屏</h1>
        <span class="bs-deco" />
      </div>
      <div class="bs-sub">
        <span class="num">{{ clock }}</span>
        <button class="btn btn-ghost btn-small" @click="toggleFullscreen">
          {{ fullscreen ? '退出全屏' : '全屏' }}
        </button>
      </div>
    </div>

    <!-- 核心指标 -->
    <div class="bs-stats">
      <div class="bs-stat">
        <div class="bs-stat-num num">{{ overview.total }}</div>
        <div class="bs-stat-label">用户总数</div>
      </div>
      <div class="bs-stat">
        <div class="bs-stat-num num" style="color: var(--chart-emerald)">{{ overview.todayNew }}</div>
        <div class="bs-stat-label">今日新增</div>
      </div>
      <div class="bs-stat">
        <div class="bs-stat-num num" style="color: var(--warning)">{{ overview.active }}</div>
        <div class="bs-stat-label">启用账号</div>
      </div>
      <div class="bs-stat">
        <div class="bs-stat-num num" style="color: var(--chart-sky)">{{ onlineCount }}</div>
        <div class="bs-stat-label">实时在线</div>
      </div>
      <div class="bs-stat">
        <div class="bs-stat-num num" style="color: #c084fc">{{ server?.cpuUsage ?? '-' }}%</div>
        <div class="bs-stat-label">CPU</div>
      </div>
      <div class="bs-stat">
        <div class="bs-stat-num num" style="color: #f472b6">{{ server?.memUsage ?? '-' }}%</div>
        <div class="bs-stat-label">内存</div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="bs-charts">
      <div class="bs-chart">
        <div class="bs-chart-title">近 14 天注册趋势</div>
        <div id="bigTrend" class="bs-chart-body" />
      </div>
      <div class="bs-chart">
        <div class="bs-chart-title">角色分布</div>
        <div id="bigRoles" class="bs-chart-body" />
      </div>
      <div class="bs-chart">
        <div class="bs-chart-title">月度注册（近 6 月）</div>
        <div id="bigMon" class="bs-chart-body" />
      </div>
      <div class="bs-chart">
        <div class="bs-chart-title">近 7 天操作分布</div>
        <div id="bigActions" class="bs-chart-body" />
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="bs-foot">
      <div class="bs-foot-col">
        <div class="bs-foot-title">在线用户</div>
        <div class="bs-online">
          <span v-for="u in online.slice(0, 6)" :key="u.user_id" class="bs-user">
            {{ (u.name || '?').charAt(0) }}
          </span>
          <span v-if="!online.length" class="text-muted">暂无</span>
        </div>
      </div>
      <div class="bs-foot-col">
        <div class="bs-foot-title">主机</div>
        <div class="bs-host">
          {{ server?.hostname || '-' }} · {{ server?.platform || '-' }}
          <span class="num">{{ server ? fmtBytes(server.usedMem) + ' / ' + fmtBytes(server.totalMem) : '' }}</span>
        </div>
      </div>
      <div class="bs-foot-col">
        <div class="bs-foot-title">数据资产</div>
        <div class="bs-assets num">
          用户 {{ rowCounts.users ?? 0 }} · 日志 {{ rowCounts.logs ?? 0 }} · 任务 {{ rowCounts.tasks ?? 0 }} · 文件 {{ rowCounts.files ?? 0 }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.big-screen {
  background:
    radial-gradient(1200px 600px at 80% -10%, rgba(37, 99, 235, 0.22), transparent 60%),
    radial-gradient(900px 500px at -10% 110%, rgba(56, 189, 248, 0.15), transparent 55%),
    #0a1224;
  border: 1px solid rgba(94, 150, 255, 0.18);
  border-radius: 18px;
  padding: 24px 28px;
  min-height: 76vh;
  color: #e6edf7;
}
.big-screen.full {
  position: fixed;
  inset: 0;
  z-index: 999;
  border-radius: 0;
  min-height: 100vh;
  overflow-y: auto;
}
.bs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.bs-title {
  display: flex;
  align-items: center;
  gap: 16px;
}
.bs-title h1 {
  font-size: 22px;
  letter-spacing: 0.14em;
  background: linear-gradient(90deg, var(--chart-sky), var(--chart-magenta));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.bs-deco {
  width: 70px;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--chart-cyan), transparent);
}
.bs-sub {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #7dd3fc;
  font-size: 14px;
}
.bs-stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}
.bs-stat {
  background: rgba(15, 26, 48, 0.75);
  border: 1px solid rgba(94, 150, 255, 0.2);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  backdrop-filter: blur(10px);
}
.bs-stat-num {
  font-size: 28px;
  font-weight: 800;
  color: var(--chart-cyan);
  text-shadow: 0 0 18px rgba(56, 189, 248, 0.5);
}
.bs-stat-label {
  font-size: 12px;
  color: #7d90b8;
  margin-top: 4px;
}
.bs-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 18px;
}
.bs-chart {
  background: rgba(15, 26, 48, 0.6);
  border: 1px solid rgba(94, 150, 255, 0.18);
  border-radius: 14px;
  padding: 14px 16px;
}
.bs-chart-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #cfe0ff;
  margin-bottom: 8px;
  letter-spacing: 0.04em;
}
.bs-chart-body {
  height: 240px;
}
.bs-foot {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1.4fr;
  gap: 16px;
}
.bs-foot-col {
  background: rgba(15, 26, 48, 0.6);
  border: 1px solid rgba(94, 150, 255, 0.18);
  border-radius: 14px;
  padding: 14px 16px;
}
.bs-foot-title {
  font-size: 12px;
  color: #7d90b8;
  margin-bottom: 10px;
  letter-spacing: 0.1em;
}
.bs-online {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.bs-user {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--chart-cyan), var(--chart-blue));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
}
.bs-host {
  font-size: 13px;
  color: #cfe0ff;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bs-host .num {
  color: #7dd3fc;
  font-size: 12px;
}
.bs-assets {
  font-size: 13px;
  color: #cfe0ff;
}
@media (max-width: 1000px) {
  .bs-stats { grid-template-columns: repeat(3, 1fr); }
  .bs-charts { grid-template-columns: 1fr; }
  .bs-foot { grid-template-columns: 1fr; }
}
</style>
