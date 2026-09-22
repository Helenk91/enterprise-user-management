<script setup>
/**
 * 系统自测 v2 —— 17 项全链路自检，按 环境/数据库/认证/安全/数据 分类
 * 状态环形图 + 历史通过率趋势 + JSON/HTML 报告导出
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { runSelfTest } from '../api/selftest'
import { useToast } from '../stores/toast'

const toast = useToast()

const result = ref(null)
const loading = ref(false)
const expanded = ref(new Set())
const history = ref([])

const donutEl = ref(null)
const trendEl = ref(null)
let chartDonut = null
let chartTrend = null

const HISTORY_KEY = 'ems-selftest-history'

const STATUS_META = {
  pass: { label: '通过', cls: 'pill-success' },
  warn: { label: '警告', cls: 'pill-warning' },
  fail: { label: '失败', cls: 'pill-danger' },
}

const CATEGORY_META = {
  env: { label: '运行环境', cls: 'pill-info' },
  db: { label: '数据库', cls: 'pill-violet' },
  auth: { label: '认证链路', cls: 'pill-success' },
  security: { label: '安全防护', cls: 'pill-warning' },
  data: { label: '数据与业务', cls: 'pill-info' },
}

/* ---------------- 自测执行 ---------------- */

async function run() {
  loading.value = true
  try {
    const res = await runSelfTest()
    result.value = res.data
    saveHistory(res.data.summary)
    toast.success(res.message || '自测完成')
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
  await nextTick()
  renderCharts()
}

/* ---------------- 历史记录（localStorage） ---------------- */

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []
  } catch {
    return []
  }
}

function saveHistory(summary) {
  const item = {
    t: Date.now(),
    status: summary.status,
    pass: summary.pass,
    warn: summary.warn,
    fail: summary.fail,
    total: summary.total,
    elapsed: summary.elapsed,
  }
  const list = [...history.value.filter((h) => h.t !== item.t), item].slice(-10)
  history.value = list
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
}

/* ---------------- 派生状态 ---------------- */

const grouped = computed(() => {
  if (!result.value) return []
  const cats = (result.value.summary.categories || []).map((c) => ({ ...c, checks: [] }))
  for (const c of result.value.checks) {
    let g = cats.find((x) => x.key === c.category)
    if (!g) {
      g = { key: c.category, label: CATEGORY_META[c.category]?.label || c.category, checks: [], total: 0, pass: 0, warn: 0, fail: 0 }
      cats.push(g)
    }
    g.checks.push(c)
  }
  return cats
})

function statusText(s) {
  return (STATUS_META[s] || STATUS_META.pass).label
}
function statusCls(s) {
  return (STATUS_META[s] || STATUS_META.pass).cls
}
function catCls(key) {
  return (CATEGORY_META[key] || CATEGORY_META.data).cls
}
function toggleExpand(i) {
  const set = new Set(expanded.value)
  set.has(i) ? set.delete(i) : set.add(i)
  expanded.value = set
}

/* ---------------- ECharts ---------------- */

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function initCharts() {
  if (chartDonut || !donutEl.value || !trendEl.value) return
  chartDonut = echarts.init(donutEl.value)
  chartTrend = echarts.init(trendEl.value)
  window.addEventListener('resize', onResize)
  window.addEventListener('ems-theme-change', onThemeChange)
  window.addEventListener('ems-font-change', onThemeChange)
}

function renderCharts() {
  if (!chartDonut) initCharts()
  if (!chartDonut) return
  chartDonut.setOption(donutOption(), true)
  chartTrend.setOption(trendOption(), true)
}

function donutOption() {
  const s = result.value?.summary
  const textColor = cssVar('--text-primary') || '#16233b'
  const muted = cssVar('--text-muted') || '#97a5c2'
  const green = cssVar('--success') || '#0fa968'
  const orange = cssVar('--warning') || '#e8960c'
  const red = cssVar('--danger') || '#e5484d'

  return {
    textStyle: { fontFamily: cssVar('--font-family') || undefined },
    title: {
      text: s ? `${s.pass}/${s.total}` : '—',
      subtext: '项通过',
      left: 'center',
      top: '32%',
      textStyle: { fontSize: 20, fontWeight: 800, color: textColor },
      subtextStyle: { fontSize: 10, color: muted },
    },
    series: [
      {
        type: 'pie',
        radius: ['62%', '82%'],
        center: ['50%', '48%'],
        silent: true,
        label: { show: false },
        data: [
          { value: s?.pass ?? 0, name: '通过', itemStyle: { color: green } },
          { value: s?.warn ?? 0, name: '警告', itemStyle: { color: orange } },
          { value: s?.fail ?? 0, name: '失败', itemStyle: { color: red } },
        ],
      },
    ],
  }
}

function trendOption() {
  const list = history.value
  const textColor = cssVar('--text-primary') || '#16233b'
  const muted = cssVar('--text-muted') || '#97a5c2'
  const colorOf = { pass: '#0fa968', warn: '#e8960c', fail: '#e5484d' }
  const data = list.map((h) => ({
    value: Math.round((h.pass / h.total) * 100),
    itemStyle: { color: colorOf[h.status] || '#2563eb', borderRadius: [4, 4, 0, 0] },
  }))

  return {
    textStyle: { fontFamily: cssVar('--font-family') || undefined },
    grid: { left: 42, right: 14, top: 26, bottom: 26 },
    tooltip: {
      trigger: 'axis',
      formatter: (ps) => {
        const h = list[ps[0].dataIndex]
        if (!h) return ''
        const time = new Date(h.t).toLocaleString('zh-CN', { hour12: false })
        return `${time}<br/>通过率 ${Math.round((h.pass / h.total) * 100)}%（${h.pass}/${h.total}）<br/>警告 ${h.warn} · 失败 ${h.fail} · 耗时 ${h.elapsed}ms`
      },
    },
    xAxis: {
      type: 'category',
      data: list.map((h) => new Date(h.t).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })),
      axisLine: { lineStyle: { color: cssVar('--border-strong') || '#c9d6ea' } },
      axisLabel: { fontSize: 10, color: muted },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { fontSize: 10, color: muted, formatter: '{value}%' },
      splitLine: { lineStyle: { color: cssVar('--border-subtle') || '#e5ebf5' } },
    },
    series: [
      {
        type: 'bar',
        data,
        barWidth: 22,
        label: { show: true, position: 'top', fontSize: 10, color: textColor, formatter: (p) => `${p.value}%` },
      },
    ],
  }
}

function onResize() {
  chartDonut?.resize()
  chartTrend?.resize()
}

function onThemeChange() {
  renderCharts()
}

/* ---------------- 报告导出 ---------------- */

function exportReport(type) {
  if (!result.value) return
  const payload = {
    product: '企业管理系统 v4.0',
    type: '系统自测报告',
    exportedAt: new Date().toLocaleString('zh-CN'),
    summary: result.value.summary,
    checks: result.value.checks,
  }
  if (type === 'html') {
    const html = buildHtmlReport(payload)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `selftest-report-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('HTML 报告已导出')
  } else {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `selftest-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success('JSON 报告已导出')
  }
}

function buildHtmlReport(payload) {
  const s = payload.summary
  const colorOf = { pass: '#0fa968', warn: '#e8960c', fail: '#e5484d' }
  const labelOf = { pass: '通过', warn: '警告', fail: '失败' }
  const catLabel = { env: '运行环境', db: '数据库', auth: '认证链路', security: '安全防护', data: '数据与业务' }
  const statusBadge = s.status === 'pass' ? '全部通过' : s.status === 'warn' ? '存在警告' : '存在失败'
  const catHtml = (s.categories || [])
    .map(
      (c) => `<div style="display:inline-block;margin:4px 10px 4px 0;padding:6px 14px;border-radius:999px;background:#eef4ff;color:#2563eb;font-size:12px;">
         ${catLabel[c.key] || c.label}：${c.pass}/${c.total} 通过</div>`
    )
    .join('')
  const rows = payload.checks
    .map((c, i) => {
      const color = colorOf[c.status] || '#2563eb'
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f9;color:#97a5c2;font-size:12px;">${String(i + 1).padStart(2, '0')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f9;font-size:12px;">${catLabel[c.category] || c.category}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f9;font-weight:600;">${c.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f9;"><span style="display:inline-block;padding:2px 10px;border-radius:999px;background:${color}18;color:${color};font-size:12px;font-weight:600;">${labelOf[c.status] || c.status}</span></td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f9;font-family:Consolas,monospace;font-size:12px;">${c.value || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f9;color:#55648a;font-size:12px;">${c.detail || ''}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f9;color:#97a5c2;font-family:Consolas,monospace;font-size:12px;text-align:right;">${c.ms}ms</td>
      </tr>`
    })
    .join('')
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<title>系统自测报告 - 企业管理系统</title>
</head>
<body style="margin:0;background:#f2f6fc;font-family:'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;color:#16233b;">
  <div style="max-width:1080px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border:1px solid #e5ebf5;border-radius:16px;padding:28px 32px;box-shadow:0 6px 24px rgba(23,43,77,.07);">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <h1 style="margin:0;font-size:22px;">系统自测报告</h1>
          <p style="margin:6px 0 0;color:#97a5c2;font-size:12.5px;">${payload.product} · 导出时间 ${payload.exportedAt}</p>
        </div>
        <span style="display:inline-block;padding:6px 18px;border-radius:999px;background:${colorOf[s.status]}18;color:${colorOf[s.status]};font-weight:700;font-size:14px;">${statusBadge}</span>
      </div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:20px;">
        <div style="flex:1;min-width:140px;padding:14px 18px;background:#f8fafd;border-radius:12px;border:1px solid #e5ebf5;">
          <div style="font-size:12px;color:#97a5c2;">检查总数</div>
          <div style="font-size:24px;font-weight:800;margin-top:4px;">${s.total}</div>
        </div>
        <div style="flex:1;min-width:140px;padding:14px 18px;background:#e8f8f0;border-radius:12px;border:1px solid #e8f8f0;">
          <div style="font-size:12px;color:#0fa968;">通过</div>
          <div style="font-size:24px;font-weight:800;margin-top:4px;color:#0fa968;">${s.pass}</div>
        </div>
        <div style="flex:1;min-width:140px;padding:14px 18px;background:#fdf3e2;border-radius:12px;border:1px solid #fdf3e2;">
          <div style="font-size:12px;color:#e8960c;">警告</div>
          <div style="font-size:24px;font-weight:800;margin-top:4px;color:#e8960c;">${s.warn}</div>
        </div>
        <div style="flex:1;min-width:140px;padding:14px 18px;background:#fdecec;border-radius:12px;border:1px solid #fdecec;">
          <div style="font-size:12px;color:#e5484d;">失败</div>
          <div style="font-size:24px;font-weight:800;margin-top:4px;color:#e5484d;">${s.fail}</div>
        </div>
        <div style="flex:1;min-width:140px;padding:14px 18px;background:#f8fafd;border-radius:12px;border:1px solid #e5ebf5;">
          <div style="font-size:12px;color:#97a5c2;">耗时</div>
          <div style="font-size:24px;font-weight:800;margin-top:4px;">${s.elapsed} ms</div>
        </div>
      </div>
      <div style="margin-top:16px;">${catHtml}</div>
      <h2 style="font-size:16px;margin:24px 0 10px;">检查明细</h2>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;min-width:820px;">
          <thead>
            <tr style="background:#f8fafd;">
              <th style="text-align:left;padding:10px 12px;font-size:12px;color:#55648a;">#</th>
              <th style="text-align:left;padding:10px 12px;font-size:12px;color:#55648a;">分类</th>
              <th style="text-align:left;padding:10px 12px;font-size:12px;color:#55648a;">检查项</th>
              <th style="text-align:left;padding:10px 12px;font-size:12px;color:#55648a;">状态</th>
              <th style="text-align:left;padding:10px 12px;font-size:12px;color:#55648a;">结果</th>
              <th style="text-align:left;padding:10px 12px;font-size:12px;color:#55648a;">详情</th>
              <th style="text-align:right;padding:10px 12px;font-size:12px;color:#55648a;">耗时</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p style="margin-top:20px;color:#97a5c2;font-size:11.5px;">本报告由系统自测生成 · 数据实时取自 MySQL（库名 userdb）· 自测时间 ${new Date(s.ranAt).toLocaleString('zh-CN', { hour12: false })}</p>
    </div>
  </div>
</body>
</html>`
}

/* ---------------- 生命周期 ---------------- */

onMounted(() => {
  history.value = loadHistory()
  run()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('ems-theme-change', onThemeChange)
  window.removeEventListener('ems-font-change', onThemeChange)
  chartDonut?.dispose()
  chartTrend?.dispose()
  chartDonut = null
  chartTrend = null
})
</script>

<template>
  <div>
    <div class="page-head">
      <h2>系统自测</h2>
      <span class="sub">17 项全链路自检 · 运行环境 / 数据库 / 认证 / 安全 / 数据 · 结果可导出</span>
      <div class="actions">
        <button class="btn btn-primary" :disabled="loading" @click="run">
          <span class="btn-spin" v-if="loading" />
          {{ loading ? '自测中…' : '⟳ 重新自测' }}
        </button>
        <button class="btn" :disabled="!result" @click="exportReport('json')">⇩ 导出 JSON</button>
        <button class="btn" :disabled="!result" @click="exportReport('html')">⇩ 导出 HTML 报告</button>
      </div>
    </div>

    <!-- 总览 -->
    <div class="overview-grid mb-16">
      <div class="glass-card metric-card status-card">
        <div class="metric-label">自检状态</div>
        <div class="metric-value">
          <span :class="['status-badge', statusCls(result?.summary.status)]">{{ statusText(result?.summary.status) }}</span>
        </div>
        <div class="metric-sub" v-if="result">共 {{ result.summary.total }} 项 · 耗时 {{ result.summary.elapsed }} ms</div>
        <div ref="donutEl" class="donut-box" />
      </div>
      <div class="glass-card metric-card hoverable">
        <div class="metric-label">通过</div>
        <div class="metric-value num" style="-webkit-text-fill-color: var(--success)">{{ result?.summary.pass ?? '—' }}</div>
        <div class="metric-sub">全部检查项通过</div>
      </div>
      <div class="glass-card metric-card hoverable">
        <div class="metric-label">警告</div>
        <div class="metric-value num" style="-webkit-text-fill-color: var(--warning)">{{ result?.summary.warn ?? '—' }}</div>
        <div class="metric-sub">需关注项</div>
      </div>
      <div class="glass-card metric-card hoverable">
        <div class="metric-label">失败</div>
        <div class="metric-value num" style="-webkit-text-fill-color: var(--danger)">{{ result?.summary.fail ?? '—' }}</div>
        <div class="metric-sub">需立即处理</div>
      </div>
      <div class="glass-card metric-card hoverable">
        <div class="metric-label">最近运行</div>
        <div class="metric-value num fs-20">{{ result ? new Date(result.summary.ranAt).toLocaleTimeString('zh-CN') : '—' }}</div>
        <div class="metric-sub">运行后数据实时取自 MySQL</div>
      </div>
    </div>

    <!-- 分类汇总 -->
    <div v-if="result" class="cat-summary mb-16">
      <span v-for="c in result.summary.categories" :key="c.key" class="pill cat-chip" :class="catCls(c.key)">
        {{ c.label }} {{ c.pass }}/{{ c.total }}
        <template v-if="c.warn || c.fail">（{{ c.warn ? '警告 ' + c.warn : '' }}{{ c.fail ? '失败 ' + c.fail : '' }}）</template>
      </span>
    </div>

    <!-- 历史趋势 -->
    <section v-if="history.length" class="glass-card mb-16">
      <div class="card-head">
        <div class="card-title">历史自测通过率（最近 {{ history.length }} 次）</div>
        <span class="pill pill-info">本地记录</span>
      </div>
      <div ref="trendEl" class="trend-box" />
    </section>

    <div v-if="loading && !result" class="loading-bar"><span class="spinner" />正在执行全链路自检…</div>

    <!-- 检查项（按分类分组） -->
    <div v-else-if="result" class="check-list">
      <section v-for="g in grouped" :key="g.key" class="glass-card mb-16">
        <div class="card-head">
          <div class="card-title">{{ g.label }}</div>
          <span class="pill" :class="catCls(g.key)">{{ g.pass }}/{{ g.total }} 通过</span>
        </div>
        <div class="cat-checks">
          <div
            v-for="(c, i) in g.checks"
            :key="g.key + '-' + i"
            class="check-item"
            :class="{ expanded: expanded.has(g.key + '-' + i) }"
            @click="toggleExpand(g.key + '-' + i)"
          >
            <div class="check-left">
              <span class="check-index num">{{ String((result.checks.indexOf(c)) + 1).padStart(2, '0') }}</span>
              <div>
                <div class="check-name">{{ c.name }}</div>
                <div class="check-detail" :class="{ 'detail-open': expanded.has(g.key + '-' + i) }">{{ c.detail }}</div>
              </div>
            </div>
            <div class="check-right">
              <span class="pill" :class="statusCls(c.status)">{{ statusText(c.status) }}</span>
              <span class="check-value num">{{ c.value }}</span>
              <span class="check-ms num">{{ c.ms }}ms</span>
              <span class="check-toggle">{{ expanded.has(g.key + '-' + i) ? '▾' : '▸' }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="empty-card glass-card">暂无自测结果，点击「重新自测」开始</div>
  </div>
</template>

<style scoped>
.overview-grid {
  display: grid;
  grid-template-columns: 2.2fr repeat(4, 1fr);
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
  margin: 6px 0 10px;
}
.fs-20 {
  font-size: 20px;
  -webkit-text-fill-color: var(--text-primary);
}
.status-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 999px;
  font-size: 15px;
}
.metric-sub {
  font-size: 11.5px;
  color: var(--text-muted);
}
.status-card { position: relative; padding-bottom: 118px; }
.donut-box { position: absolute; left: 12px; right: 12px; bottom: 8px; height: 104px; }
.cat-summary { display: flex; flex-wrap: wrap; gap: 8px; }
.cat-chip { font-size: 12.5px; padding: 4px 14px; }
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-subtle);
}
.card-title { font-size: 15px; font-weight: 700; }
.trend-box { height: 190px; padding: 10px 8px 0; }
.check-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cat-checks { padding: 8px 18px 14px; display: flex; flex-direction: column; gap: 6px; }
.check-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px;
  gap: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.check-item:hover { background: var(--bg-hover); }
.check-item.expanded { border-color: var(--primary); background: var(--bg-hover); }
.check-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}
.check-index {
  font-size: 16px;
  font-weight: 800;
  color: var(--primary);
  opacity: 0.6;
}
.check-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
.check-detail {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 3px;
  max-width: 640px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.check-detail.detail-open {
  white-space: normal;
  word-break: break-all;
}
.check-right {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}
.check-value {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-primary);
  max-width: 220px;
  text-align: right;
}
.check-ms {
  font-size: 11px;
  color: var(--text-muted);
  min-width: 44px;
  text-align: right;
}
.check-toggle { color: var(--text-muted); font-size: 12px; width: 14px; text-align: center; }
.empty-card {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
}
.btn-spin {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@media (max-width: 1200px) {
  .overview-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 900px) {
  .overview-grid { grid-template-columns: repeat(2, 1fr); }
  .check-right { flex-direction: column; align-items: flex-end; gap: 4px; }
}
</style>
