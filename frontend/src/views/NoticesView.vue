<script setup>
/**
 * 通知公告管理
 */
import { ref, onMounted } from 'vue'
import { getNotices, createNotice, updateNotice, deleteNotice } from '../api/notice'
import AppModal from '../components/AppModal.vue'
import AppPagination from '../components/AppPagination.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useToast } from '../stores/toast'
import { formatTime } from '../utils/format'

const toast = useToast()

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(8)
const loading = ref(false)

const modalOpen = ref(false)
const editing = ref(null)
const form = ref({ title: '', content: '', type: 'notice', status: 'published' })
const confirmOpen = ref(false)
const deletingId = ref(null)

async function load() {
  loading.value = true
  try {
    const data = await getNotices({ page: page.value, pageSize: pageSize.value })
    list.value = data?.data?.list || []
    total.value = data?.data?.total || 0
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { title: '', content: '', type: 'notice', status: 'published' }
  modalOpen.value = true
}

function openEdit(n) {
  editing.value = n
  form.value = { title: n.title, content: n.content || '', type: n.type || 'notice', status: n.status || 'published' }
  modalOpen.value = true
}

async function submit() {
  if (!form.value.title.trim()) {
    toast.error('请输入标题')
    return
  }
  if (!form.value.content.trim()) {
    toast.error('请输入内容')
    return
  }
  try {
    if (editing.value) {
      await updateNotice(editing.value.id, form.value)
      toast.success('公告已更新')
    } else {
      await createNotice(form.value)
      toast.success('公告已发布')
    }
    modalOpen.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

function askDelete(n) {
  deletingId.value = n.id
  confirmOpen.value = true
}

async function doDelete() {
  try {
    await deleteNotice(deletingId.value)
    toast.success('公告已删除')
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head">
      <h2>通知公告</h2>
      <span class="sub">面向全站用户发布的通知 · 最新 5 条会出现在顶部铃铛</span>
      <div class="actions">
        <button class="btn btn-primary" @click="openCreate">＋ 发布公告</button>
      </div>
    </div>

    <section class="glass-card">
      <div v-if="loading" class="loading-bar"><span class="spinner" />加载中…</div>
      <div v-else-if="!list.length" class="empty-state">
        <div class="big">✉</div>暂无公告，点击右上角发布第一条
      </div>
      <div v-else class="notice-list">
        <article v-for="n in list" :key="n.id" class="notice-card">
          <div class="notice-left">
            <span class="notice-icon">✉</span>
          </div>
          <div class="notice-main">
            <div class="notice-row">
              <h3 class="notice-title">{{ n.title }}</h3>
              <span v-if="n.type === 'announcement'" class="pill pill-violet">公告</span>
              <span v-else class="pill pill-info">通知</span>
              <span v-if="n.status === 'draft'" class="pill pill-warning">草稿</span>
            </div>
            <p class="notice-content">{{ n.content }}</p>
            <div class="notice-meta">
              发布人：{{ n.author }} · {{ formatTime(n.created_at) }}
            </div>
          </div>
          <div class="notice-actions">
            <button class="btn btn-ghost btn-small" @click="openEdit(n)">编辑</button>
            <button class="btn btn-danger btn-small" @click="askDelete(n)">删除</button>
          </div>
        </article>
      </div>

      <AppPagination
        v-if="total > pageSize"
        :page="page"
        :total="total"
        :page-size="pageSize"
        @change="(p) => { page = p; load() }"
      />
    </section>

    <AppModal :open="modalOpen" :title="editing ? '编辑公告' : '发布公告'" @close="modalOpen = false">
      <div class="form-col">
        <label class="field">
          <span class="field-label">标题 *</span>
          <input v-model="form.title" class="input" placeholder="公告标题" />
        </label>
        <label class="field">
          <span class="field-label">类型</span>
          <select v-model="form.type" class="input">
            <option value="notice">通知</option>
            <option value="announcement">公告</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">状态</span>
          <select v-model="form.status" class="input">
            <option value="published">发布</option>
            <option value="draft">草稿</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">内容 *</span>
          <textarea v-model="form.content" class="input" rows="6" placeholder="公告正文…" />
        </label>
      </div>
      <div class="modal-actions">
        <button class="btn" @click="modalOpen = false">取消</button>
        <button class="btn btn-primary" @click="submit">发布</button>
      </div>
    </AppModal>

    <ConfirmDialog
      :open="confirmOpen"
      title="删除公告"
      message="确定删除该公告吗？"
      @cancel="confirmOpen = false"
      @confirm="doDelete(); confirmOpen = false"
    />
  </div>
</template>

<style scoped>
.notice-list {
  padding: 6px 18px 18px;
}
.notice-card {
  display: flex;
  gap: 16px;
  padding: 18px 8px;
  border-bottom: 1px solid var(--border-subtle);
}
.notice-card:last-child {
  border-bottom: none;
}
.notice-left {
  flex-shrink: 0;
}
.notice-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--gradient-soft);
  border: 1px solid rgba(37, 99, 235, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--primary);
}
.notice-main {
  flex: 1;
  min-width: 0;
}
.notice-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.notice-title {
  font-size: 15.5px;
  font-weight: 700;
}
.notice-content {
  font-size: 13.5px;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}
.notice-meta {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-muted);
}
.notice-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: flex-start;
  flex-shrink: 0;
}
.form-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field-label {
  font-size: 12.5px;
  color: var(--text-secondary);
  font-weight: 600;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}
</style>
