<script setup>
/**
 * 待办任务看板
 */
import { ref, computed, onMounted } from 'vue'
import { getTaskBoard, createTask, updateTask, changeTaskStatus, deleteTask } from '../api/task'
import AppModal from '../components/AppModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useToast } from '../stores/toast'

const toast = useToast()

const board = ref({ todo: [], doing: [], done: [], stats: {} })
const loading = ref(false)

const modalOpen = ref(false)
const editing = ref(null) // null=新建
const form = ref({ title: '', description: '', priority: 'medium', dueDate: '' })

const confirmOpen = ref(false)
const deletingId = ref(null)

const columns = [
  { key: 'todo', title: '待办', color: '#2563eb', icon: '◌' },
  { key: 'doing', title: '进行中', color: '#e8960c', icon: '◐' },
  { key: 'done', title: '已完成', color: '#0fa968', icon: '●' },
]

function priorityLabel(p) {
  return { high: '高', medium: '中', low: '低' }[p] || '中'
}
function priorityClass(p) {
  return { high: 'pill-danger', medium: 'pill-warning', low: 'pill-success' }[p] || 'pill-info'
}

function overdueLabel(task) {
  if (task.status === 'done') return ''
  const now = new Date()
  const due = new Date(task.due_date)
  return task.due_date && due < now ? `已逾期 ${Math.ceil((now - due) / 86400000)} 天` : ''
}

async function load() {
  loading.value = true
  try {
    board.value = (await getTaskBoard())?.data || { todo: [], doing: [], done: [] }
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { title: '', description: '', priority: 'medium', dueDate: '' }
  modalOpen.value = true
}

function openEdit(task) {
  editing.value = task
  form.value = { title: task.title, description: task.description || '', priority: task.priority, dueDate: task.due_date ? task.due_date.slice(0, 10) : '' }
  modalOpen.value = true
}

async function submit() {
  if (!form.value.title.trim()) {
    toast.error('请输入任务标题')
    return
  }
  try {
    if (editing.value) {
      await updateTask(editing.value.id, form.value)
      toast.success('任务已更新')
    } else {
      await createTask(form.value)
      toast.success('任务已创建')
    }
    modalOpen.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

async function moveTo(task, status) {
  if (task.status === status) return
  try {
    await changeTaskStatus(task.id, status)
    toast.success('状态已更新')
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

function askDelete(task) {
  deletingId.value = task.id
  confirmOpen.value = true
}

async function doDelete() {
  try {
    await deleteTask(deletingId.value)
    toast.success('任务已删除')
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
      <h2>待办任务</h2>
      <span class="sub">个人任务看板 · 拖拽式状态流转</span>
      <div class="actions">
        <button class="btn btn-primary" @click="openCreate">＋ 新建任务</button>
      </div>
    </div>

    <!-- 统计行 -->
    <div class="stats-row mb-16">
      <div class="stat-chip">
        <span class="stat-num num">{{ board.stats?.todo || 0 }}</span>
        <span class="stat-label">待办</span>
      </div>
      <div class="stat-chip">
        <span class="stat-num num">{{ board.stats?.doing || 0 }}</span>
        <span class="stat-label">进行中</span>
      </div>
      <div class="stat-chip">
        <span class="stat-num num">{{ board.stats?.done || 0 }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-chip warn">
        <span class="stat-num num">{{ board.stats?.overdue || 0 }}</span>
        <span class="stat-label">已逾期</span>
      </div>
    </div>

    <div v-if="loading" class="loading-bar"><span class="spinner" />加载中…</div>
    <div v-else class="kanban">
      <div v-for="col in columns" :key="col.key" class="kanban-col">
        <div class="kanban-head">
          <span class="kanban-dot" :style="{ background: col.color }" />
          <span class="kanban-title">{{ col.title }}</span>
          <span class="kanban-count num">{{ board[col.key]?.length || 0 }}</span>
        </div>
        <div class="kanban-body">
          <div
            v-for="task in board[col.key]"
            :key="task.id"
            class="task-card"
            draggable="true"
            @dragstart="(e) => e.dataTransfer.setData('text/plain', task.id)"
            @dragover.prevent
            @drop.prevent="moveTo(task, col.key)"
          >
            <div class="task-title">{{ task.title }}</div>
            <div v-if="task.description" class="task-desc">{{ task.description }}</div>
            <div class="task-tags">
              <span class="pill" :class="priorityClass(task.priority)">优先级 {{ priorityLabel(task.priority) }}</span>
              <span v-if="task.due_date" class="pill pill-info num">{{ task.due_date.slice(0, 10) }}</span>
            </div>
            <div v-if="overdueLabel(task)" class="task-overdue">{{ overdueLabel(task) }}</div>
            <div class="task-actions">
              <button
                v-if="col.key !== 'todo'"
                class="btn btn-ghost btn-small"
                @click="moveTo(task, 'todo')"
              >← 待办</button>
              <button
                v-if="col.key === 'todo'"
                class="btn btn-ghost btn-small"
                @click="moveTo(task, 'doing')"
              >开始 →</button>
              <button
                v-if="col.key === 'doing'"
                class="btn btn-ghost btn-small"
                @click="moveTo(task, 'done')"
              >完成 ✓</button>
              <button class="btn btn-ghost btn-small" @click="openEdit(task)">编辑</button>
              <button class="btn btn-danger btn-small" @click="askDelete(task)">删</button>
            </div>
          </div>
          <div v-if="!board[col.key]?.length" class="kanban-empty">暂无任务</div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <AppModal :open="modalOpen" :title="editing ? '编辑任务' : '新建任务'" @close="modalOpen = false">
      <div class="form-grid">
        <label class="field">
          <span class="field-label">任务标题 *</span>
          <input v-model="form.title" class="input" placeholder="例如：完成季度报表" />
        </label>
        <label class="field">
          <span class="field-label">优先级</span>
          <select v-model="form.priority" class="input">
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">截止日期</span>
          <input v-model="form.dueDate" type="date" class="input" />
        </label>
        <label class="field full">
          <span class="field-label">描述</span>
          <textarea v-model="form.description" class="input" placeholder="任务详情…" />
        </label>
      </div>
      <div class="modal-actions">
        <button class="btn" @click="modalOpen = false">取消</button>
        <button class="btn btn-primary" @click="submit">保存</button>
      </div>
    </AppModal>

    <ConfirmDialog
      :open="confirmOpen"
      title="删除任务"
      message="确定删除该任务吗？此操作不可撤销。"
      @cancel="confirmOpen = false"
      @confirm="doDelete(); confirmOpen = false"
    />
  </div>
</template>

<style scoped>
.stats-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.stat-chip {
  flex: 1;
  min-width: 130px;
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-card);
}
.stat-chip.warn .stat-num {
  color: var(--danger);
}
.stat-num {
  font-size: 24px;
  font-weight: 800;
  background: var(--gradient-main);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.stat-label {
  font-size: 12.5px;
  color: var(--text-muted);
}
.kanban {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: start;
}
.kanban-col {
  background: var(--bg-canvas);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 14px;
  min-height: 300px;
}
.kanban-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px 12px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 12px;
}
.kanban-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.kanban-title {
  font-weight: 700;
  font-size: 14px;
}
.kanban-count {
  margin-left: auto;
  background: var(--bg-input);
  border-radius: 999px;
  padding: 0 9px;
  font-size: 12px;
  line-height: 20px;
}
.kanban-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.task-card {
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 13px;
  cursor: grab;
  transition: all 0.16s;
}
.task-card:hover {
  box-shadow: var(--shadow-lift);
  border-color: var(--border-subtle);
}
.task-title {
  font-weight: 600;
  font-size: 13.5px;
  margin-bottom: 4px;
}
.task-desc {
  font-size: 12.5px;
  color: var(--text-muted);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.task-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.task-overdue {
  margin-top: 8px;
  font-size: 12px;
  color: var(--danger);
  font-weight: 600;
}
.task-actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.kanban-empty {
  text-align: center;
  color: var(--text-muted);
  font-size: 12.5px;
  padding: 26px 0;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field.full {
  grid-column: 1 / -1;
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
@media (max-width: 900px) {
  .kanban {
    grid-template-columns: 1fr;
  }
}
</style>
