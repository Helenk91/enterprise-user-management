<script setup>
/**
 * 空状态组件
 */
defineProps({
  icon: { type: String, default: '◌' },
  title: { type: String, default: '暂无数据' },
  desc: { type: String, default: '' },
})
</script>

<template>
  <div class="empty">
    <div class="empty-icon">{{ icon }}</div>
    <div class="empty-title">{{ title }}</div>
    <div v-if="desc" class="empty-desc">{{ desc }}</div>
    <div v-if="$slots.default" class="empty-action">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 52px 20px;
  text-align: center;
}
.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--gradient-soft);
  border: 1px dashed rgba(37, 99, 235, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: var(--primary);
  margin-bottom: 14px;
}
.empty-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.empty-desc {
  font-size: 12.5px;
  color: var(--text-muted);
  margin-top: 6px;
  max-width: 320px;
  line-height: 1.6;
}
.empty-action {
  margin-top: 16px;
}
</style>
