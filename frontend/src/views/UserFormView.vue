<script setup>
/**
 * 用户表单（暗色）：新增 / 编辑，角色状态仅管理员可改
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { createUser, updateUser, getUser } from '../api/user'
import { useUserStore } from '../stores/user'
import { toast } from '../utils/toast'
import { DEPARTMENTS } from '../utils/constants'
import { REGIONS, getProvinceCities, parseRegion, formatRegion } from '../utils/regions'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isEdit = computed(() => route.name === 'user-edit')
const id = route.params.id

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'user',
  status: 'active',
  gender: '',
  department: '',
  region: '',
  bio: '',
})
const saving = ref(false)
const error = ref('')
const strength = ref(0)
const strengthText = ['过弱', '较弱', '中等', '较强', '极强']

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

function calcStrength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw)) s++
  strength.value = s
}

onMounted(async () => {
  if (!isEdit.value) return
  try {
    const res = await getUser(id)
    form.name = res.data.name
    form.email = res.data.email
    form.phone = res.data.phone || ''
    form.role = res.data.role
    form.status = res.data.status
    form.gender = res.data.gender || ''
    form.department = res.data.department || ''
    form.region = res.data.region || ''
    form.bio = res.data.bio || ''
    const parsed = parseRegion(form.region)
    regionProvince.value = parsed.province
    regionCity.value = parsed.city
  } catch (e) {
    error.value = e.message
  }
})

async function submit() {
  error.value = ''
  if (!form.name || !form.email) {
    toast.error('请填写姓名和邮箱')
    return
  }
  form.region = regionTouched.value ? formatRegion(regionProvince.value, regionCity.value) : form.region
  saving.value = true
  try {
    if (isEdit.value) {
      await updateUser(id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        status: form.status,
        gender: form.gender,
        department: form.department,
        region: form.region,
        bio: form.bio,
      })
      toast.success('修改成功')
    } else {
      if (!form.password || form.password.length < 8) {
        toast.error('密码长度不能少于 8 位')
        return
      }
      await createUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
        gender: form.gender,
        department: form.department,
        region: form.region,
        bio: form.bio,
      })
      toast.success('创建成功')
    }
    router.push('/users')
  } catch (e) {
    error.value = e.message
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="glass-card form-card">
    <div class="page-head">
      <h2>{{ isEdit ? '编辑用户' : '新增用户' }}</h2>
      <span class="sub">{{ isEdit ? `正在编辑 #${id}` : '创建新的系统账号' }}</span>
    </div>

    <p v-if="error" class="error-box">{{ error }}</p>

    <form class="form" @submit.prevent="submit">
      <div class="form-grid">
        <div class="form-item">
          <label>姓名 <span class="req">*</span></label>
          <input v-model="form.name" class="input" required placeholder="请输入姓名" />
        </div>
        <div class="form-item">
          <label>邮箱 <span class="req">*</span></label>
          <input v-model="form.email" type="email" class="input" required placeholder="name@example.com" />
        </div>
        <div class="form-item">
          <label>手机号</label>
          <input v-model="form.phone" class="input" placeholder="选填" />
        </div>
        <div class="form-item">
          <label>初始密码 <span v-if="!isEdit" class="req">*</span><span v-else class="muted">（编辑时不修改）</span></label>
          <input
            v-model="form.password"
            type="password"
            class="input"
            :required="!isEdit"
            :placeholder="isEdit ? '留空表示不修改' : '至少 8 位，含大小写/数字/符号'"
            @input="calcStrength(form.password)"
          />
          <div v-if="form.password" class="strength-row">
            <div class="strength-bar">
              <i v-for="n in 5" :key="n" :class="{ on: strength >= n }" />
            </div>
            <span class="strength-text" :class="`s${strength}`">{{ strengthText[strength] }}</span>
          </div>
        </div>
        <div class="form-item">
          <label>角色</label>
          <select v-model="form.role" class="input" :disabled="!userStore.isAdmin">
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
          </select>
        </div>
        <div v-if="isEdit" class="form-item">
          <label>状态</label>
          <select v-model="form.status" class="input" :disabled="!userStore.isAdmin">
            <option value="active">启用</option>
            <option value="disabled">禁用</option>
          </select>
        </div>
        <div class="form-item">
          <label>性别</label>
          <select v-model="form.gender" class="input">
            <option value="">未设置</option>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>
        <div class="form-item">
          <label>部门</label>
          <select v-model="form.department" class="input">
            <option value="">未设置</option>
            <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>
        <div class="form-item">
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
        <div class="form-item full">
          <label>个人简介</label>
          <textarea v-model="form.bio" class="input" rows="2" placeholder="选填" />
        </div>
      </div>

      <div v-if="!userStore.isAdmin" class="role-tip">🔒 角色与状态仅管理员可修改</div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="saving">
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <button type="button" class="btn btn-ghost" @click="router.push('/users')">返回列表</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-card {
  padding: 26px 28px;
  max-width: 640px;
}
.page-head {
  margin-bottom: 18px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-item.full {
  grid-column: 1 / -1;
}
.region-picker {
  display: flex;
  gap: 8px;
}
.region-picker .input {
  flex: 1;
  min-width: 0;
}
.form-item label {
  display: block;
  margin-bottom: 7px;
  font-size: 12.5px;
  color: var(--text-secondary);
  font-weight: 500;
}
.req {
  color: var(--danger);
}
.muted {
  color: var(--text-muted);
  font-weight: 400;
  font-size: 12px;
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
.role-tip {
  margin-top: 14px;
  font-size: 12px;
  color: var(--text-muted);
}
.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 22px;
}
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
