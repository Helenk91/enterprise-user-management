<script setup>
/**
 * 骨架屏组件
 * 用法：<SkeletonLoader :rows="3" :columns="5" />
 */
defineProps({
  rows: { type: Number, default: 4 },
  columns: { type: Number, default: 5 },
  card: { type: Boolean, default: false },
})
</script>

<template>
  <div v-if="card" class="sk-card">
    <div v-for="r in rows" :key="r" class="sk-row">
      <span v-for="c in columns" :key="c" class="sk-block" :style="{ width: (60 + ((r + c) * 7) % 30) + '%' }" />
    </div>
  </div>
  <div v-else class="sk-table">
    <div class="sk-head">
      <span v-for="c in columns" :key="c" class="sk-block" />
    </div>
    <div v-for="r in rows" :key="r" class="sk-row">
      <span v-for="c in columns" :key="c" class="sk-block" :style="{ width: (50 + ((r + c) * 9) % 40) + '%' }" />
    </div>
  </div>
</template>

<style scoped>
.sk-block {
  display: block;
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #eef2f9 25%, #e3eaf6 37%, #eef2f9 63%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}
@keyframes shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
.sk-table {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 4px;
}
.sk-head {
  display: flex;
  gap: 18px;
}
.sk-head .sk-block {
  flex: 1;
  height: 12px;
  opacity: 0.6;
}
.sk-row {
  display: flex;
  gap: 18px;
}
.sk-row .sk-block {
  flex: 1;
}
.sk-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px;
}
.sk-card .sk-row .sk-block:first-child {
  flex: 0 0 26%;
}
</style>
