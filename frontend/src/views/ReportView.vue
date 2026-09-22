<script setup>
/**
 * 综合报表：核心指标 + 注册/操作趋势 + 分布 + 任务完成率
 */
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import { getReportCore, getReportTrend, getReportDistributions, getReportTaskCompletion } from '../api/report'
import { useToast } from '../stores/toast'

const toast = useToast()

const core = ref({})
const completion = ref({})
const loading = ref(false)

const trendChart = ref(null)
const deptChart = ref(null)
const regionChart = ref(null)

import { chartTheme, chartTooltip } from '../utils/chartTheme'

async function load() {
  loading.value = true
  try {
    const [c, t, d, tc] = await Promise.all([
      getReportCore(),
      getReportTrend(7),
      getReportDistributions(),
      getReportTaskCompletion(),
    ])
    core.value = c?.data || {}
    completion.value = tc?.data || {}
    await nextTick()
    initCharts()
    renderTrend(t?.data || [])
    renderDist(d?.data || {})
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

function initCharts() {
  if (!trendChart.value) trendChart.value = echarts.init(document.getElementById('repTrend'))
  if (!deptChart.value) deptChart.value = echarts.init(document.getElementById('repDept'))
  if (!regionChart.value) regionChart.value = echarts.init(document.getElementById('repRegion'))
}

function renderTrend(data) {
  const ct = chartTheme()
  trendChart.value.setOption({
    tooltip: { trigger: 'axis', ...chartTooltip(ct) },
    legend: { top: 0, right: 0, textStyle: { color: AXIS, fontSize: 11 } },
    grid: { left: 46, right: 18, top: 34, bottom: 28 },
    xAxis: { type: 'category', data: data.map((d) => d.day.slice(5)), axisLine: { lineStyle: { color: ct.axisLine } }, axisLabel: { color: ct.axis } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: ct.split } }, axisLabel: { color: ct.axis } },
    series: [
      {
        name: '注册',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: data.map((d) => d.registrations),
        lineStyle: { color: ct.green, width: 2.5 },
        itemStyle: { color: ct.green },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(15,169,104,0.2)' }, { offset: 1, color: 'rgba(15,169,104,0)' }]) },
      },
      {
        name: '操作',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: data.map((d) => d.operations),
        lineStyle: { color: ct.blue, width: 2.5 },
        itemStyle: { color: ct.blue },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(37,99,235,0.2)' }, { offset: 1, color: 'rgba(37,99,235,0)' }]) },
      },
    ],
  })
}

function renderDist(d) {
  const ct = chartTheme()
  const depts = d.departments || []
  const regions = d.regions || []
  deptChart.value.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...chartTooltip(ct) },
    grid: { left: 14, right: 40, top: 12, bottom: 8, containLabel: true },
    xAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: ct.split } }, axisLabel: { color: ct.axis } },
    yAxis: { type: 'category', data: depts.map((x) => x.name), axisLine: { lineStyle: { color: ct.axisLine } }, axisLabel: { color: ct.axisLabel, fontSize: 11 } },
    series: [{
      type: 'bar',
      barWidth: '50%',
      data: depts.map((x) => x.count),
      itemStyle: { borderRadius: [0, 6, 6, 0], color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: ct.sky }, { offset: 1, color: ct.blue }]) },
    }],
  })
  regionChart.value.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 人 ({d}%)', ...chartTooltip(ct) },
    legend: { bottom: 0, textStyle: { color: AXIS, fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['40%', '66%'],
      center: ['50%', '44%'],
      itemStyle: { borderRadius: 6, borderColor: ct.tooltipBorder, borderWidth: 2 },
      label: { color: ct.axisLabel, fontSize: 11 },
      data: regions.map((x) => ({ name: x.name, value: x.count })),
      color: [ct.blue, ct.green, ct.purple, ct.orange, ct.sky, ct.red],
    }],
  })
}

function onResize() {
  ;[trendChart.value, deptChart.value, regionChart.value].forEach((c) => c?.resize())
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
  ;[trendChart.value, deptChart.value, regionChart.value].forEach((c) => c?.dispose())
})
</script>

<template>
  <div>
    <div class="page-head">
      <h2>综合报表</h2>
      <span class="sub">核心指标 · 注册与操作趋势 · 组织分布 · 任务完成率</span>
      <div class="actions">
        <button class="btn btn-primary" :disabled="loading" @click="load">{{ loading ? '加载中…' : '⟳ 生成报表' }}</button>
      </div>
    </div>

    <div v-if="loading" class="loading-bar"><span class="spinner" />报表生成中…</div>
    <template v-else>
      <!-- 核心指标 -->
      <div class="kpi-grid mb-16">
        <div class="glass-card kpi"><div class="kpi-label">用户总数</div><div class="kpi-value num">{{ core.users ?? 0 }}</div><div class="kpi-sub">启用 {{ core.activeUsers ?? 0 }}</div></div>
        <div class="glass-card kpi"><div class="kpi-label">任务总数</div><div class="kpi-value num" style="color: var(--success)">{{ core.tasks ?? 0 }}</div><div class="kpi-sub">待办 {{ core.tasksTodo ?? 0 }} · 进行中 {{ core.tasksDoing ?? 0 }} · 完成 {{ core.tasksDone ?? 0 }}</div></div>
        <div class="glass-card kpi"><div class="kpi-label">已发布公告</div><div class="kpi-value num" style="color: var(--warning)">{{ core.notices ?? 0 }}</div><div class="kpi-sub">面向全站</div></div>
        <div class="glass-card kpi"><div class="kpi-label">审计日志</div><div class="kpi-value num" style="color: var(--chart-purple)">{{ core.logs ?? 0 }}</div><div class="kpi-sub">累计操作记录</div></div>
      </div>

      <!-- 完成率 -->
      <div class="glass-card completion-card mb-16">
        <div class="cc-left">
          <div class="cc-label">任务完成率</div>
          <div class="cc-num num">{{ completion.rate ?? 0 }}%</div>
          <div class="cc-sub">{{ completion.done ?? 0 }} / {{ completion.total ?? 0 }} 项任务已完成</div>
        </div>
        <div class="cc-bar">
          <div class="cc-fill" :style="{ width: (completion.rate || 0) + '%' }" />
        </div>
      </div>

      <!-- 图表 -->
      <div class="charts-grid mb-16">
        <div class="glass-card chart-card">
          <div class="chart-title"><span>近 7 天注册与操作</span><span class="chart-tag">TREND</span></div>
          <div id="repTrend" class="chart chart-lg" />
        </div>
        <div class="glass-card chart-card">
          <div class="chart-title"><span>部门人数分布</span><span class="chart-tag">DEPTS</span></div>
          <div id="repDept" class="chart chart-lg" />
        </div>
      </div>

      <div class="glass-card chart-card">
        <div class="chart-title"><span>地区分布</span><span class="chart-tag">REGIONS</span></div>
        <div id="repRegion" class="chart chart-sm" />
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
.completion-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 18px 22px;
}
.cc-left { min-width: 170px; }
.cc-label { font-size: 12.5px; color: var(--text-muted); }
.cc-num { font-size: 30px; font-weight: 800; color: var(--success); }
.cc-sub { font-size: 11.5px; color: var(--text-muted); }
.cc-bar {
  flex: 1;
  height: 12px;
  background: var(--bg-canvas);
  border-radius: 999px;
  overflow: hidden;
}
.cc-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--success), var(--chart-emerald));
  transition: width 0.8s ease;
}
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
.chart-lg { height: 300px; }
.chart-sm { height: 260px; }
@media (max-width: 1000px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-grid { grid-template-columns: 1fr; }
}
</style>
