<script setup>
/**
 * 仪表盘 v3：白色科技主题 · 8 组数据视图
 * 统计卡 + 月度注册趋势 + 近7天趋势 + 角色分布 + 部门分布 + 操作分布 + 在线用户 + 最近动态
 */
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import StatCard from '../components/StatCard.vue'
import { getOverview, getTrend, getRoles } from '../api/stats'
import { getLogs } from '../api/log'
import { getMonthly, getActions, getSystem } from '../api/dashboard'
import { getOnlineUsers } from '../api/monitor'
import { format } from '../utils/format'

const overview = ref({ total: 0, todayNew: 0, active: 0, latestUser: null })
const recentLogs = ref([])
const loading = ref(true)
const error = ref('')

const monthly = ref([])
const actionDist = ref([])
const systemInfo = ref({ users: 0, logs: 0, tasks: 0, files: 0, messages: 0, departments: [], regions: [], genders: [] })
const onlineUsers = ref([])

let chartTrend = null
let chartRoles = null
let chartMonthly = null
let chartDept = null
let chartActions = null

import { chartTheme, chartTooltip } from '../utils/chartTheme'

function initCharts() {
  chartTrend = echarts.init(document.getElementById('chartTrend'))
  chartRoles = echarts.init(document.getElementById('chartRoles'))
  chartMonthly = echarts.init(document.getElementById('chartMonthly'))
  chartDept = echarts.init(document.getElementById('chartDept'))
  chartActions = echarts.init(document.getElementById('chartActions'))
}

function renderTrend(data) {
  const ct = chartTheme()
  chartTrend.setOption({
    tooltip: { trigger: 'axis', ...chartTooltip(ct) },
    grid: { left: 46, right: 18, top: 28, bottom: 28 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.day.slice(5)),
      axisLine: { lineStyle: { color: ct.axisLine } },
      axisLabel: { color: ct.axis },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: ct.split } },
      axisLabel: { color: ct.axis },
    },
    series: [
      {
        name: '注册数',
        type: 'line',
        smooth: true,
        symbolSize: 8,
        data: data.map((d) => d.count),
        lineStyle: { color: ct.blue, width: 3, shadowColor: ct.blueShadow, shadowBlur: 10 },
        itemStyle: { color: ct.blue },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(37,99,235,0.22)' },
            { offset: 1, color: 'rgba(37,99,235,0)' },
          ]),
        },
      },
    ],
  })
}

function renderRoles(data) {
  const ct = chartTheme()
  chartRoles.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 人 ({d}%)', ...chartTooltip(ct) },
    legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: ct.axis } },
    series: [
      {
        type: 'pie',
        radius: ['48%', '72%'],
        center: ['50%', '44%'],
        itemStyle: { borderRadius: 8, borderColor: ct.tooltipBorder, borderWidth: 3 },
        label: { color: ct.axisLabel, formatter: '{b}\n{c} 人', fontSize: 12 },
        data: data.map((r) => ({
          name: r.role === 'admin' ? '管理员' : '普通用户',
          value: r.count,
        })),
        color: [ct.indigo, ct.cyan],
        emphasis: { scaleSize: 8, shadowBlur: 16, shadowColor: 'rgba(37,99,235,0.25)' },
      },
    ],
  })
}

function renderMonthly(data) {
  const ct = chartTheme()
  chartMonthly.setOption({
    tooltip: { trigger: 'axis', ...chartTooltip(ct) },
    grid: { left: 46, right: 18, top: 28, bottom: 28 },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.month),
      axisLine: { lineStyle: { color: ct.axisLine } },
      axisLabel: { color: ct.axis },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: ct.split } },
      axisLabel: { color: ct.axis },
    },
    series: [
      {
        name: '注册数',
        type: 'bar',
        barWidth: '46%',
        data: data.map((d) => d.cnt),
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: ct.blue },
            { offset: 1, color: ct.sky },
          ]),
        },
      },
    ],
  })
}

function renderDept(data) {
  const ct = chartTheme()
  chartDept.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 人 ({d}%)', ...chartTooltip(ct) },
    legend: { bottom: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: ct.axis } },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '44%'],
        itemStyle: { borderRadius: 6, borderColor: ct.tooltipBorder, borderWidth: 2 },
        label: { color: ct.axisLabel, fontSize: 11.5 },
        data: data,
        color: [ct.blue, ct.sky, ct.cyan, ct.teal, ct.indigo, ct.magenta, ct.violet, ct.purple],
      },
    ],
  })
}

function renderActions(data) {
  const ct = chartTheme()
  chartActions.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...chartTooltip(ct) },
    grid: { left: 14, right: 30, top: 10, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: ct.split } },
      axisLabel: { color: ct.axis },
    },
    yAxis: {
      type: 'category',
      data: data.map((d) => d.name),
      axisLine: { lineStyle: { color: ct.axisLine } },
      axisLabel: { color: ct.axisLabel, fontSize: 12 },
    },
    series: [
      {
        name: '次数',
        type: 'bar',
        barWidth: '55%',
        data: data.map((d) => d.value),
        label: { show: true, position: 'right', color: ct.axis, fontSize: 11.5 },
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: ct.cyan },
            { offset: 1, color: ct.blue },
          ]),
        },
      },
    ],
  })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [ov, trend, roles, logs, mon, act, sys, online] = await Promise.all([
      getOverview(),
      getTrend(7),
      getRoles(),
      getLogs({ page: 1, pageSize: 6 }),
      getMonthly(6),
      getActions(7),
      getSystem(),
      getOnlineUsers(),
    ])
    overview.value = ov.data
    recentLogs.value = logs.data.list
    monthly.value = mon?.data || []
    actionDist.value = act?.data || []
    systemInfo.value = sys?.data || {}
    onlineUsers.value = online?.users || []

    loading.value = false
    await nextTick()
    initCharts()
    renderTrend(trend.data || [])
    renderRoles(roles.data || [])
    renderMonthly(monthly.value)
    renderDept(systemInfo.value?.departments || [])
    renderActions(actionDist.value)
  } catch (e) {
    error.value = e.message
    loading.value = false
  }
}

function onResize() {
  ;[chartTrend, chartRoles, chartMonthly, chartDept, chartActions].forEach((c) => c?.resize())
}

const ACTION_LABEL = {
  LOGIN: '登录',
  LOGOUT: '登出',
  REGISTER: '注册',
  USER_CREATE: '创建用户',
  USER_UPDATE: '修改用户',
  USER_DELETE: '删除用户',
  USER_BATCH_DELETE: '批量删除',
  PASSWORD_CHANGE: '修改密码',
  PROFILE_UPDATE: '更新资料',
  NOTICE_CREATE: '发布公告',
  NOTICE_UPDATE: '修改公告',
  NOTICE_DELETE: '删除公告',
  TASK_CREATE: '创建任务',
  SESSION_KICK: '下线会话',
  USER_IMPORT: '导入用户',
  USER_BATCH_STATUS: '批量改状态',
  PASSWORD_RESET: '重置密码',
  FILE_CREATE: '上传文件',
}

function actionLabel(a) {
  return ACTION_LABEL[a] || a
}

function onThemeChange() {
  load()
}
onMounted(() => {
  load()
  window.addEventListener('resize', onResize)
  window.addEventListener('ems-theme-change', onThemeChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('ems-theme-change', onThemeChange)
  ;[chartTrend, chartRoles, chartMonthly, chartDept, chartActions].forEach((c) => c?.dispose())
})
</script>

<template>
  <div class="dashboard">
    <div class="page-head">
      <h2>数据概览</h2>
      <span class="sub">实时统计 · MySQL 数据源 · 安全会话已启用</span>
    </div>

    <div v-if="error" class="error-box">{{ error }}</div>

    <template v-if="!loading && !error">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <StatCard label="用户总数" :value="overview.total" hint="全部注册用户" tone="blue" />
        <StatCard label="今日新增" :value="overview.todayNew" hint="今天注册的用户" tone="green" />
        <StatCard label="启用账号" :value="overview.active" hint="状态为启用的账号" tone="violet" />
        <StatCard
          label="最新注册"
          :value="overview.latestUser ? overview.latestUser.name : '-'"
          :hint="overview.latestUser ? format.relativeTime(overview.latestUser.created_at) : '暂无数据'"
          tone="cyan"
        />
      </div>

      <!-- 数据资产行 -->
      <div class="asset-row">
        <div class="asset-item glass-card hoverable">
          <div class="asset-num num">{{ systemInfo.users }}</div>
          <div class="asset-label">用户</div>
        </div>
        <div class="asset-item glass-card hoverable">
          <div class="asset-num num">{{ systemInfo.logs }}</div>
          <div class="asset-label">日志</div>
        </div>
        <div class="asset-item glass-card hoverable">
          <div class="asset-num num">{{ systemInfo.tasks }}</div>
          <div class="asset-label">任务</div>
        </div>
        <div class="asset-item glass-card hoverable">
          <div class="asset-num num">{{ systemInfo.files }}</div>
          <div class="asset-label">文件</div>
        </div>
        <div class="asset-item glass-card hoverable">
          <div class="asset-num num">{{ systemInfo.messages }}</div>
          <div class="asset-label">消息</div>
        </div>
        <div class="asset-item glass-card hoverable">
          <div class="asset-num num">{{ onlineUsers.length }}</div>
          <div class="asset-label">在线</div>
        </div>
      </div>

      <!-- 图表区 -->
      <div class="charts-grid">
        <div class="glass-card chart-card">
          <div class="chart-title">
            <span>月度注册趋势</span>
            <span class="chart-tag">MONTHLY</span>
          </div>
          <div id="chartMonthly" class="chart"></div>
        </div>
        <div class="glass-card chart-card">
          <div class="chart-title">
            <span>近 7 天注册趋势</span>
            <span class="chart-tag">TREND</span>
          </div>
          <div id="chartTrend" class="chart"></div>
        </div>
        <div class="glass-card chart-card">
          <div class="chart-title">
            <span>角色分布</span>
            <span class="chart-tag">ROLES</span>
          </div>
          <div id="chartRoles" class="chart"></div>
        </div>
        <div class="glass-card chart-card">
          <div class="chart-title">
            <span>部门分布</span>
            <span class="chart-tag">DEPTS</span>
          </div>
          <div id="chartDept" class="chart"></div>
        </div>
      </div>

      <!-- 操作分布 + 在线用户 -->
      <div class="mixed-grid">
        <div class="glass-card chart-card">
          <div class="chart-title">
            <span>近 7 天操作分布</span>
            <span class="chart-tag">ACTIONS</span>
          </div>
          <div id="chartActions" class="chart chart-sm"></div>
        </div>
        <div class="glass-card chart-card">
          <div class="chart-title">
            <span>当前在线用户</span>
            <span class="chart-tag">ONLINE</span>
          </div>
          <div v-if="!onlineUsers.length" class="empty-state">暂无在线用户</div>
          <div v-else class="online-list">
            <div v-for="u in onlineUsers" :key="u.user_id" class="online-item">
              <span class="online-avatar">{{ (u.name || '?').charAt(0) }}</span>
              <div class="online-main">
                <div class="online-name">{{ u.name }}</div>
                <div class="online-sub num">{{ u.ip }} · {{ u.device }}</div>
              </div>
              <span class="online-time num">{{ u.last_active_at?.slice(11, 19) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近动态 -->
      <div class="glass-card feed-card">
        <div class="chart-title">
          <span>最近动态</span>
          <span class="chart-tag">AUDIT</span>
        </div>
        <ul v-if="recentLogs.length" class="feed-list">
          <li v-for="log in recentLogs" :key="log.id" class="feed-item">
            <span class="feed-dot" :class="`fd-${String(log.action).toLowerCase()}`" />
            <span class="feed-text">
              <b>{{ log.user_name || '系统' }}</b>
              {{ actionLabel(log.action) }}
            </span>
            <span class="feed-time num">{{ format.relativeTime(log.created_at) }}</span>
          </li>
        </ul>
        <p v-else class="empty-state">暂无动态</p>
      </div>
    </template>

    <div v-else class="loading-bar">
      <span class="spinner" />
      正在加载统计数据...
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.asset-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
}
.asset-item {
  padding: 14px 16px;
  text-align: center;
}
.asset-num {
  font-size: 22px;
  font-weight: 800;
  background: var(--gradient-main);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.asset-label {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 2px;
}
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.mixed-grid {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 16px;
  align-items: stretch;
}
.chart-card {
  padding: 18px 20px;
}
.chart-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}
.chart-tag {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 2px 10px;
}
.chart {
  height: 280px;
}
.chart-sm {
  height: 320px;
}
.feed-card {
  padding: 18px 20px;
}
.feed-list {
  list-style: none;
}
.feed-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 4px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13.5px;
}
.feed-item:last-child {
  border-bottom: none;
}
.feed-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.fd-login { background: var(--success); box-shadow: 0 0 8px rgba(15,169,104,0.6); }
.fd-logout { background: #97a5c2; }
.fd-register { background: var(--chart-blue); box-shadow: 0 0 8px rgba(59,130,246,0.6); }
.fd-user_create, .fd-user_update, .fd-profile_update { background: var(--chart-cyan); box-shadow: 0 0 8px rgba(56,189,248,0.6); }
.fd-user_delete, .fd-user_batch_delete { background: var(--danger); box-shadow: 0 0 8px rgba(229,72,77,0.6); }
.fd-password_change, .fd-password_reset { background: var(--warning); box-shadow: 0 0 8px rgba(232,150,12,0.6); }
.fd-notice_create, .fd-notice_update, .fd-notice_delete { background: var(--chart-violet); box-shadow: 0 0 8px rgba(139,92,246,0.6); }
.fd-task_create, .fd-session_kick { background: #06b6d4; box-shadow: 0 0 8px rgba(6,182,212,0.6); }
.fd-user_import, .fd-user_batch_status { background: #10b981; box-shadow: 0 0 8px rgba(16,185,129,0.6); }
.fd-file_create { background: var(--chart-indigo); box-shadow: 0 0 8px rgba(99,102,241,0.6); }
.feed-text {
  flex: 1;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.feed-text b {
  color: var(--text-primary);
  font-weight: 600;
}
.feed-time {
  font-size: 12px;
  color: var(--text-muted);
}
.online-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.online-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--bg-panel);
}
.online-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--gradient-main);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
}
.online-main {
  flex: 1;
  min-width: 0;
}
.online-name {
  font-weight: 600;
  font-size: 13px;
}
.online-sub {
  font-size: 11px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.online-time {
  font-size: 11px;
  color: var(--text-muted);
}
@media (max-width: 1000px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid,
  .mixed-grid {
    grid-template-columns: 1fr;
  }
  .asset-row {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
