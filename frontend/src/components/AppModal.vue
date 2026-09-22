<script setup>
/**
 * 通用弹窗组件（白色科技）
 * 兼容 open / show 两种写法
 */
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  width: { type: Number, default: 480 },
  open: { type: Boolean, default: false },
  show: { type: Boolean, default: false },
  wide: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const visible = computed(() => props.open || props.show)
const boxWidth = computed(() => (props.wide ? 760 : props.width))
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="modal-mask" @click.self="emit('close')">
        <div class="modal" :style="{ width: boxWidth + 'px' }">
          <div class="modal-header">
            <h3>{{ title }}</h3>
            <button class="modal-close" @click="emit('close')">×</button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(23, 43, 77, 0.42);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  max-width: 92vw;
  max-height: 86vh;
  overflow-y: auto;
  box-shadow: 0 30px 80px rgba(23, 43, 77, 0.25);
  animation: pop 0.22s ease;
}
@keyframes pop {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  background: var(--bg-panel);
  z-index: 1;
}
.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}
.modal-close {
  border: none;
  background: none;
  font-size: 24px;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
  transition: color 0.15s;
}
.modal-close:hover {
  color: var(--danger);
}
.modal-body {
  padding: 20px;
}
.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  background: var(--bg-input);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
