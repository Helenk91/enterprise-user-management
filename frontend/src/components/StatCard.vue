<script setup>
/**
 * 统计卡片（数字滚动动画 + 白色科技光效）
 */
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: '' },
  tone: { type: String, default: 'blue' }, // blue / green / violet / cyan
})

// 数字滚动动画（仅数字类值）
const display = ref(0)
let raf = null

function animateTo(target) {
  cancelAnimationFrame(raf)
  if (typeof props.value !== 'number') {
    display.value = target
    return
  }
  const start = display.value || 0
  const diff = target - start
  const duration = 700
  const t0 = performance.now()
  const step = (t) => {
    const p = Math.min((t - t0) / duration, 1)
    display.value = Math.round(start + diff * (1 - Math.pow(1 - p, 3)))
    if (p < 1) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}

watch(() => props.value, (v) => animateTo(Number(v) || 0))
onMounted(() => animateTo(Number(props.value) || 0))
</script>

<template>
  <div class="stat-card" :class="`tone-${tone}`">
    <div class="stat-head">
      <span class="stat-label">{{ label }}</span>
      <span class="stat-glow" />
    </div>
    <div class="stat-value num" :class="{ small: String(value).length > 6 }">
      {{ typeof value === 'number' ? display : value }}
    </div>
    <div class="stat-hint">{{ hint }}</div>
  </div>
</template>

<style scoped>
.stat-card {
  position: relative;
  overflow: hidden;
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius);
  padding: 18px 20px 16px;
  box-shadow: var(--shadow-card);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.stat-card::after {
  content: '';
  position: absolute;
  right: -30px;
  top: -30px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.08), transparent 70%);
  pointer-events: none;
}
.stat-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-subtle);
  box-shadow: var(--shadow-lift);
}
.stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stat-glow {
  width: 38px;
  height: 6px;
  border-radius: 99px;
  background: var(--gradient-main);
  opacity: 0.5;
}
.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  letter-spacing: 0.02em;
}
.stat-value {
  font-size: 34px;
  font-weight: 800;
  margin: 8px 0 3px;
  line-height: 1.15;
  letter-spacing: 0.01em;
}
.stat-value.small {
  font-size: 20px;
  word-break: break-all;
}
.stat-hint {
  font-size: 12px;
  color: var(--text-muted);
}
/* 色调 */
.tone-blue .stat-value { background: linear-gradient(90deg, #2563eb, #38bdf8); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.tone-blue .stat-glow { background: linear-gradient(90deg, #38bdf8, #2563eb); }
.tone-green .stat-value { background: linear-gradient(90deg, var(--success), var(--chart-emerald)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.tone-green .stat-glow { background: linear-gradient(90deg, #34d399, #059669); }
.tone-violet .stat-value { background: linear-gradient(90deg, #8b5cf6, #a78bfa); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.tone-violet .stat-glow { background: linear-gradient(90deg, #a78bfa, #7c3aed); }
.tone-cyan .stat-value { background: linear-gradient(90deg, #06b6d4, #22d3ee); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.tone-cyan .stat-glow { background: linear-gradient(90deg, #22d3ee, #0ea5e9); }
</style>
