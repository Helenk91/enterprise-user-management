<script setup>
/**
 * 账户安全：登录历史 + 会话管理
 */
import { ref, computed, onMounted } from 'vue'
import { getLoginHistory, getSessions, revokeSession } from '../api/security'
import AppPagination from '../components/AppPagination.vue'
import { useToast } from '../stores/toast'
import { formatTime } from '../utils/format'

const toast = useToast()

const loading = ref(false)
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')

const sessions = ref([])
const sessionsLoading = ref(false)

/* 设备图标 */
function deviceIcon(ua) {
  if (!ua) return '🖥'
  const s = ua.toLowerCase()
  if (s.includes('iphone') || s.includes('android')) return '📱'
  if (s.includes('macintosh')) return '💻'
  return '🖥'
}

function deviceName(ua) {
  if (!ua) return '未知设备'
  const s = ua.toLowerCase()
  const browser = s.includes('edg') ? 'Edge' : s.includes('firefox') ? 'Firefox' : s.includes('chrome') ? 'Chrome' : '浏览器'
  const os = s.includes('iphone') || s.includes('ios') ? 'iOS' : s.includes('android') ? 'Android' : s.includes('mac') ? 'macOS' : s.includes('windows') ? 'Windows' : '未知系统'
  return `${os} · ${browser}`
}

async function loadHistory() {
  loading.value = true
  try {
    const data = await getLoginHistory({ page: page.value, pageSize: pageSize.value, keyword: keyword.value.trim() })
    list.value = data?.data?.list || []
    total.value = data?.data?.total || 0
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

async function loadSessions() {
  sessionsLoading.value = true
  try {
    const data = await getSessions()
    sessions.value = data?.data || []
  } catch (e) {
    toast.error(e.message)
  } finally {
    sessionsLoading.value = false
  }
}

async function doRevoke(session) {
  try {
    await revokeSession(session.id)
    toast.success(`已下线 ${session.device || '该设备'} 会话`)
    loadSessions()
  } catch (e) {
    toast.error(e.message)
  }
}

onMounted(() => {
  loadHistory()
  loadSessions()
})
</script>

<template>
  <div>
    <div class="page-head">
      <h2>账户安全</h2>
      <span class="sub">登录历史与会话管理 · 可疑设备可立即下线</span>
    </div>

    <!-- 活跃会话 -->
    <section class="glass-card mb-16">
      <div class="card-head">
        <div class="card-title">当前活跃会话</div>
        <span class="pill pill-success">{{ sessions.length }} 个在线</span>
      </div>
      <div v-if="sessionsLoading" class="loading-bar"><span class="spinner" />加载中…</div>
      <div v-else-if="!sessions.length" class="empty-state">暂无活跃会话</div>
      <div v-else class="session-grid">
        <div v-for="s in sessions" :key="s.id" class="session-card" :class="{ current: s.current }">
          <div class="session-top">
            <span class="session-device">{{ deviceIcon(s.user_agent) }}</span>
            <span v-if="s.current" class="pill pill-info">当前设备</span>
            <span v-else class="pill pill-warning">其他设备</span>
          </div>
          <div class="session-device-name">{{ deviceName(s.user_agent) }}</div>
          <div class="session-meta">
            <div>IP：<span class="num">{{ s.ip || '未知' }}</span></div>
            <div>最后活跃：{{ formatTime(s.last_active_at) }}</div>
          </div>
          <button v-if="!s.current" class="btn btn-danger btn-small" @click="doRevoke(s)">下线会话</button>
        </div>
      </div>
    </section>

    <!-- 登录历史 -->
    <section class="glass-card">
      <div class="card-head">
        <div class="card-title">登录历史</div>
        <div class="card-tools">
          <input v-model="keyword" class="input input-sm" placeholder="按 IP / 设备搜索" @keyup.enter="page = 1; loadHistory()" />
          <button class="btn btn-primary btn-small" @click="page = 1; loadHistory()">查询</button>
        </div>
      </div>

      <div v-if="loading" class="loading-bar"><span class="spinner" />加载中…</div>
      <div v-else-if="!list.length" class="empty-state">暂无登录记录</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>IP 地址</th>
              <th>设备</th>
              <th>结果</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in list" :key="row.id">
              <td class="num">{{ formatTime(row.created_at) }}</td>
              <td class="num">{{ row.ip || '—' }}</td>
              <td>
                <span class="device-cell">{{ deviceIcon(row.user_agent) }} {{ deviceName(row.user_agent) }}</span>
              </td>
              <td>
                <span v-if="row.status === 'success'" class="pill pill-success">成功</span>
                <span v-else class="pill pill-danger">失败</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AppPagination
        v-if="total > pageSize"
        :page="page"
        :total="total"
        :page-size="pageSize"
        @change="(p) => { page = p; loadHistory() }"
      />
    </section>
  </div>
</template>

<style scoped>
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-subtle);
}
.card-title {
  font-size: 15px;
  font-weight: 700;
}
.card-tools {
  display: flex;
  gap: 8px;
  align-items: center;
}
.input-sm {
  width: 190px;
  padding: 7px 12px;
  font-size: 13px;
}
.table-wrap {
  padding: 0 18px;
  overflow-x: auto;
}
.session-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  padding: 18px;
}
.session-card {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px;
  background: var(--bg-panel);
  transition: all 0.18s;
}
.session-card:hover {
  box-shadow: var(--shadow-lift);
}
.session-card.current {
  border-color: rgba(37, 99, 235, 0.4);
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.04), rgba(56, 189, 248, 0.04));
}
.session-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.session-device {
  font-size: 26px;
}
.session-device-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
}
.session-meta {
  font-size: 12.5px;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}
.device-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
