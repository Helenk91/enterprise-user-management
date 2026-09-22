<script setup>
/**
 * 操作日志页（暗色）：分页 + 类型/关键词筛选
 */
import { ref, onMounted } from 'vue'
import AppPagination from '../components/AppPagination.vue'
import { getLogs } from '../api/log'
import { format } from '../utils/format'

const logs = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const actionFilter = ref('')
const keyword = ref('')
const loading = ref(false)
const error = ref('')

const ACTION_TEXT = {
  LOGIN: '登录',
  LOGOUT: '登出',
  REGISTER: '注册',
  USER_CREATE: '创建用户',
  USER_UPDATE: '修改用户',
  USER_DELETE: '删除用户',
  USER_BATCH_DELETE: '批量删除',
  PASSWORD_CHANGE: '修改密码',
  PROFILE_UPDATE: '更新资料',
  NOTICE_CREATE: '发布公告',
  NOTICE_UPDATE: '修改公告',
  NOTICE_DELETE: '删除公告',
  TASK_CREATE: '创建任务',
  SESSION_KICK: '下线会话',
  USER_IMPORT: '导入用户',
  USER_BATCH_STATUS: '批量改状态',
  PASSWORD_RESET: '重置密码',
  FILE_CREATE: '上传文件',
}

// 类型 -> 胶囊样式
const ACTION_PILL = {
  LOGIN: 'pill-success',
  LOGOUT: 'pill-info',
  REGISTER: 'pill-violet',
  USER_CREATE: 'pill-info',
  USER_UPDATE: 'pill-info',
  USER_DELETE: 'pill-danger',
  USER_BATCH_DELETE: 'pill-danger',
  PASSWORD_CHANGE: 'pill-violet',
  PROFILE_UPDATE: 'pill-info',
  NOTICE_CREATE: 'pill-violet',
  NOTICE_UPDATE: 'pill-violet',
  NOTICE_DELETE: 'pill-danger',
  TASK_CREATE: 'pill-info',
  SESSION_KICK: 'pill-warning',
  USER_IMPORT: 'pill-success',
  USER_BATCH_STATUS: 'pill-warning',
  PASSWORD_RESET: 'pill-danger',
  FILE_CREATE: 'pill-info',
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await getLogs({
      page: page.value,
      pageSize,
      action: actionFilter.value,
      keyword: keyword.value,
    })
    logs.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
}

function reset() {
  actionFilter.value = ''
  keyword.value = ''
  page.value = 1
  load()
}

function goPage(p) {
  page.value = p
  load()
}

onMounted(load)
</script>

<template>
  <div class="glass-card list-card">
    <div class="card-head">
      <div class="card-title">
        <h2>操作日志</h2>
        <span class="count-badge num">{{ total }}</span>
      </div>
    </div>

    <div class="toolbar">
      <select v-model="actionFilter" class="input sel" @change="search">
        <option value="">全部操作类型</option>
        <option v-for="(text, key) in ACTION_TEXT" :key="key" :value="key">{{ text }}</option>
      </select>
      <div class="search-box">
        <span class="s-icon">⌕</span>
        <input v-model="keyword" class="input s-input" placeholder="按操作人 / 详情搜索" @keyup.enter="search" />
      </div>
      <button class="btn btn-small" @click="search">搜索</button>
      <button class="btn btn-ghost btn-small" @click="reset">重置</button>
    </div>

    <div v-if="error" class="error-box">{{ error }}</div>
    <div v-else-if="loading" class="loading-bar">
      <span class="spinner" />
      正在加载审计日志...
    </div>
    <div v-else-if="logs.length === 0" class="empty-state">暂无日志记录</div>

    <div v-else class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>操作类型</th>
            <th>操作详情</th>
            <th>操作人</th>
            <th>IP</th>
            <th>时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td class="cell-id num">#{{ log.id }}</td>
            <td>
              <span class="pill" :class="ACTION_PILL[log.action] || 'pill-info'">
                {{ ACTION_TEXT[log.action] || log.action }}
              </span>
            </td>
            <td class="cell-detail">{{ log.detail || '-' }}</td>
            <td>{{ log.user_name || '-' }}</td>
            <td class="cell-ip num">{{ log.ip || '-' }}</td>
            <td class="cell-time num">{{ format.dateTime(log.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination v-if="total > pageSize" :total="total" :page="page" :page-size="pageSize" @change="goPage" />
  </div>
</template>

<style scoped>
.list-card {
  padding: 22px 24px;
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.card-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.card-title h2 {
  font-size: 18px;
  font-weight: 700;
}
.count-badge {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: var(--primary);
  font-size: 12px;
  border-radius: 999px;
  padding: 2px 11px;
  font-weight: 600;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.sel {
  width: 160px;
  background: var(--bg-input);
}
.search-box {
  position: relative;
  flex: 1;
  min-width: 220px;
  max-width: 340px;
}
.s-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}
.s-input {
  padding-left: 36px;
}
.table-wrap {
  overflow-x: auto;
}
.cell-id {
  color: var(--text-muted);
}
.cell-detail {
  max-width: 340px;
  word-break: break-all;
  color: var(--text-secondary);
}
.cell-ip {
  color: var(--text-muted);
  font-size: 12.5px;
}
.cell-time {
  font-size: 12.5px;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
