<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../api/auth'
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

const form = ref({ name: '', email: '', phone: '', password: '', confirm: '' })
const loading = ref(false)

const strength = ref(0)
const strengthText = ['过弱', '较弱', '中等', '较强', '极强']

function calcStrength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw)) s++
  strength.value = s
}

async function submit() {
  const { name, email, phone, password, confirm } = form.value
  if (!name || !email || !password) {
    toast.error('请填写姓名、邮箱和密码')
    return
  }
  if (password.length < 8) {
    toast.error('密码长度不能少于 8 位')
    return
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    toast.error('密码必须同时包含大小写字母')
    return
  }
  if (!/\d/.test(password)) {
    toast.error('密码必须包含数字')
    return
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    toast.error('密码必须包含特殊字符（如 @#$）')
    return
  }
  if (password !== confirm) {
    toast.error('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    await register({ name, email, phone, password })
    toast.success('注册成功，请登录')
    router.push('/login')
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
    <div class="orb orb-1" />
    <div class="orb orb-2" />
    <div class="grid-overlay" />

    <div class="auth-card glass-card">
      <div class="auth-brand">
        <div class="auth-logo">R</div>
        <h1>创建账号</h1>
        <p class="auth-sub">Join the Workspace</p>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <div class="field">
          <label>姓名</label>
          <div class="field-wrap">
            <span class="f-icon">◉</span>
            <input v-model="form.name" class="input f-input" placeholder="请输入姓名" required />
          </div>
        </div>
        <div class="field">
          <label>邮箱</label>
          <div class="field-wrap">
            <span class="f-icon">@</span>
            <input v-model="form.email" type="email" class="input f-input" placeholder="name@example.com" required autocomplete="username" />
          </div>
        </div>
        <div class="field">
          <label>手机号（选填）</label>
          <div class="field-wrap">
            <span class="f-icon">✆</span>
            <input v-model="form.phone" class="input f-input" placeholder="请输入手机号" />
          </div>
        </div>
        <div class="field">
          <label>密码</label>
          <div class="field-wrap">
            <span class="f-icon">✦</span>
            <input v-model="form.password" type="password" class="input f-input" placeholder="至少 8 位，含大小写/数字/符号" required autocomplete="new-password" @input="calcStrength(form.password)" />
          </div>
          <div v-if="form.password" class="strength-row">
            <div class="strength-bar">
              <i v-for="n in 5" :key="n" :class="{ on: strength >= n }" />
            </div>
            <span class="strength-text" :class="`s${strength}`">{{ strengthText[strength] }}</span>
          </div>
        </div>
        <div class="field">
          <label>确认密码</label>
          <div class="field-wrap">
            <span class="f-icon">✓</span>
            <input v-model="form.confirm" type="password" class="input f-input" placeholder="再次输入密码" required autocomplete="new-password" />
          </div>
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="loading" class="spinner spinner-sm" />
          {{ loading ? '创建中...' : '注 册' }}
        </button>
      </form>

      <div class="auth-links">
        <span>已有账号？</span>
        <RouterLink to="/login" class="link">返回登录</RouterLink>
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
    radial-gradient(1000px 500px at 30% -5%, rgba(37, 99, 235, 0.10), transparent 60%),
    radial-gradient(800px 460px at 90% 110%, rgba(56, 189, 248, 0.08), transparent 55%),
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
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.32;
  animation: float 9s ease-in-out infinite;
}
.orb-1 {
  width: 340px;
  height: 340px;
  right: -60px;
  top: -50px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.45), transparent 70%);
}
.orb-2 {
  width: 280px;
  height: 280px;
  left: -50px;
  bottom: -50px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.45), transparent 70%);
  animation-delay: -4s;
}
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(28px, -20px) scale(1.05); }
  66% { transform: translate(-18px, 16px) scale(0.97); }
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
.auth-card {
  position: relative;
  z-index: 2;
  width: 420px;
  max-width: 94vw;
  padding: 30px 36px;
  border-radius: 20px;
  background: var(--bg-panel);
  backdrop-filter: blur(18px);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
}
.auth-brand {
  text-align: center;
  margin-bottom: 22px;
}
.auth-logo {
  width: 54px;
  height: 54px;
  margin: 0 auto 12px;
  border-radius: 15px;
  background: linear-gradient(135deg, #059669, #10b981);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 27px;
  font-weight: 800;
  color: #fff;
  box-shadow:
    0 12px 32px rgba(16, 185, 129, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.auth-brand h1 {
  font-size: 20px;
  font-weight: 700;
}
.auth-sub {
  font-size: 11px;
  letter-spacing: 0.3em;
  color: var(--text-muted);
  margin-top: 5px;
  text-transform: uppercase;
}
.field {
  margin-bottom: 14px;
}
.field label {
  display: block;
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-bottom: 6px;
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
  font-size: 13px;
  opacity: 0.85;
}
.f-input {
  padding-left: 38px;
  padding-top: 10px;
  padding-bottom: 10px;
  border-radius: 11px;
}
.strength-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 7px;
}
.strength-bar {
  flex: 1;
  display: flex;
  gap: 4px;
}
.strength-bar i {
  height: 5px;
  flex: 1;
  border-radius: 99px;
  background: rgba(94, 130, 204, 0.18);
  transition: all 0.2s;
}
.strength-bar i.on {
  background: var(--success);
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.6);
}
.strength-text {
  font-size: 11.5px;
  color: var(--text-muted);
  width: 32px;
  text-align: right;
}
.strength-text.s1 { color: var(--danger); }
.strength-text.s2 { color: var(--warning); }
.strength-text.s3 { color: #fde68a; }
.strength-text.s4 { color: #a7f3d0; }
.strength-text.s5 { color: var(--success); }
.btn-block {
  width: 100%;
  justify-content: center;
  padding: 12px;
  border-radius: 11px;
  font-size: 15px;
  letter-spacing: 0.2em;
  margin-top: 2px;
}
.spinner-sm {
  width: 16px;
  height: 16px;
  border-width: 2px;
}
.auth-links {
  text-align: center;
  margin-top: 16px;
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
    radial-gradient(1000px 500px at 30% -5%, rgba(37, 99, 235, 0.16), transparent 60%),
    radial-gradient(800px 460px at 90% 110%, rgba(56, 189, 248, 0.10), transparent 55%),
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
