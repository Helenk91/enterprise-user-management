/**
 * 应用入口
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

/* ===== 全局防泄密：禁用复制 / 粘贴 / 剪切 / 右键菜单 =====
 * 企业级数据保护策略：页面内容不可被复制带走，表单内容不可粘贴，
 * 同时屏蔽右键菜单中的复制/粘贴入口。
 */
const FORBIDDEN_EVENTS = ['copy', 'cut', 'paste']
FORBIDDEN_EVENTS.forEach((ev) => {
  document.addEventListener(ev, (e) => e.preventDefault())
})
document.addEventListener('contextmenu', (e) => e.preventDefault())
// 兼容 textarea/input 内滚轮与键盘：阻止 Ctrl 组合复制/粘贴键位
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(e.key.toLowerCase())) {
    e.preventDefault()
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 刷新页面后恢复登录态
router.isReady().then(async () => {
  const { useUserStore } = await import('./stores/user')
  const userStore = useUserStore()
  if (userStore.isLoggedIn) {
    userStore.fetchMe().catch(() => {})
  }
})

app.mount('#app')
