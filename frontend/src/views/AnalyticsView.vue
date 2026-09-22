<script setup>
/**
 * 数据分析中心：活跃趋势 / 活跃热力图 / 操作分布 / 活跃时段
 */
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getAnalyticsTrend, getAnalyticsHeatmap, getAnalyticsActions, getAnalyticsHours } from '../api/export'
import { useToast } from '../stores/toast'

const toast = useToast()

const days = ref(14)
const loading = ref(false)

const trendChart = ref(null)
const heatmapChart = ref(null)
const actionsChart = ref(null)
const hoursChart = ref(null)

const summary = ref({ total: 0, avg: 0, peak: 0, peakHour: '--' })

import { chartTheme, chartTooltip } from '../utils/chartTheme'

async function load() {
  loading.value = true
  try {
    const [trend, heat, actions, hours] = await Promise.all([
      getAnalyticsTrend(days.value),
      getAnalyticsHeatmap(Math.min(90, Math.max(30, days.value))),
      getAnalyticsActions(Math.min(30, Math.max(7, days.value))),
      getAnalyticsHours(days.value),
    ])
    const t = trend?.data || []
    const h = heat?.data || []
    const a = actions?.data || []
    const hr = hours?.data || []

    // 汇总
    const total = t.reduce((s, d) => s + d.count, 0)
    const avg = t.length ? Math.round(total / t.length) : 0
    const peak = t.length ? Math.max(...t.map((d) => d.count)) : 0
    const peakHour = hr.length ? hr.reduce((m, d) => (d.value > m.value ? d : m), hr[0]) : { hour: '--' }
    summary.value = { total, avg, peak, peakHour: peakHour.hour }

    await nextTick()
    initCharts()
    renderTrend(t)
    renderHeatmap(h)
    renderActions(a)
    renderHours(hr)
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

function initCharts() {
  if (!trendChart.value) trendChart.value = echarts.init(document.getElementById('anaTrend'))
  if (!heatmapChart.value) heatmapChart.value = echarts.init(document.getElementById('anaHeat'))
  if (!actionsChart.value) actionsChart.value = echarts.init(document.getElementById('anaActions'))
  if (!hoursChart.value) hoursChart.value = echarts.init(document.getElementById('anaHours'))
}

function renderTrend(t) {
  const ct = chartTheme()
  trendChart.value.setOption({
    tooltip: { trigger: 'axis', ...chartTooltip(ct) },
    grid: { left: 46, right: 18, top: 30, bottom: 28 },
    xAxis: { type: 'category', data: t.map((d) => d.day.slice(5)), axisLine: { lineStyle: { color: ct.axisLine } }, axisLabel: { color: ct.axis } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: ct.split } }, axisLabel: { color: ct.axis } },
    series: [{
      name: '操作量',
      type: 'line',
      smooth: true,
      symbolSize: 7,
      data: t.map((d) => d.count),
      lineStyle: { color: ct.blue, width: 2.5, shadowColor: ct.blueShadow, shadowBlur: 10 },
      itemStyle: { color: ct.blue },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: ct.areaTop }, { offset: 1, color: ct.areaBottom }]) },
    }],
  })
}

function renderHeatmap(h) {
  const ct = chartTheme()
  const maxDay = h.length ? Math.max(...h.map((d) => d[0])) + 1 : 14
  const daysArr = []
  for (let i = 0; i < maxDay; i++) daysArr.push(String(i + 1).padStart(2, '0'))
  const hoursArr = []
  for (let i = 0; i < 24; i++) hoursArr.push(String(i).padStart(2, '0') + ':00')

  const max = h.length ? Math.max(...h.map((d) => d[2])) : 1
  heatmapChart.value.setOption({
    tooltip: { position: 'top', formatter: (p) => `天 ${daysArr[p.value[0]]} · ${hoursArr[p.value[1]]}<br/>操作 ${p.value[2]} 次`, ...chartTooltip(ct) },
    grid: { left: 46, right: 18, top: 18, bottom: 60 },
    xAxis: { type: 'category', data: daysArr, splitArea: { show: true }, axisLabel: { color: ct.axis, interval: 2 }, axisLine: { lineStyle: { color: ct.axisLine } } },
    yAxis: { type: 'category', data: hoursArr, splitArea: { show: true }, axisLabel: { color: ct.axis, fontSize: 10 }, axisLine: { lineStyle: { color: ct.axisLine } } },
    visualMap: {
      min: 0,
      max,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 6,
      inRange: { color: ct.heat },
      textStyle: { color: AXIS, fontSize: 10 },
    },
    series: [{
      type: 'heatmap',
      data: h,
      label: { show: false },
      itemStyle: { borderColor: ct.tooltipBorder, borderWidth: 1 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: ct.blueShadow } },
    }],
  })
}

function renderActions(a) {
  const ct = chartTheme()
  actionsChart.value.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...chartTooltip(ct) },
    grid: { left: 14, right: 40, top: 12, bottom: 8, containLabel: true },
    xAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: ct.split } }, axisLabel: { color: ct.axis } },
    yAxis: { type: 'category', data: a.map((d) => d.name), axisLine: { lineStyle: { color: ct.axisLine } }, axisLabel: { color: ct.axisLabel, fontSize: 11 } },
    series: [{
      type: 'bar',
      barWidth: '52%',
      data: a.map((d) => d.value),
      itemStyle: { borderRadius: [0, 6, 6, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: ct.sky }, { offset: 1, color: ct.blue }]) },
    }],
  })
}

function renderHours(hr) {
  const ct = chartTheme()
  hoursChart.value.setOption({
    tooltip: { trigger: 'axis', ...chartTooltip(ct) },
    grid: { left: 46, right: 18, top: 28, bottom: 28 },
    xAxis: { type: 'category', data: hr.map((d) => d.hour), axisLabel: { color: ct.axis, interval: 2 }, axisLine: { lineStyle: { color: ct.axisLine } } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: ct.split } }, axisLabel: { color: ct.axis } },
    series: [{
      type: 'bar',
      barWidth: '50%',
      data: hr.map((d) => d.value),
      itemStyle: { borderRadius: [4, 4, 0, 0], color: (p) => (p.value > 0 ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: ct.cyan }, { offset: 1, color: ct.blue }]) : ct.placeholder) },
    }],
  })
}

function onResize() {
  ;[trendChart.value, heatmapChart.value, actionsChart.value, hoursChart.value].forEach((c) => c?.resize())
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
  ;[trendChart.value, heatmapChart.value, actionsChart.value, hoursChart.value].forEach((c) => c?.dispose())
})
</script>

<template>
  <div>
    <div class="page-head">
      <h2>数据分析</h2>
      <span class="sub">活跃趋势 · 热力图 · 操作分布 · 活跃时段（基于审计日志）</span>
      <div class="actions">
        <select v-model="days" class="input sel" @change="load">
          <option :value="14">近 14 天</option>
          <option :value="30">近 30 天</option>
          <option :value="60">近 60 天</option>
        </select>
        <button class="btn btn-primary" :disabled="loading" @click="load">{{ loading ? '加载中…' : '⟳ 刷新' }}</button>
      </div>
    </div>

    <!-- 汇总 -->
    <div class="kpi-grid mb-16">
      <div class="glass-card kpi">
        <div class="kpi-label">总操作量</div>
        <div class="kpi-value num">{{ summary.total }}</div>
        <div class="kpi-sub">所选周期内审计记录</div>
      </div>
      <div class="glass-card kpi">
        <div class="kpi-label">日均操作</div>
        <div class="kpi-value num" style="color: var(--success)">{{ summary.avg }}</div>
        <div class="kpi-sub">平均每天</div>
      </div>
      <div class="glass-card kpi">
        <div class="kpi-label">单日峰值</div>
        <div class="kpi-value num" style="color: var(--warning)">{{ summary.peak }}</div>
        <div class="kpi-sub">周期内最高</div>
      </div>
      <div class="glass-card kpi">
        <div class="kpi-label">活跃高峰时段</div>
        <div class="kpi-value num" style="color: var(--chart-purple)">{{ summary.peakHour }}</div>
        <div class="kpi-sub">操作最密集</div>
      </div>
    </div>

    <div v-if="loading" class="loading-bar"><span class="spinner" />分析中…</div>
    <template v-else>
      <div class="charts-grid mb-16">
        <div class="glass-card chart-card">
          <div class="chart-title"><span>活跃趋势</span><span class="chart-tag">TREND</span></div>
          <div id="anaTrend" class="chart chart-lg" />
        </div>
        <div class="glass-card chart-card">
          <div class="chart-title"><span>活跃时段分布</span><span class="chart-tag">HOURS</span></div>
          <div id="anaHours" class="chart chart-lg" />
        </div>
      </div>

      <div class="glass-card chart-card mb-16">
        <div class="chart-title"><span>活跃热力图（天 × 小时）</span><span class="chart-tag">HEATMAP</span></div>
        <div id="anaHeat" class="chart chart-heat" />
      </div>

      <div class="glass-card chart-card">
        <div class="chart-title"><span>操作类型分布</span><span class="chart-tag">ACTIONS</span></div>
        <div id="anaActions" class="chart chart-lg" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 14px;
  flex-wrap: wrap;
}
.page-head h2 { font-size: 19px; font-weight: 800; }
.sub { font-size: 12.5px; color: var(--text-muted); display: block; margin-top: 3px; }
.actions { display: flex; gap: 8px; align-items: center; }
.sel { width: 140px; }
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.kpi { padding: 16px 18px; }
.kpi-label { font-size: 12.5px; color: var(--text-muted); }
.kpi-value {
  font-size: 26px;
  font-weight: 800;
  margin: 6px 0 2px;
  background: var(--gradient-main);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.kpi-sub { font-size: 11.5px; color: var(--text-muted); }
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.chart-card { padding: 16px 18px; }
.chart-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
}
.chart-tag {
  font-size: 10px;
  letter-spacing: 0.18em;
  color: var(--primary);
  background: var(--gradient-soft);
  border: 1px solid rgba(37, 99, 235, 0.18);
  padding: 2px 9px;
  border-radius: 999px;
}
.chart { width: 100%; }
.chart-lg { height: 300px; }
.chart-heat { height: 340px; }
@media (max-width: 1000px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-grid { grid-template-columns: 1fr; }
}
</style>
