<script setup>
/**
 * 团队通讯录：组织成员卡片视图
 */
import { ref, computed, onMounted } from 'vue'
import { getUsers } from '../api/user'
import { useToast } from '../stores/toast'

const toast = useToast()

const members = ref([])
const loading = ref(false)
const keyword = ref('')
const deptFilter = ref('')

const departments = computed(() => {
  const set = new Set()
  members.value.forEach((m) => m.department && set.add(m.department))
  return [...set]
})

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return members.value.filter((m) => {
    if (deptFilter.value && m.department !== deptFilter.value) return false
    if (!kw) return true
    return (
      (m.name || '').toLowerCase().includes(kw) ||
      (m.email || '').toLowerCase().includes(kw) ||
      (m.region || '').toLowerCase().includes(kw)
    )
  })
})

function avatarColor(name) {
  const colors = ['#2563eb', '#0fa968', '#7c3aed', '#e8960c', '#e5484d', '#0ea5e9', '#059669', '#d946ef']
  let h = 0
  for (const ch of name || '') h = (h * 31 + ch.charCodeAt(0)) % 997
  return colors[h % colors.length]
}

function roleLabel(r) {
  return r === 'admin' ? '管理员' : '成员'
}

function mailto(m) {
  window.location.href = `mailto:${m.email}`
}

async function load() {
  loading.value = true
  try {
    const res = await getUsers({ page: 1, pageSize: 500 })
    members.value = res.data.list || []
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head">
      <h2>团队通讯录</h2>
      <span class="sub">组织成员 · 按部门筛选 · 点击邮箱快速联系</span>
      <div class="actions">
        <span class="pill pill-info">{{ members.length }} 位成员</span>
      </div>
    </div>

    <div class="toolbar mb-16">
      <input v-model="keyword" class="input search-input" placeholder="搜索姓名 / 邮箱 / 地区…" />
      <select v-model="deptFilter" class="input sel" @change="">
        <option value="">全部部门</option>
        <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
      </select>
    </div>

    <div v-if="loading" class="loading-bar"><span class="spinner" />加载中…</div>
    <div v-else-if="!filtered.length" class="empty-state">没有匹配的成员</div>
    <div v-else class="member-grid">
      <div v-for="m in filtered" :key="m.id" class="glass-card member-card">
        <div class="member-top">
          <span class="member-avatar" :style="{ background: avatarColor(m.name) }">
            {{ (m.name || '?').charAt(0) }}
          </span>
          <span class="pill" :class="m.role === 'admin' ? 'pill-violet' : 'pill-info'">{{ roleLabel(m.role) }}</span>
        </div>
        <div class="member-name">{{ m.name }}</div>
        <div class="member-email">{{ m.email }}</div>
        <div class="member-meta">
          <span v-if="m.phone" class="meta-item">☏ {{ m.phone }}</span>
          <span v-if="m.department" class="meta-item">▤ {{ m.department }}</span>
          <span v-if="m.region" class="meta-item">⌖ {{ m.region }}</span>
          <span v-if="m.gender && m.gender !== 'unknown'" class="meta-item">{{ m.gender === 'male' ? '♂ 男' : '♀ 女' }}</span>
        </div>
        <div class="member-actions">
          <button class="btn btn-ghost btn-small" @click="mailto(m)">发邮件</button>
          <RouterLink :to="`/users/${m.id}/edit`" class="btn btn-ghost btn-small">详情</RouterLink>
        </div>
      </div>
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
.page-head h2 { font-size: 19px; font-weight: 800; }
.sub { font-size: 12.5px; color: var(--text-muted); display: block; margin-top: 3px; }
.actions { display: flex; gap: 8px; align-items: center; }
.toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.search-input { width: 300px; }
.sel { width: 150px; }
.member-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}
.member-card {
  padding: 18px 20px;
  transition: all 0.16s;
}
.member-card:hover { box-shadow: var(--shadow-lift); transform: translateY(-2px); }
.member-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.member-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  font-weight: 800;
  box-shadow: 0 0 0 3px #fff, 0 4px 14px rgba(23, 43, 77, 0.14);
}
.member-name { font-size: 15.5px; font-weight: 700; }
.member-email { font-size: 12.5px; color: var(--primary); margin-top: 2px; word-break: break-all; }
.member-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 12px;
  font-size: 12.5px;
  color: var(--text-secondary);
}
.member-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}
@media (max-width: 900px) {
  .search-input { width: 100%; }
}
</style>
