<script setup>
/**
 * Toast 容器（暗色玻璃）
 */
import { state } from '../utils/toast'
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="item in state.items"
          :key="item.id"
          class="toast"
          :class="`toast-${item.type}`"
        >
          <span class="toast-dot" />
          {{ item.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  gap: 9px;
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(12px);
  color: var(--text-primary);
  border-radius: 11px;
  padding: 11px 20px;
  font-size: 14px;
  box-shadow: var(--shadow-lift);
  max-width: 80vw;
}
.toast-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--info);
  box-shadow: 0 0 10px currentColor;
  flex-shrink: 0;
}
.toast-success .toast-dot {
  background: var(--success);
  color: var(--success);
}
.toast-error .toast-dot {
  background: var(--danger);
  color: var(--danger);
}
.toast-info .toast-dot {
  background: var(--info);
  color: var(--info);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
