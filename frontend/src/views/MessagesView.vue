<script setup>
/**
 * 消息中心
 */
import { ref, computed, onMounted } from 'vue'
import { getMessages, markMessageRead, markAllRead, deleteMessage, getUnreadCount } from '../api/message'
import AppPagination from '../components/AppPagination.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useToast } from '../stores/toast'
import { formatTime } from '../utils/format'

const toast = useToast()

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const tab = ref('all')
const unread = ref(0)

const filtered = computed(() => {
  if (tab.value === 'unread') return list.value.filter((m) => !m.is_read)
  return list.value
})

async function load() {
  loading.value = true
  try {
    const data = await getMessages({ page: page.value, pageSize: pageSize.value, status: tab.value === 'unread' ? 'unread' : '' })
    list.value = data?.data?.list || []
    total.value = data?.data?.total || 0
    const u = await getUnreadCount()
    unread.value = u?.data?.count ?? 0
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

async function markRead(m) {
  if (m.is_read) return
  try {
    await markMessageRead(m.id)
    m.is_read = 1
    unread.value = Math.max(0, unread.value - 1)
  } catch (e) {
    toast.error(e.message)
  }
}

async function doMarkAll() {
  try {
    await markAllRead()
    list.value.forEach((m) => (m.is_read = 1))
    unread.value = 0
    toast.success('全部已读')
  } catch (e) {
    toast.error(e.message)
  }
}

const confirmOpen = ref(false)
const deletingId = ref(null)

function askDelete(m) {
  deletingId.value = m.id
  confirmOpen.value = true
}

async function doDelete() {
  try {
    await deleteMessage(deletingId.value)
    toast.success('消息已删除')
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

function typeIcon(type) {
  return { system: '⚙', notice: '✉', task: '☑', message: '❐' }[type] || '❐'
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head">
      <h2>消息中心</h2>
      <span class="sub">站内消息与系统通知</span>
      <div class="actions">
        <span class="pill pill-info">{{ unread }} 条未读</span>
        <button class="btn" @click="doMarkAll">全部已读</button>
      </div>
    </div>

    <div class="tabs mb-16">
      <button class="tab" :class="{ active: tab === 'all' }" @click="tab = 'all'; page = 1; load()">全部</button>
      <button class="tab" :class="{ active: tab === 'unread' }" @click="tab = 'unread'; page = 1; load()">未读 ({{ unread }})</button>
    </div>

    <section class="glass-card">
      <div v-if="loading" class="loading-bar"><span class="spinner" />加载中…</div>
      <div v-else-if="!filtered.length" class="empty-state">
        <div class="big">❐</div>暂无消息
      </div>
      <div v-else class="msg-list">
        <div
          v-for="m in filtered"
          :key="m.id"
          class="msg-item"
          :class="{ unread: !m.is_read }"
          @click="markRead(m)"
        >
          <span class="msg-icon">{{ typeIcon(m.type) }}</span>
          <div class="msg-main">
            <div class="msg-title-row">
              <span class="msg-title">{{ m.title }}</span>
              <span v-if="!m.is_read" class="unread-dot" />
            </div>
            <div class="msg-content">{{ m.content }}</div>
            <div class="msg-meta">{{ m.type === 'system' ? '系统' : '通知' }} · {{ formatTime(m.created_at) }}</div>
          </div>
          <button class="btn btn-danger btn-small" @click.stop="askDelete(m)">删除</button>
        </div>
      </div>

      <AppPagination
        v-if="total > pageSize"
        :page="page"
        :total="total"
        :page-size="pageSize"
        @change="(p) => { page = p; load() }"
      />
    </section>

    <ConfirmDialog
      :open="confirmOpen"
      title="删除消息"
      message="确定删除这条消息吗？"
      @cancel="confirmOpen = false"
      @confirm="doDelete(); confirmOpen = false"
    />
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
}
.tab {
  border: 1px solid var(--border-subtle);
  background: var(--bg-panel);
  color: var(--text-secondary);
  border-radius: 999px;
  padding: 7px 18px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.16s;
}
.tab:hover {
  color: var(--primary);
  border-color: #b9cae8;
}
.tab.active {
  background: var(--gradient-main);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
}
.msg-list {
  padding: 6px 18px 18px;
}
.msg-item {
  display: flex;
  gap: 14px;
  padding: 15px 8px;
  border-bottom: 1px solid var(--border-subtle);
  cursor: pointer;
  align-items: flex-start;
  border-radius: 8px;
  transition: background 0.14s;
}
.msg-item:hover {
  background: var(--bg-hover);
}
.msg-item.unread {
  background: rgba(37, 99, 235, 0.03);
}
.msg-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--gradient-soft);
  border: 1px solid rgba(37, 99, 235, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--primary);
  flex-shrink: 0;
}
.msg-main {
  flex: 1;
  min-width: 0;
}
.msg-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.msg-title {
  font-weight: 600;
  font-size: 14px;
}
.unread-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--danger);
}
.msg-content {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 3px;
}
.msg-meta {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 6px;
}
</style>
