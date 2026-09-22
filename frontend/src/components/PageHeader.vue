<script setup>
/**
 * 通用页面头部组件
 * 用法：<PageHeader title="用户管理" sub="描述文案"><template #actions>按钮</template></PageHeader>
 */
defineProps({
  title: { type: String, required: true },
  sub: { type: String, default: '' },
  icon: { type: String, default: '' },
})
</script>

<template>
  <div class="page-head">
    <div class="ph-left">
      <span v-if="icon" class="ph-icon">{{ icon }}</span>
      <div>
        <h2>{{ title }}</h2>
        <span v-if="sub" class="sub">{{ sub }}</span>
      </div>
    </div>
    <div class="actions">
      <slot name="actions" />
    </div>
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
.ph-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ph-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--gradient-soft);
  border: 1px solid rgba(37, 99, 235, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--primary);
}
.page-head h2 {
  font-size: 19px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.25;
}
.sub {
  font-size: 12.5px;
  color: var(--text-muted);
  display: block;
  margin-top: 3px;
}
.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
