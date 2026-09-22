<script setup>
/**
 * 系统工具中心 v2 —— 运行环境 / 资源水位 / 健康检查 / 数据规模 / 接口清单 / 缓存与安全
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getHealth, getPing, getTables, getRowCounts, getCacheStats, getApiList, getServerInfo } from '../api/tool'
import { useToast } from '../stores/toast'

const toast = useToast()

const health = ref(null)
const tables = ref([])
const rowCounts = ref({})
const cache = ref(null)
const apiList = ref([])
const server = ref(null)
const ping = ref(null)
const loading = ref(false)
const lastCheck = ref('')
const autoRefresh = ref(false)
const apiSearch = ref('')
let refreshTimer = null

const gaugeEl = ref(null)
const donutEl = ref(null)
let chartGauge = null
let chartHealth = null

/* ---------------- 数据加载 ---------------- */

async function runCheck() {
  loading.value = true
  try {
    const [h, t, rc, c, api, s, p] = await Promise.all([
      getHealth(), getTables(), getRowCounts(), getCacheStats(), getApiList(), getServerInfo(), getPing(),
    ])
    health.value = h?.data || null
    tables.value = t?.data || []
    rowCounts.value = rc?.data || {}
    cache.value = c?.data || null
    apiList.value = api?.data || []
    server.value = s?.data || null
    ping.value = p?.data || null
    lastCheck.value = new Date().toLocaleTimeString()
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
  await nextTick()
  renderCharts()
}

/* ---------------- 自动刷新 ---------------- */

function toggleAuto() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    refreshTimer = setInterval(() => runCheck(), 30000)
    toast.success('已开启自动刷新（每 30 秒）')
  } else {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

/* ---------------- 派生状态 ---------------- */

const statusPill = computed(() => ({
  ok: 'pill-success',
  warn: 'pill-warning',
  fail: 'pill-danger',
}[health.value?.overall] || 'pill-info'))

const statusText = computed(() => ({
  ok: '全部正常',
  warn: '存在警告',
  fail: '存在故障',
}[health.value?.overall] || '未知'))

const totalRows = computed(() => Object.values(rowCounts.value).reduce((a, b) => a + (b > 0 ? b : 0), 0))

/** 数据规模按行数降序 */
const sortedRows = computed(() => Object.entries(rowCounts.value).sort((a, b) => b[1] - a[1]))

function fmtNum(n) {
  if (n === null || n === undefined || n === -1) return '—'
  return Number(n).toLocaleString('en-US')
}
function pctOf(n) {
  if (!totalRows.value || !n || n < 0) return '0.0%'
  return ((n / totalRows.value) * 100).toFixed(1) + '%'
}

const pingLatency = computed(() => {
  if (!ping.value?.time) return '—'
  return Math.max(0, Date.now() - ping.value.time) + ' ms'
})

/* ---------------- 接口清单分组 ---------------- */

const API_GROUPS = [
  ['认证', ['/auth']],
  ['用户管理', ['/users']],
  ['角色权限', ['/roles', '/menus']],
  ['公告', ['/notices']],
  ['任务', ['/tasks']],
  ['消息', ['/messages']],
  ['文件', ['/files']],
  ['字典', ['/dict']],
  ['个人中心', ['/profile']],
  ['安全会话', ['/security']],
  ['系统配置', ['/settings']],
  ['数据统计', ['/stats', '/dashboard']],
  ['服务器监控', ['/monitor']],
  ['系统工具', ['/tools']],
  ['日志审计', ['/logs']],
]

function groupOf(path) {
  const seg = '/' + (String(path).split('/')[2] || '')
  const g = API_GROUPS.find(([, m]) => m.includes(seg))
  return g ? g[0] : '其他'
}

const filteredApis = computed(() => {
  const kw = apiSearch.value.trim().toLowerCase()
  if (!kw) return apiList.value
  return apiList.value.filter(
    (a) => a.path.toLowerCase().includes(kw) || (a.desc || '').toLowerCase().includes(kw) || (a.method || '').toLowerCase().includes(kw)
  )
})

const apiGroups = computed(() => {
  const map = new Map()
  for (const a of filteredApis.value) {
    const g = groupOf(a.path)
    if (!map.has(g)) map.set(g, [])
    map.get(g).push(a)
  }
  return [...map.entries()]
})

function methodCls(m) {
  if (m === 'GET') return 'pill-info'
  if (m === 'POST') return 'pill-success'
  if (m === 'DELETE') return 'pill-danger'
  return 'pill-warning'
}

/* ---------------- ECharts ---------------- */

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function initCharts() {
  if (chartGauge || !gaugeEl.value || !donutEl.value) return
  chartGauge = echarts.init(gaugeEl.value)
  chartHealth = echarts.init(donutEl.value)
  window.addEventListener('resize', onResize)
  window.addEventListener('ems-theme-change', onThemeChange)
  window.addEventListener('ems-font-change', onThemeChange)
}

function renderCharts() {
  if (!chartGauge) initCharts()
  if (!chartGauge) return
  chartGauge.setOption(gaugeOption(), true)
  chartHealth.setOption(healthOption(), true)
}

function gaugeOption() {
  const textColor = cssVar('--text-primary') || '#16233b'
  const muted = cssVar('--text-muted') || '#97a5c2'
  const blue = cssVar('--primary') || '#2563eb'
  const green = cssVar('--success') || '#0fa968'
  const orange = cssVar('--warning') || '#e8960c'
  const track = cssVar('--bg-input') || '#f8fafd'
  const memPct = server.value?.memUsage ?? 0
  const cpuPct = server.value?.cpuUsage ?? 0
  const diskCheck = health.value?.checks?.find((c) => c.name === '磁盘水位')
  const diskPct = diskCheck ? parseFloat(diskCheck.value) || 0 : 0

  const mk = (name, value, color, center) => ({
    name,
    type: 'gauge',
    center,
    radius: '80%',
    min: 0,
    max: 100,
    startAngle: 205,
    endAngle: -25,
    splitNumber: 5,
    axisLine: { lineStyle: { width: 9, color: [[1, track]] } },
    progress: { show: true, width: 9, roundCap: true, itemStyle: { color } },
    pointer: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
    anchor: { show: false },
    title: { offsetCenter: [0, '26%'], fontSize: 11, color: muted, fontWeight: 600 },
    detail: { offsetCenter: [0, '-12%'], fontSize: 16, fontWeight: 700, color: textColor, formatter: (v) => `${Math.round(v * 10) / 10}%` },
    data: [{ value: Math.round(value * 10) / 10, name }],
  })

  return {
    textStyle: { fontFamily: cssVar('--font-family') || undefined },
    series: [
      mk('CPU 使用率', cpuPct, blue, ['22%', '56%']),
      mk('内存使用率', memPct, green, ['50%', '56%']),
      mk('磁盘占用率', diskPct, orange, ['78%', '56%']),
    ],
  }
}

function healthOption() {
  const s = health.value?.summary
  const overall = health.value?.overall || 'ok'
  const text = { ok: '全部正常', warn: '存在警告', fail: '存在故障' }[overall] || '未知'
  const textColor = cssVar('--text-primary') || '#16233b'
  const muted = cssVar('--text-muted') || '#97a5c2'
  const green = cssVar('--success') || '#0fa968'
  const orange = cssVar('--warning') || '#e8960c'
  const red = cssVar('--danger') || '#e5484d'

  return {
    textStyle: { fontFamily: cssVar('--font-family') || undefined },
    title: {
      text,
      subtext: `共 ${s?.total || 0} 项检查`,
      left: 'center',
      top: '34%',
      textStyle: { fontSize: 13, fontWeight: 700, color: textColor },
      subtextStyle: { fontSize: 10, color: muted },
    },
    legend: {
      bottom: 2,
      left: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 10, color: muted },
      data: ['正常', '警告', '故障'],
    },
    series: [
      {
        type: 'pie',
        radius: ['58%', '76%'],
        center: ['50%', '46%'],
        silent: true,
        label: { show: false },
        data: [
          { value: s?.ok ?? 0, name: '正常', itemStyle: { color: green } },
          { value: s?.warn ?? 0, name: '警告', itemStyle: { color: orange } },
          { value: s?.fail ?? 0, name: '故障', itemStyle: { color: red } },
        ],
      },
    ],
  }
}

function onResize() {
  chartGauge?.resize()
  chartHealth?.resize()
}

function onThemeChange() {
  renderCharts()
}

/* ---------------- 报告导出 ---------------- */

function exportReport() {
  if (!health.value) return
  const payload = {
    product: '企业管理系统 v4.0',
    type: '系统工具诊断报告',
    exportedAt: new Date().toLocaleString('zh-CN'),
    checkedAt: health.value.checkedAt,
    summary: {
      overall: health.value.overall,
      total: health.value.summary.total,
      ok: health.value.summary.ok,
      warn: health.value.summary.warn,
      fail: health.value.summary.fail,
    },
    server: server.value,
    ping: ping.value,
    healthChecks: health.value.checks,
    rowCounts: rowCounts.value,
    tables: tables.value,
    cache: cache.value,
    apiCount: apiList.value.length,
    apiList: apiList.value,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `sys-tools-report-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
  toast.success('诊断报告已导出')
}

/* ---------------- 生命周期 ---------------- */

onMounted(() => {
  runCheck()
})

onBeforeUnmount(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('ems-theme-change', onThemeChange)
  window.removeEventListener('ems-font-change', onThemeChange)
  chartGauge?.dispose()
  chartHealth?.dispose()
  chartGauge = null
  chartHealth = null
})
</script>

<template>
  <div>
    <div class="page-head">
      <h2>系统工具</h2>
      <span class="sub">运行环境 · 资源水位 · 健康检查 · 数据规模 · 接口清单 · 缓存与安全</span>
      <div class="actions">
        <button class="btn" :class="autoRefresh ? 'btn-primary' : ''" :disabled="loading" @click="toggleAuto">
          {{ autoRefresh ? '⏸ 自动刷新中' : '▶ 自动刷新' }}
        </button>
        <button class="btn btn-primary" :disabled="loading" @click="runCheck">
          {{ loading ? '诊断中…' : '⟳ 立即诊断' }}
        </button>
        <button class="btn" :disabled="!health" @click="exportReport">⇩ 导出报告</button>
      </div>
    </div>

    <!-- 运行环境与资源水位 -->
    <section class="glass-card mb-16">
      <div class="card-head">
        <div class="card-title">运行环境与资源水位</div>
        <span class="pill pill-info" v-if="server">Node {{ server.nodeVersion }} · {{ server.arch }}</span>
      </div>
      <div class="env-body">
        <div class="env-info">
          <div class="env-row"><span>主机名</span><b class="num">{{ server?.hostname || '—' }}</b></div>
          <div class="env-row"><span>系统平台</span><b class="num">{{ server?.platform || '—' }}</b></div>
          <div class="env-row"><span>CPU 型号</span><b class="num">{{ (server?.cpuModel || '—').split('@')[0].trim() }}</b></div>
          <div class="env-row"><span>CPU 核数</span><b class="num">{{ server?.cpuCores ?? '—' }} 核</b></div>
          <div class="env-row"><span>系统运行时长</span><b class="num">{{ server?.uptime || '—' }}</b></div>
          <div class="env-row"><span>进程运行时长</span><b class="num">{{ server?.processUptime || '—' }}</b></div>
        </div>
        <div ref="gaugeEl" class="gauge-box" />
      </div>
    </section>

    <div v-if="loading" class="loading-bar"><span class="spinner" />运行深度诊断…</div>

    <template v-else>
      <!-- 健康总览 -->
      <div class="glass-card mb-16 health-banner" :class="`hb-${health?.overall || 'ok'}`">
        <div class="hb-icon">{{ health?.overall === 'ok' ? '✓' : health?.overall === 'warn' ? '!' : '✕' }}</div>
        <div class="hb-main">
          <div class="hb-title">系统健康：{{ statusText }}</div>
          <div class="hb-sub" v-if="health">
            共 {{ health.summary.total }} 项检查 · 正常 <b class="num">{{ health.summary.ok }}</b> · 警告 <b class="num">{{ health.summary.warn }}</b> · 故障 <b class="num">{{ health.summary.fail }}</b>
            · 检查时间 {{ lastCheck }}
          </div>
        </div>
        <div ref="donutEl" class="donut-box" />
        <span class="pill" :class="statusPill">{{ statusText }}</span>
      </div>

      <!-- 检查明细 -->
      <section v-if="health" class="glass-card mb-16">
        <div class="card-head"><div class="card-title">检查明细</div></div>
        <div class="check-grid">
          <div v-for="c in health.checks" :key="c.name" class="check-item">
            <span class="pill" :class="{ ok: 'pill-success', warn: 'pill-warning', fail: 'pill-danger' }[c.status]">
              {{ { ok: '正常', warn: '警告', fail: '故障' }[c.status] }}
            </span>
            <div class="check-name">{{ c.name }}</div>
            <div class="check-value num">{{ c.value }}</div>
            <div class="check-detail text-xs">{{ c.detail }}</div>
          </div>
        </div>
      </section>

      <!-- 数据规模 / 表结构 -->
      <div class="tools-grid">
        <section class="glass-card">
          <div class="card-head">
            <div class="card-title">数据规模</div>
            <span class="pill pill-info">{{ Object.keys(rowCounts).length }} 张表 · 行数降序</span>
          </div>
          <div class="rows-list">
            <div v-for="[name, cnt] in sortedRows" :key="name" class="row-item" :title="`${name}：${fmtNum(cnt)} 行 · 占比 ${pctOf(cnt)}`">
              <span class="row-name num">{{ name }}</span>
              <div class="row-bar">
                <div class="row-fill" :style="{ width: totalRows ? Math.max(4, cnt / totalRows * 100) + '%' : '4%' }" />
              </div>
              <span class="row-pct num text-xs">{{ pctOf(cnt) }}</span>
              <span class="row-cnt num">{{ fmtNum(cnt) }}</span>
            </div>
          </div>
          <div class="total-line text-sm">
            合计记录：<b class="num">{{ fmtNum(totalRows) }}</b>
          </div>
        </section>

        <section class="glass-card">
          <div class="card-head">
            <div class="card-title">表结构信息</div>
            <span class="pill pill-info">{{ tables.length }} 张</span>
          </div>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr><th>表名</th><th>引擎</th><th>估算行数</th><th>排序规则</th><th>创建时间</th></tr>
              </thead>
              <tbody>
                <tr v-for="t in tables" :key="t.name">
                  <td class="num table-name">{{ t.name }}</td>
                  <td><span class="engine-tag">{{ t.engine }}</span></td>
                  <td class="num text-sm">{{ fmtNum(t.rows_est) }}</td>
                  <td class="text-muted text-sm num">{{ t.collation }}</td>
                  <td class="text-muted text-sm num">{{ (t.created_at || '').slice(0, 10) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- 接口清单 -->
      <section class="glass-card mb-16">
        <div class="card-head">
          <div class="card-title">接口清单</div>
          <div class="api-head-right">
            <span class="pill pill-violet">{{ apiList.length }} 个接口</span>
            <input v-model="apiSearch" class="input api-search" placeholder="搜索接口路径 / 描述…" />
          </div>
        </div>
        <div v-if="apiGroups.length" class="api-groups">
          <div v-for="[group, items] in apiGroups" :key="group" class="api-group">
            <div class="api-group-title">{{ group }} <span class="num">{{ items.length }}</span></div>
            <div class="api-item" v-for="a in items" :key="a.method + a.path">
              <span class="pill api-method" :class="methodCls(a.method)">{{ a.method }}</span>
              <code class="api-path num">{{ a.path }}</code>
              <span class="api-desc">{{ a.desc }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">未找到匹配接口</div>
      </section>

      <!-- 快速探活 / 缓存与安全 -->
      <div class="tools-grid">
        <section class="glass-card">
          <div class="card-head"><div class="card-title">快速探活</div></div>
          <div v-if="ping" class="ping-grid">
            <div class="ping-item">
              <div class="ping-dot" :class="ping.db === 'ok' ? 'dot-ok' : 'dot-bad'" />
              <span>数据库</span>
              <b class="num">{{ ping.db === 'ok' ? '可达' : '异常' }}</b>
            </div>
            <div class="ping-item">
              <div class="ping-dot dot-ok" />
              <span>API 服务</span>
              <b class="num">在线</b>
            </div>
            <div class="ping-item">
              <div class="ping-dot" :class="'dot-ok'" />
              <span>响应延迟</span>
              <b class="num">{{ pingLatency }}</b>
            </div>
          </div>
          <div class="sec-tips">
            <div class="sec-tip">✓ 自动清理 24 小时未活跃会话</div>
            <div class="sec-tip">✓ 健康检查覆盖进程 / 数据库 / 内存 / 磁盘 / 会话 / 安全 / 数据规模</div>
          </div>
        </section>

        <section class="glass-card">
          <div class="card-head"><div class="card-title">缓存与安全</div></div>
          <div v-if="cache" class="info-list">
            <div class="info-row"><span>引擎</span><b class="num">{{ cache.engine }}</b></div>
            <div class="info-row"><span>黑名单条目</span><b class="num">{{ cache.entries }}</b></div>
            <div class="info-row"><span>自动清理</span><b class="num">每 {{ cache.autoCleanupMinutes }} 分钟</b></div>
            <div class="info-row"><span>最近清理</span><b class="num">{{ cache.lastCleanup?.slice(0, 19) }}</b></div>
          </div>
          <div class="sec-tips">
            <div class="sec-tip">✓ JWT 黑名单（登出即失效）</div>
            <div class="sec-tip">✓ 登录锁定：5 次错误锁 15 分钟</div>
            <div class="sec-tip">✓ 登录限流：每分钟 10 次</div>
            <div class="sec-tip">✓ RBAC 权限校验中间件</div>
            <div class="sec-tip">✓ 敏感操作全审计</div>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.health-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
}
.hb-ok { border-left: 4px solid var(--success); }
.hb-warn { border-left: 4px solid var(--warning); }
.hb-fail { border-left: 4px solid var(--danger); }
.hb-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 800;
  flex-shrink: 0;
}
.hb-ok .hb-icon { background: var(--success-soft); color: var(--success); }
.hb-warn .hb-icon { background: var(--warning-soft); color: var(--warning); }
.hb-fail .hb-icon { background: var(--danger-soft); color: var(--danger); }
.hb-main { flex: 1; min-width: 0; }
.hb-title { font-size: 17px; font-weight: 700; }
.hb-sub { font-size: 12.5px; color: var(--text-muted); margin-top: 4px; }
.donut-box { width: 170px; height: 108px; flex-shrink: 0; }
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-subtle);
}
.card-title { font-size: 15px; font-weight: 700; }
.env-body { display: flex; gap: 24px; padding: 16px 18px; align-items: center; }
.env-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 28px; flex: 1; min-width: 280px; }
.env-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 2px;
  border-bottom: 1px dashed var(--border-subtle);
  font-size: 12.5px;
  color: var(--text-secondary);
}
.env-row b {
  color: var(--text-primary);
  font-weight: 600;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.gauge-box { width: 560px; height: 190px; flex-shrink: 0; }
.check-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
  padding: 16px 18px;
}
.check-item {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px;
  background: var(--bg-panel);
}
.check-name { font-weight: 600; font-size: 13.5px; margin: 8px 0 4px; }
.check-value { font-size: 13px; color: var(--primary); font-weight: 700; }
.check-detail { color: var(--text-muted); margin-top: 4px; word-break: break-all; }
.tools-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}
.rows-list { padding: 12px 18px; display: flex; flex-direction: column; gap: 8px; }
.row-item { display: flex; align-items: center; gap: 10px; }
.row-name { width: 110px; font-size: 12px; color: var(--text-secondary); }
.row-bar { flex: 1; height: 7px; background: var(--bg-canvas); border-radius: 999px; overflow: hidden; }
.row-fill { height: 100%; background: var(--gradient-main); border-radius: 999px; transition: width 0.6s; }
.row-pct { width: 44px; text-align: right; color: var(--text-muted); }
.row-cnt { width: 52px; text-align: right; font-size: 12px; color: var(--text-primary); }
.total-line { padding: 10px 18px 16px; border-top: 1px solid var(--border-subtle); color: var(--text-muted); }
.table-wrap { padding: 0 18px 16px; overflow-x: auto; max-height: 460px; overflow-y: auto; }
.table-name { color: var(--primary); font-weight: 600; }
.engine-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  color: var(--chart-cyan);
  background: var(--info-soft);
  border: 1px solid rgba(37, 99, 235, 0.15);
  border-radius: 6px;
  padding: 1px 8px;
}
.info-list { padding: 12px 18px; }
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 4px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 13px;
  color: var(--text-secondary);
}
.info-row b { color: var(--text-primary); font-weight: 600; }
.sec-tips { padding: 12px 18px 16px; display: flex; flex-direction: column; gap: 8px; }
.sec-tip { font-size: 12.5px; color: var(--text-secondary); }
.api-head-right { display: flex; align-items: center; gap: 10px; }
.api-search { width: 230px; padding: 6px 12px; font-size: 12.5px; }
.api-groups { padding: 8px 18px 16px; display: flex; flex-direction: column; gap: 14px; max-height: 460px; overflow-y: auto; }
.api-group-title {
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-secondary);
  margin: 6px 0 4px;
  letter-spacing: 0.04em;
}
.api-group-title span { color: var(--text-muted); margin-left: 6px; }
.api-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 12.5px;
}
.api-item:hover { background: var(--bg-hover); }
.api-method { min-width: 62px; justify-content: center; font-weight: 700; }
.api-path { font-size: 12px; color: var(--text-primary); flex-shrink: 0; }
.api-desc { color: var(--text-muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ping-grid { padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; }
.ping-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-secondary);
}
.ping-item b { margin-left: auto; color: var(--text-primary); }
.ping-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--border-strong);
}
.dot-ok { background: var(--success); box-shadow: 0 0 0 3px var(--success-soft); }
.dot-bad { background: var(--danger); box-shadow: 0 0 0 3px var(--danger-soft); }
@media (max-width: 1000px) {
  .tools-grid { grid-template-columns: 1fr; }
  .env-body { flex-direction: column; align-items: stretch; }
  .gauge-box { width: 100%; }
}
</style>
