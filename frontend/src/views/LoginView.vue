<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { toast } from '../utils/toast'

/* ===== 深浅主题切换（与系统内一致） ===== */
const dark = ref(false)
function applyTheme() {
  const t = localStorage.getItem('ems_theme') || 'light'
  dark.value = t === 'dark'
  document.documentElement.setAttribute('data-theme', t)
}
function toggleTheme() {
  const t = dark.value ? 'light' : 'dark'
  dark.value = !dark.value
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('ems_theme', t)
  window.dispatchEvent(new CustomEvent('ems-theme-change'))
}
onMounted(applyTheme)

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = ref({ email: '', password: '' })
const loading = ref(false)

async function submit() {
  if (!form.value.email || !form.value.password) {
    toast.error('请输入邮箱和密码')
    return
  }
  loading.value = true
  try {
    await userStore.login({ ...form.value })
    toast.success('登录成功，欢迎回来')
    router.push(route.query.redirect || '/')
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <button class="theme-toggle" :title="dark ? '切换到浅色模式' : '切换到深色模式'" @click="toggleTheme">{{ dark ? '☀' : '🌙' }}</button>
    <!-- 背景光效 -->
    <div class="orb orb-1" />
    <div class="orb orb-2" />
    <div class="orb orb-3" />
    <div class="grid-overlay" />

    <div class="auth-card glass-card">
      <div class="auth-brand">
        <div class="auth-logo">U</div>
        <h1>用户管理系统</h1>
        <p class="auth-sub">Enterprise · Secure Access</p>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <div class="field">
          <label>邮箱</label>
          <div class="field-wrap">
            <span class="f-icon">@</span>
            <input v-model="form.email" type="email" class="input f-input" placeholder="name@example.com" required autocomplete="username" />
          </div>
        </div>
        <div class="field">
          <label>密码</label>
          <div class="field-wrap">
            <span class="f-icon">✦</span>
            <input v-model="form.password" type="password" class="input f-input" placeholder="请输入密码" required autocomplete="current-password" />
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="loading" class="spinner spinner-sm" />
          {{ loading ? '安全验证中...' : '登 录' }}
        </button>
      </form>

      <div class="auth-links">
        <span>还没有账号？</span>
        <RouterLink to="/register" class="link">立即注册</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    radial-gradient(1000px 500px at 70% -5%, rgba(37, 99, 235, 0.10), transparent 60%),
    radial-gradient(800px 460px at 10% 110%, rgba(56, 189, 248, 0.08), transparent 55%),
    var(--bg-canvas);
  padding: 24px;
}

/* 深浅主题切换按钮（右上角） */
.theme-toggle {
  position: absolute;
  top: 22px;
  right: 26px;
  z-index: 5;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--border-subtle);
  background: var(--bg-panel);
  color: var(--text-secondary);
  font-size: 17px;
  cursor: pointer;
  box-shadow: var(--shadow-card);
  transition: all 0.2s;
}
.theme-toggle:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
}

/* 漂浮光球（浅色） */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.35;
  animation: float 9s ease-in-out infinite;
}
.orb-1 {
  width: 380px;
  height: 380px;
  left: -80px;
  top: -60px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.45), transparent 70%);
}
.orb-2 {
  width: 300px;
  height: 300px;
  right: -40px;
  bottom: -60px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.45), transparent 70%);
  animation-delay: -3s;
}
.orb-3 {
  width: 200px;
  height: 200px;
  left: 50%;
  top: 60%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.28), transparent 70%);
  animation-delay: -6s;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -24px) scale(1.06); }
  66% { transform: translate(-20px, 18px) scale(0.96); }
}
.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(37, 99, 235, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 99, 235, 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 75%);
  pointer-events: none;
}

/* 白色卡片 */
.auth-card {
  position: relative;
  z-index: 2;
  width: 400px;
  max-width: 94vw;
  padding: 36px 38px;
  border-radius: 20px;
  background: var(--bg-panel);
  backdrop-filter: blur(18px);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
}
.auth-brand {
  text-align: center;
  margin-bottom: 28px;
}
.auth-logo {
  width: 58px;
  height: 58px;
  margin: 0 auto 14px;
  border-radius: 16px;
  background: var(--gradient-main);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: 800;
  color: #fff;
  box-shadow:
    0 12px 32px rgba(37, 99, 235, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.auth-brand h1 {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.auth-sub {
  font-size: 11px;
  letter-spacing: 0.32em;
  color: var(--text-muted);
  margin-top: 6px;
  text-transform: uppercase;
}

.field {
  margin-bottom: 17px;
}
.field label {
  display: block;
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-bottom: 7px;
  letter-spacing: 0.03em;
}
.field-wrap {
  position: relative;
}
.f-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary);
  font-size: 14px;
  opacity: 0.85;
}
.f-input {
  padding-left: 38px;
  padding-top: 11px;
  padding-bottom: 11px;
  border-radius: 11px;
}
.btn-block {
  width: 100%;
  justify-content: center;
  padding: 12px;
  border-radius: 11px;
  font-size: 15px;
  letter-spacing: 0.2em;
  margin-top: 4px;
}
.spinner-sm {
  width: 16px;
  height: 16px;
  border-width: 2px;
}
.auth-links {
  text-align: center;
  margin-top: 20px;
  font-size: 13px;
  color: var(--text-muted);
}
.link {
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
}
.link:hover {
  text-decoration: underline;
}
/* 深色模式适配 */
html[data-theme='dark'] .auth-page {
  background:
    radial-gradient(1000px 500px at 70% -5%, rgba(37, 99, 235, 0.16), transparent 60%),
    radial-gradient(800px 460px at 10% 110%, rgba(56, 189, 248, 0.10), transparent 55%),
    var(--bg-canvas);
}
html[data-theme='dark'] .orb { opacity: 0.22; }
html[data-theme='dark'] .grid-overlay {
  background-image:
    linear-gradient(rgba(80, 140, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(80, 140, 255, 0.06) 1px, transparent 1px);
}
html[data-theme='dark'] .auth-card {
  background: rgba(16, 26, 46, 0.92);
  border-color: rgba(82, 120, 185, 0.26);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}
</style>
