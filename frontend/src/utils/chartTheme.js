/**
 * ECharts 主题适配工具：根据当前页面主题返回图表配色
 * 浅色/深色双色板，解决深色主题下图表白底、文字不清问题
 */
export function isDarkTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark'
}

export function chartTheme() {
  const dark = isDarkTheme()
  return {
    // 轴与网格
    axis: dark ? '#8fa8d8' : '#8a97b5',                        // 轴标签文字
    split: dark ? 'rgba(148, 180, 255, 0.10)' : 'rgba(37, 99, 235, 0.06)', // 分割线
    axisLine: dark ? 'rgba(148, 180, 255, 0.28)' : '#dbe3f0',  // 轴线
    axisLabel: dark ? '#8fa8d8' : '#8a97b5',                   // 轴文字

    // tooltip
    tooltipBg: dark ? 'rgba(16, 26, 46, 0.97)' : 'rgba(255, 255, 255, 0.96)',
    tooltipBorder: dark ? 'rgba(102, 176, 255, 0.35)' : '#e5ebf5',
    tooltipText: dark ? '#e8eefb' : '#16233b',
    tooltipShadow: dark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(23, 43, 77, 0.14)',

    // 系列色
    blue: dark ? '#66b0ff' : '#2563eb',
    cyan: dark ? '#3dd7f7' : '#38bdf8',
    sky: dark ? '#7cc0ff' : '#60a5fa',
    green: dark ? '#4ade80' : '#0fa968',
    orange: dark ? '#fbbf24' : '#e8960c',
    red: dark ? '#f87171' : '#e5484d',
    purple: dark ? '#c4b5fd' : '#7c3aed',
    violet: dark ? '#a78bfa' : '#8b5cf6',
    indigo: dark ? '#818cf8' : '#6366f1',
    teal: dark ? '#2dd4bf' : '#22d3ee',
    emerald: dark ? '#34d399' : '#34d399',
    amber: dark ? '#fbbf24' : '#fbbf24',
    pink: dark ? '#e879f9' : '#d946ef',
    magenta: dark ? '#c4b5fd' : '#a78bfa',

    // 阴影
    blueShadow: dark ? 'rgba(102, 176, 255, 0.5)' : 'rgba(37, 99, 235, 0.4)',
    cyanShadow: dark ? 'rgba(61, 215, 247, 0.6)' : 'rgba(56, 189, 248, 0.6)',

    // 面积渐变
    areaTop: dark ? 'rgba(102, 176, 255, 0.28)' : 'rgba(37, 99, 235, 0.22)',
    areaBottom: dark ? 'rgba(102, 176, 255, 0)' : 'rgba(37, 99, 235, 0)',

    // 热力色阶（浅→深）
    heat: dark
      ? ['#15243f', '#2b4a86', '#66b0ff', '#7cc0ff', '#c4b5fd']
      : ['#eef4ff', '#b8d0ff', '#5b8ef7', '#2563eb', '#1e3a8a'],

    // 空值占位色
    placeholder: dark ? 'rgba(148, 180, 255, 0.10)' : '#e8eef8',
  }
}

/** 便捷：构造 tooltip 样式对象 */
export function chartTooltip(ct) {
  return {
    backgroundColor: ct.tooltipBg,
    borderColor: ct.tooltipBorder,
    borderWidth: 1,
    padding: [10, 14],
    textStyle: { color: ct.tooltipText, fontSize: 12.5 },
    extraCssText: `box-shadow: 0 8px 24px ${ct.tooltipShadow}; border-radius: 10px;`,
  }
}

/** 便捷：通用坐标轴配色 */
export function chartAxes(ct) {
  return {
    axisLabel: { color: ct.axisLabel },
    axisLine: { lineStyle: { color: ct.axisLine } },
    splitLine: { lineStyle: { color: ct.split } },
  }
}
