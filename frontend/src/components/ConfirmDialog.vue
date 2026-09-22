<script setup>
/**
 * 确认对话框（白色科技）
 * 兼容 open / show 两种写法
 */
import { computed } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  show: { type: Boolean, default: false },
  title: { type: String, default: '确认操作' },
  message: { type: String, default: '' },
  danger: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])

const visible = computed(() => props.open || props.show)
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="confirm-mask" @click.self="emit('cancel')">
        <div class="confirm-box">
          <div class="confirm-icon" :class="{ danger }">
            {{ danger ? '!' : '?' }}
          </div>
          <h3>{{ title }}</h3>
          <p>{{ message }}</p>
          <div class="confirm-actions">
            <button class="btn" @click="emit('cancel')">取消</button>
            <button class="btn" :class="danger ? 'btn-danger' : 'btn-primary'" @click="emit('confirm')">
              确定
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-mask {
  position: fixed;
  inset: 0;
  background: rgba(23, 43, 77, 0.42);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}
.confirm-box {
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  padding: 26px 28px;
  width: 370px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 30px 80px rgba(23, 43, 77, 0.22);
  animation: pop 0.22s ease;
}
@keyframes pop {
  from { opacity: 0; transform: scale(0.94) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.confirm-icon {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--gradient-soft);
  border: 1px solid rgba(37, 99, 235, 0.25);
  color: var(--primary);
  font-size: 22px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}
.confirm-icon.danger {
  background: #ffecec;
  border-color: rgba(229, 72, 77, 0.3);
  color: var(--danger);
}
.confirm-box h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
}
.confirm-box p {
  margin: 0 0 22px;
  color: var(--text-secondary);
  font-size: 13.5px;
  word-break: break-all;
}
.confirm-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
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
