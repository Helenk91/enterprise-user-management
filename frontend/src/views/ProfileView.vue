<script setup>
/**
 * 个人中心 v3：资料展示/编辑 + 修改密码 + 安全防护
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useToast } from '../stores/toast'
import { changePassword } from '../api/auth'
import { getProfile, updateProfile } from '../api/profile'
import { format } from '../utils/format'
import { DEPARTMENTS } from '../utils/constants'
import { REGIONS, getProvinceCities, parseRegion, formatRegion } from '../utils/regions'

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()

const profile = ref(null)
const editMode = ref(false)
const editForm = reactive({
  name: '',
  phone: '',
  gender: '',
  department: '',
  region: '',
  bio: '',
})
const saving = ref(false)

/* ===== 地区二级联动 ===== */
const regionProvince = ref('')
const regionCity = ref('')
const regionTouched = ref(false)
const cityOptions = computed(() => getProvinceCities(regionProvince.value))
function onProvinceChange() {
  regionTouched.value = true
  regionCity.value = ''
}
function onCityChange() {
  regionTouched.value = true
}

const passForm = reactive({ oldPassword: '', newPassword: '', confirm: '' })
const passSaving = ref(false)
const passError = ref('')

/* ===== 资料 ===== */
async function loadProfile() {
  try {
    profile.value = (await getProfile())?.data || null
    userStore.user = { ...userStore.user, ...profile.value }
  } catch (e) {
    toast.error(e.message)
  }
}

function openEdit() {
  const p = profile.value || {}
  Object.assign(editForm, {
    name: p.name || '',
    phone: p.phone || '',
    gender: p.gender || '',
    department: p.department || '',
    region: p.region || '',
    bio: p.bio || '',
  })
  const parsed = parseRegion(editForm.region)
  regionProvince.value = parsed.province
  regionCity.value = parsed.city
  editMode.value = true
}

async function saveProfile() {
  if (!editForm.name.trim()) {
    toast.error('姓名不能为空')
    return
  }
  saving.value = true
  try {
    editForm.region = regionTouched.value ? formatRegion(regionProvince.value, regionCity.value) : editForm.region
    const body = await updateProfile({ ...editForm })
    const data = body?.data || body
    profile.value = data
    userStore.user = { ...userStore.user, ...data }
    editMode.value = false
    toast.success('资料已更新')
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

/* ===== 修改密码 ===== */
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

function genderText(g) {
  return { male: '男', female: '女', unknown: '保密' }[g] || '未设置'
}

async function submitPass() {
  passError.value = ''
  if (!passForm.oldPassword || !passForm.newPassword) {
    toast.error('请填写原密码和新密码')
    return
  }
  if (passForm.newPassword !== passForm.confirm) {
    toast.error('两次输入的新密码不一致')
    return
  }
  passSaving.value = true
  try {
    await changePassword({ oldPassword: passForm.oldPassword, newPassword: passForm.newPassword })
    toast.success('密码修改成功，请重新登录')
    userStore.clearLocal()
    router.push('/login')
  } catch (e) {
    passError.value = e.message
    toast.error(e.message)
  } finally {
    passSaving.value = false
  }
}

onMounted(loadProfile)
</script>

<template>
  <div class="profile-grid">
    <!-- 账号信息 -->
    <div class="glass-card p-card">
      <h3 class="p-title">账号信息</h3>
      <div class="p-avatar-wrap">
        <span class="p-avatar" :class="`ua-${userStore.user?.role}`">
          {{ (userStore.displayName || '?').charAt(0) }}
        </span>
        <div>
          <div class="p-name">{{ userStore.displayName }}</div>
          <span class="pill" :class="userStore.isAdmin ? 'pill-violet' : 'pill-info'">
            {{ userStore.isAdmin ? '管理员' : '普通用户' }}
          </span>
        </div>
      </div>

      <template v-if="!editMode">
        <div class="p-info-list">
          <div class="p-item"><span>邮箱</span><b>{{ profile?.email || '-' }}</b></div>
          <div class="p-item"><span>手机号</span><b>{{ profile?.phone || '-' }}</b></div>
          <div class="p-item"><span>性别</span><b>{{ genderText(profile?.gender) }}</b></div>
          <div class="p-item"><span>部门</span><b>{{ profile?.department || '未设置' }}</b></div>
          <div class="p-item"><span>地区</span><b>{{ profile?.region || '未设置' }}</b></div>
          <div class="p-item"><span>个人简介</span><b>{{ profile?.bio || '—' }}</b></div>
          <div class="p-item"><span>注册时间</span><b>{{ format.dateTime(profile?.created_at) }}</b></div>
          <div class="p-item"><span>最后登录</span><b>{{ format.dateTime(profile?.last_login_at) }}</b></div>
        </div>
        <button class="btn btn-primary mt-16" @click="openEdit">编辑资料</button>
      </template>

      <template v-else>
        <div class="p-form">
          <div class="p-field">
            <label>姓名</label>
            <input v-model="editForm.name" class="input" placeholder="姓名" />
          </div>
          <div class="p-field">
            <label>手机号</label>
            <input v-model="editForm.phone" class="input" placeholder="手机号" />
          </div>
          <div class="p-field-row">
            <div class="p-field">
              <label>性别</label>
              <select v-model="editForm.gender" class="input">
                <option value="">未设置</option>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
            <div class="p-field">
              <label>部门</label>
              <select v-model="editForm.department" class="input">
                <option value="">未设置</option>
                <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
          </div>
          <div class="p-field">
            <label>地区</label>
            <div class="region-picker">
              <select v-model="regionProvince" class="input" @change="onProvinceChange">
                <option value="">请选择省份</option>
                <option v-for="p in REGIONS" :key="p.name" :value="p.name">{{ p.name }}</option>
              </select>
              <select v-model="regionCity" class="input" :disabled="!regionProvince" @change="onCityChange">
                <option value="">请选择城市</option>
                <option v-for="c in cityOptions" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
          </div>
          <div class="p-field">
            <label>个人简介</label>
            <textarea v-model="editForm.bio" class="input" rows="3" placeholder="介绍一下自己…" />
          </div>
          <div class="p-actions">
            <button class="btn" @click="editMode = false">取消</button>
            <button class="btn btn-primary" :disabled="saving" @click="saveProfile">
              {{ saving ? '保存中…' : '保存资料' }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- 修改密码 -->
    <div class="glass-card p-card">
      <h3 class="p-title">修改密码</h3>
      <p class="p-desc">修改后当前登录状态将失效，需重新登录。密码需 8 位以上并包含大小写字母、数字和特殊字符。</p>
      <p v-if="passError" class="error-box">{{ passError }}</p>

      <form class="p-form" @submit.prevent="submitPass">
        <div class="p-field">
          <label>原密码</label>
          <input v-model="passForm.oldPassword" type="password" class="input" placeholder="输入当前密码" autocomplete="current-password" />
        </div>
        <div class="p-field">
          <label>新密码</label>
          <input v-model="passForm.newPassword" type="password" class="input" placeholder="8 位以上，含大小写/数字/符号" autocomplete="new-password" @input="calcStrength(passForm.newPassword)" />
          <div v-if="passForm.newPassword" class="strength-row">
            <div class="strength-bar">
              <i v-for="n in 5" :key="n" :class="{ on: strength >= n }" :style="{ width: '18%' }" />
            </div>
            <span class="strength-text" :class="`s${strength}`">{{ strengthText[strength] }}</span>
          </div>
        </div>
        <div class="p-field">
          <label>确认新密码</label>
          <input v-model="passForm.confirm" type="password" class="input" placeholder="再次输入新密码" autocomplete="new-password" />
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="passSaving">
          {{ passSaving ? '提交中...' : '确认修改密码' }}
        </button>
      </form>
    </div>

    <!-- 安全状态 -->
    <div class="glass-card p-card">
      <h3 class="p-title">安全防护</h3>
      <ul class="sec-list">
        <li><span class="sec-ok">✓</span> 令牌黑名单：退出登录后立即失效</li>
        <li><span class="sec-ok">✓</span> 连续 5 次密码错误自动锁定 15 分钟</li>
        <li><span class="sec-ok">✓</span> 登录接口限流：每分钟最多 10 次尝试</li>
        <li><span class="sec-ok">✓</span> 密码强度策略：强制大小写/数字/特殊字符</li>
        <li><span class="sec-ok">✓</span> 全局限流 + 安全响应头 + CORS 白名单</li>
        <li><span class="sec-ok">✓</span> 敏感操作审计日志（登录/登出/改密/增删改）</li>
        <li><span class="sec-ok">✓</span> 登录历史与会话管理：可远程下线设备</li>
        <li><span class="sec-ok">✓</span> RBAC 角色权限：细粒度接口鉴权</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.profile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.p-card {
  padding: 22px 24px;
}
.p-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
}
.p-desc {
  font-size: 12.5px;
  color: var(--text-muted);
  margin-bottom: 14px;
}
.p-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.p-avatar {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  color: #fff;
}
.ua-admin {
  background: linear-gradient(135deg, var(--chart-violet), var(--chart-indigo));
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.35);
}
.ua-user {
  background: var(--gradient-main);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
}
.p-name {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 6px;
}
.p-info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.p-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #dfe6f2;
}
.p-item span {
  color: var(--text-muted);
  font-size: 13px;
}
.p-item b {
  font-size: 13px;
  font-weight: 500;
  word-break: break-all;
  text-align: right;
  color: var(--text-primary);
}
.p-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.p-field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.region-picker {
  display: flex;
  gap: 8px;
}
.region-picker .input {
  flex: 1;
  min-width: 0;
}
.p-field label {
  display: block;
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}
.p-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.strength-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
.strength-bar {
  flex: 1;
  display: flex;
  gap: 4px;
}
.strength-bar i {
  height: 5px;
  border-radius: 99px;
  background: #e3e9f4;
  transition: all 0.2s;
}
.strength-bar i.on {
  background: var(--success);
  box-shadow: 0 0 8px rgba(15, 169, 104, 0.5);
}
.strength-text {
  font-size: 11.5px;
  color: var(--text-muted);
  width: 34px;
}
.strength-text.s1 { color: var(--danger); }
.strength-text.s2 { color: var(--warning); }
.strength-text.s3 { color: #b8860b; }
.strength-text.s4 { color: var(--success); }
.strength-text.s5 { color: var(--success); }
.btn-block {
  width: 100%;
  justify-content: center;
}
.sec-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sec-list li {
  display: flex;
  gap: 9px;
  font-size: 13px;
  color: var(--text-secondary);
  align-items: baseline;
}
.sec-ok {
  color: var(--success);
  font-weight: 700;
}
@media (max-width: 900px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }
}
</style>
