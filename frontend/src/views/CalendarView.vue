<script setup>
/**
 * 任务日历 v2（企业级）
 * - 月 / 周 / 日 / 列表 4 种视图
 * - 点击日期新建任务、点击任务查看/编辑/完成/删除
 * - 拖拽任务卡片到任意日期换截止日
 * - 顶部统计条：总数/待办/进行中/完成/逾期
 * - 今日定位、年/月快速跳转、关键词搜索
 */
import { ref, computed, onMounted } from 'vue'
import AppModal from '../components/AppModal.vue'
import { getRangeTasks, getTasks, createTask, updateTask, changeTaskStatus, deleteTask } from '../api/task'
import { useToast } from '../stores/toast'

const toast = useToast()

/* ===== 基础状态 ===== */
const view = ref('month') // month | week | day | list
const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth() + 1)
const selectedDate = ref(todayStr())
const tasks = ref([])
const allTasks = ref([])
const loading = ref(false)
const keyword = ref('')

/* ===== 弹窗状态 ===== */
const modal = ref({ open: false, mode: 'create', date: '', task: null })
const form = ref({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' })
const saving = ref(false)

const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const PRIORITY = { high: 'pill-danger', medium: 'pill-warning', low: 'pill-success' }
const STATUS_TEXT = { todo: '待办', doing: '进行中', done: '已完成' }
const STATUS_PILL = { todo: 'pill-info', doing: 'pill-warning', done: 'pill-success' }

/* ===== 工具函数 ===== */
function pad(n) {
  return String(n).padStart(2, '0')
}
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function fmt(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function isToday(date) {
  return date === todayStr()
}
function parseDate(date) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/* ===== 派生数据 ===== */
const monthLabel = computed(() => `${year.value} 年 ${MONTHS[month.value - 1]}`)

const monthCells = computed(() => {
  const first = parseDate(`${year.value}-${pad(month.value)}-01`)
  const startDow = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year.value, month.value, 0).getDate()
  const cellsArr = []
  for (let i = 0; i < startDow; i++) cellsArr.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) {
    cellsArr.push({ day: d, date: `${year.value}-${pad(month.value)}-${pad(d)}` })
  }
  return cellsArr
})

const weekDates = computed(() => {
  const anchor = parseDate(selectedDate.value)
  const dow = (anchor.getDay() + 6) % 7
  const out = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - dow + i)
    out.push({ date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, day: d.getDate() })
  }
  return out
})

const filteredTasks = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  let list = tasks.value
  if (kw) {
    list = list.filter((t) => (t.title || '').toLowerCase().includes(kw) || (t.description || '').toLowerCase().includes(kw))
  }
  return [...list].sort((a, b) => String(a.due_date || '').slice(0, 10).localeCompare(String(b.due_date || '').slice(0, 10)))
})

const stats = computed(() => {
  const all = allTasks.value
  return {
    total: all.length,
    todo: all.filter((t) => t.status === 'todo').length,
    doing: all.filter((t) => t.status === 'doing').length,
    done: all.filter((t) => t.status === 'done').length,
    overdue: all.filter((t) => t.status !== 'done' && t.due_date && t.due_date.slice(0, 10) < todayStr()).length,
  }
})

function tasksOf(date) {
  return filteredTasks.value.filter((t) => String(t.due_date).slice(0, 10) === date)
}

const selectedDayLabel = computed(() => {
  const d = parseDate(selectedDate.value)
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · ${['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]}`
})

/* ===== 数据加载 ===== */
function rangeStartEnd() {
  if (view.value === 'month') {
    const lastDay = new Date(year.value, month.value, 0).getDate()
    return [`${year.value}-${pad(month.value)}-01`, `${year.value}-${pad(month.value)}-${pad(lastDay)}`]
  }
  if (view.value === 'week') {
    return [weekDates.value[0].date, weekDates.value[6].date]
  }
  if (view.value === 'list') {
    return ['2000-01-01', '2100-12-31'] // 列表视图展示全部任务
  }
  return [selectedDate.value, selectedDate.value]
}

async function load() {
  loading.value = true
  try {
    const [start, end] = rangeStartEnd()
    const [res, allRes] = await Promise.all([getRangeTasks(start, end), getTasks({ pageSize: 500 })])
    tasks.value = res?.data || []
    const body = allRes?.data
    allTasks.value = Array.isArray(body) ? body : body?.list || []
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

/* ===== 视图与导航 ===== */
function setView(v) {
  view.value = v
  load()
}
function prev() {
  if (view.value === 'month') {
    month.value -= 1
    if (month.value === 0) { month.value = 12; year.value -= 1 }
  } else if (view.value === 'week') {
    selectedDate.value = fmt(new Date(parseDate(selectedDate.value).getTime() - 7 * 86400000))
  } else if (view.value === 'day') {
    selectedDate.value = fmt(new Date(parseDate(selectedDate.value).getTime() - 86400000))
  }
  load()
}
function next() {
  if (view.value === 'month') {
    month.value += 1
    if (month.value === 13) { month.value = 1; year.value += 1 }
  } else if (view.value === 'week') {
    selectedDate.value = fmt(new Date(parseDate(selectedDate.value).getTime() + 7 * 86400000))
  } else if (view.value === 'day') {
    selectedDate.value = fmt(new Date(parseDate(selectedDate.value).getTime() + 86400000))
  }
  load()
}
function goToday() {
  const d = new Date()
  year.value = d.getFullYear()
  month.value = d.getMonth() + 1
  selectedDate.value = todayStr()
  load()
}
function pickDay(date) {
  selectedDate.value = date
  if (view.value === 'week') load()
}

/* ===== 新建 / 编辑 ===== */
function openCreate(date) {
  modal.value = { open: true, mode: 'create', date, task: null }
  form.value = { title: '', description: '', priority: 'medium', status: 'todo', dueDate: date || todayStr() }
}
function openEdit(task) {
  modal.value = { open: true, mode: 'edit', date: null, task }
  form.value = {
    title: task.title || '',
    description: task.description || '',
    priority: task.priority || 'medium',
    status: task.status || 'todo',
    dueDate: task.due_date ? task.due_date.slice(0, 10) : todayStr(),
  }
}
function closeModal() {
  modal.value.open = false
}

async function save() {
  const f = form.value
  if (!f.title.trim()) return toast.warn('请填写任务标题')
  if (!f.dueDate) return toast.warn('请选择截止日期')
  saving.value = true
  try {
    if (modal.value.mode === 'create') {
      await createTask({
        title: f.title.trim(),
        description: f.description.trim() || null,
        priority: f.priority,
        status: f.status,
        dueDate: f.dueDate,
      })
      toast.success('任务已创建')
    } else {
      await updateTask(modal.value.task.id, {
        title: f.title.trim(),
        description: f.description.trim() || null,
        priority: f.priority,
        status: f.status,
        dueDate: f.dueDate,
      })
      toast.success('任务已更新')
    }
    closeModal()
    load()
  } catch (e) {
    toast.error(e.message)
  } finally {
    saving.value = false
  }
}

async function markDone(task) {
  try {
    await changeTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')
    toast.success(task.status === 'done' ? '已恢复为待办' : `「${task.title}」已完成`)
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

async function removeTask(task) {
  if (!confirm(`确定删除任务「${task.title}」？`)) return
  try {
    await deleteTask(task.id)
    toast.success('任务已删除')
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

/* ===== 拖拽换日 ===== */
const dragTask = ref(null)
function onDragStart(task) {
  dragTask.value = task
}
async function onDrop(date) {
  const task = dragTask.value
  dragTask.value = null
  if (!task || !date) return
  if (String(task.due_date).slice(0, 10) === date) return
  try {
    await updateTask(task.id, {
      title: task.title,
      description: task.description || null,
      priority: task.priority,
      status: task.status,
      dueDate: date,
    })
    toast.success(`「${task.title}」已移至 ${date}`)
    load()
  } catch (e) {
    toast.error(e.message)
  }
}
function onDragOver(e) {
  e.preventDefault()
}

onMounted(load)
</script>

<template>
  <div>
    <!-- 页头 -->
    <div class="page-head">
      <div>
        <h2>任务日历</h2>
        <span class="sub">4 种视图 · 点日期新建 · 拖拽换日 · 点击任务卡片查看详情</span>
      </div>
      <div class="actions">
        <div class="seg">
          <button v-for="v in [['month', '月'], ['week', '周'], ['day', '日'], ['list', '列表']]" :key="v[0]" class="seg-btn" :class="{ on: view === v[0] }" @click="setView(v[0])">{{ v[1] }}</button>
        </div>
        <button class="btn btn-ghost btn-small" @click="prev">‹</button>
        <button class="btn btn-primary btn-small" @click="goToday">今天</button>
        <button class="btn btn-ghost btn-small" @click="next">›</button>
      </div>
    </div>

    <!-- 统计条 -->
    <div class="stat-strip glass-card mb-16">
      <div class="stat-item"><span class="num">{{ stats.total }}</span><span class="label">当前任务</span></div>
      <div class="stat-item"><span class="num c-info">{{ stats.todo }}</span><span class="label">待办</span></div>
      <div class="stat-item"><span class="num c-warn">{{ stats.doing }}</span><span class="label">进行中</span></div>
      <div class="stat-item"><span class="num c-ok">{{ stats.done }}</span><span class="label">已完成</span></div>
      <div class="stat-item"><span class="num c-danger">{{ stats.overdue }}</span><span class="label">已逾期</span></div>
      <div class="stat-search">
        <input v-model="keyword" class="input" placeholder="搜索任务标题…" @input="load" />
      </div>
    </div>

    <!-- 工具栏（月视图显示月份标题） -->
    <div class="cal-bar">
      <span v-if="view === 'month'" class="cal-title">{{ monthLabel }}</span>
      <span v-else class="cal-title">{{ view === 'week' ? '本周安排' : selectedDayLabel }}</span>
      <span class="cal-hint">拖拽任务卡片到任意日期即可调整截止日</span>
    </div>

    <!-- 月视图 -->
    <div v-if="view === 'month'" class="calendar glass-card">
      <div class="cal-week">
        <div v-for="w in WEEKDAYS" :key="w" class="cal-weekday">周{{ w }}</div>
      </div>
      <div v-if="loading" class="loading-bar"><span class="spinner" />加载中…</div>
      <div v-else class="cal-grid">
        <div
          v-for="(c, i) in monthCells"
          :key="i"
          class="cal-cell"
          :class="{ empty: !c.day, today: c.day && isToday(c.date) }"
          @dragover="onDragOver"
          @drop="onDrop(c.date)"
        >
          <template v-if="c.day">
            <div class="cal-cell-head">
              <span class="cal-day-num num" @click="pickDay(c.date)">{{ c.day }}</span>
              <button class="plus-btn" title="新建任务" @click.stop="openCreate(c.date)">＋</button>
            </div>
            <div class="cal-tasks">
              <button
                v-for="t in tasksOf(c.date)"
                :key="t.id"
                class="cal-task"
                :class="t.status === 'done' ? 'done' : PRIORITY[t.priority]"
                draggable="true"
                @dragstart="onDragStart(t)"
                @click.stop="openEdit(t)"
              >
                <span v-if="t.status === 'done'" class="tick">✓</span>
                {{ t.title }}
              </button>
              <div v-if="!tasksOf(c.date).length" class="cell-empty">＋ 添加</div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 周视图 -->
    <div v-else-if="view === 'week'" class="calendar glass-card">
      <div class="cal-grid week-grid">
        <div
          v-for="d in weekDates"
          :key="d.date"
          class="cal-cell"
          :class="{ today: isToday(d.date) }"
          @dragover="onDragOver"
          @drop="onDrop(d.date)"
        >
          <div class="cal-cell-head">
            <span class="cal-day-num num" :class="{ today: isToday(d.date) }">{{ d.day }}</span>
            <button class="plus-btn" title="新建任务" @click.stop="openCreate(d.date)">＋</button>
          </div>
          <div class="cal-tasks">
            <button
              v-for="t in tasksOf(d.date)"
              :key="t.id"
              class="cal-task"
              :class="t.status === 'done' ? 'done' : PRIORITY[t.priority]"
              draggable="true"
              @dragstart="onDragStart(t)"
              @click.stop="openEdit(t)"
            >
              <span v-if="t.status === 'done'" class="tick">✓</span>
              {{ t.title }}
            </button>
            <div v-if="!tasksOf(d.date).length" class="cell-empty">＋ 添加</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 日视图 -->
    <div v-else-if="view === 'day'" class="calendar glass-card">
      <div class="day-view" @dragover="onDragOver" @drop="onDrop(selectedDate)">
        <div class="day-head">
          <span class="day-date">{{ selectedDayLabel }}</span>
          <button class="btn btn-primary btn-small" @click="openCreate(selectedDate)">＋ 新建任务</button>
        </div>
        <div v-if="loading" class="loading-bar"><span class="spinner" />加载中…</div>
        <div v-else-if="!tasksOf(selectedDate).length" class="day-empty">
          <div class="empty-ico">▦</div>
          <div>这一天还没有任务</div>
          <button class="btn btn-ghost btn-small" @click="openCreate(selectedDate)">新建任务</button>
        </div>
        <div v-else class="day-list">
          <div v-for="t in tasksOf(selectedDate)" :key="t.id" class="day-item">
            <span class="pill" :class="STATUS_PILL[t.status]">{{ STATUS_TEXT[t.status] }}</span>
            <span class="day-item-title" :class="{ line: t.status === 'done' }">{{ t.title }}</span>
            <span class="pill day-prio" :class="PRIORITY[t.priority]">{{ { high: '高', medium: '中', low: '低' }[t.priority] }}</span>
            <span v-if="t.description" class="day-desc">{{ t.description }}</span>
            <div class="day-actions">
              <button class="btn btn-ghost btn-small" @click="openEdit(t)">编辑</button>
              <button class="btn btn-ghost btn-small" :class="{ ok: t.status !== 'done' }" @click="markDone(t)">{{ t.status === 'done' ? '恢复' : '完成' }}</button>
              <button class="btn btn-ghost btn-small danger" @click="removeTask(t)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-else class="calendar glass-card">
      <div v-if="loading" class="loading-bar"><span class="spinner" />加载中…</div>
      <div v-else-if="!filteredTasks.length" class="day-empty">
        <div class="empty-ico">☑</div>
        <div>当前范围没有任务</div>
        <button class="btn btn-ghost btn-small" @click="openCreate(todayStr())">新建任务</button>
      </div>
      <div v-else class="table-wrap">
        <table class="data-table striped">
          <thead>
            <tr><th>标题</th><th>截止日期</th><th>优先级</th><th>状态</th><th>创建时间</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="t in filteredTasks" :key="t.id">
              <td class="strong">
                <span v-if="t.status === 'done'" class="done-line">{{ t.title }}</span>
                <span v-else>{{ t.title }}</span>
                <span v-if="t.description" class="row-desc">{{ t.description }}</span>
              </td>
              <td><span class="pill" :class="t.status !== 'done' && String(t.due_date).slice(0, 10) < todayStr() ? 'pill-danger' : 'pill-info'">{{ String(t.due_date).slice(0, 10) }}</span></td>
              <td><span class="pill" :class="PRIORITY[t.priority]">{{ { high: '高', medium: '中', low: '低' }[t.priority] }}</span></td>
              <td><span class="pill" :class="STATUS_PILL[t.status]">{{ STATUS_TEXT[t.status] }}</span></td>
              <td class="muted">{{ String(t.created_at || '').slice(0, 10) }}</td>
              <td>
                <div class="row-actions">
                  <button class="btn btn-ghost btn-small" @click="openEdit(t)">编辑</button>
                  <button class="btn btn-ghost btn-small" :class="{ ok: t.status !== 'done' }" @click="markDone(t)">{{ t.status === 'done' ? '恢复' : '完成' }}</button>
                  <button class="btn btn-ghost btn-small danger" @click="removeTask(t)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 图例 -->
    <div class="cal-legend">
      <span class="legend-item"><i class="dot d-high" />高优先级</span>
      <span class="legend-item"><i class="dot d-mid" />中优先级</span>
      <span class="legend-item"><i class="dot d-low" />低优先级</span>
      <span class="legend-item"><i class="dot d-done" />已完成</span>
      <span class="legend-item"><i class="dot d-today" />今天</span>
    </div>

    <!-- 新建/编辑弹窗 -->
    <AppModal :open="modal.open" :title="modal.mode === 'create' ? '新建任务' : '编辑任务'" @close="closeModal">
      <div class="form-grid">
        <label class="field full">
          <span class="field-label">标题 <b class="req">*</b></span>
          <input v-model="form.title" class="input" placeholder="任务标题" maxlength="100" />
        </label>
        <label class="field">
          <span class="field-label">截止日期 <b class="req">*</b></span>
          <input v-model="form.dueDate" type="date" class="input" />
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
          <span class="field-label">状态</span>
          <select v-model="form.status" class="input">
            <option value="todo">待办</option>
            <option value="doing">进行中</option>
            <option value="done">已完成</option>
          </select>
        </label>
        <label class="field full">
          <span class="field-label">描述</span>
          <textarea v-model="form.description" class="input" rows="3" placeholder="任务补充说明（可选）" />
        </label>
      </div>
      <template #footer>
        <button class="btn btn-ghost" @click="closeModal">取消</button>
        <button class="btn btn-primary" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存' }}</button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 14px;
  flex-wrap: wrap;
}
.page-head h2 { font-size: 19px; font-weight: 800; }
.sub { font-size: 12.5px; color: var(--text-muted); display: block; margin-top: 3px; }
.actions { display: flex; gap: 8px; align-items: center; }

/* 分段切换 */
.seg {
  display: flex;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}
.seg-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 5px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.seg-btn:hover { color: var(--primary); }
.seg-btn.on {
  background: var(--gradient-main);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(37, 99, 235, 0.35);
}

/* 统计条 */
.stat-strip {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 10px 20px;
  flex-wrap: wrap;
}
.stat-item {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding: 4px 22px 4px 0;
  margin-right: 22px;
  border-right: 1px solid var(--border-subtle);
}
.stat-item .num { font-size: 21px; font-weight: 800; }
.stat-item .label { font-size: 12px; color: var(--text-muted); }
.c-info { color: var(--primary); }
.c-warn { color: var(--warning); }
.c-ok { color: var(--success); }
.c-danger { color: var(--danger); }
.stat-search { margin-left: auto; }
.stat-search .input { width: 230px; }

/* 工具栏 */
.cal-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 2px 10px;
  flex-wrap: wrap;
  gap: 8px;
}
.cal-title { font-size: 16px; font-weight: 800; }
.cal-hint { font-size: 11.5px; color: var(--text-muted); }

.calendar { padding: 16px 18px 14px; }
.cal-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 6px;
}
.cal-weekday {
  text-align: center;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-muted);
  padding: 6px 0;
  letter-spacing: 0.1em;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.cal-cell {
  min-height: 108px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 6px 7px;
  background: var(--bg-panel);
  transition: all 0.15s;
  position: relative;
}
.cal-cell:hover { border-color: var(--border-strong); box-shadow: var(--shadow-card); }
.cal-cell.empty { background: var(--bg-canvas); }
.cal-cell.today {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
}
.cal-cell-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cal-day-num {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  display: inline-block;
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  border-radius: 50%;
  cursor: pointer;
}
.cal-day-num.today {
  background: var(--gradient-main);
  color: #fff;
}
.plus-btn {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  width: 20px;
  height: 20px;
  line-height: 18px;
  border-radius: 50%;
  opacity: 0;
  transition: all 0.15s;
}
.cal-cell:hover .plus-btn { opacity: 1; }
.plus-btn:hover { background: var(--gradient-soft); color: var(--primary); }
.cal-tasks {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}
.cal-task {
  display: block;
  width: 100%;
  border: none;
  background: var(--bg-panel);
  text-align: left;
  font-size: 11px;
  border-radius: 6px;
  padding: 3px 7px;
  cursor: grab;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
  transition: all 0.12s;
}
.cal-task:hover { box-shadow: 0 0 0 1px var(--border-strong); }
.cal-task:active { cursor: grabbing; }
.cal-task.done { background: var(--bg-canvas); color: var(--text-muted); text-decoration: line-through; }
.tick { margin-right: 3px; }
.cell-empty {
  font-size: 10.5px;
  color: var(--text-muted);
  padding: 3px 7px;
}
.pill-danger { background: var(--danger-soft); color: var(--danger); }
.pill-warning { background: var(--warning-soft); color: var(--warning); }
.pill-success { background: var(--success-soft); color: var(--success); }

/* 周视图 */
.week-grid .cal-cell { min-height: 200px; }

/* 日视图 */
.day-view { min-height: 260px; }
.day-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 8px;
}
.day-date { font-size: 14.5px; font-weight: 700; }
.day-empty {
  text-align: center;
  padding: 46px 0;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.empty-ico {
  font-size: 34px;
  color: var(--text-muted);
}
.day-list { display: flex; flex-direction: column; gap: 10px; }
.day-item {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 16px;
  background: var(--bg-panel);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.day-item:hover { border-color: var(--border-strong); box-shadow: var(--shadow-card); }
.day-item-title { font-size: 14px; font-weight: 600; flex: 1; min-width: 120px; }
.day-item-title.line { text-decoration: line-through; color: var(--text-muted); }
.day-desc { font-size: 12px; color: var(--text-muted); width: 100%; }
.day-prio { font-size: 11px; }
.day-actions { display: flex; gap: 6px; }
.row-desc { display: block; font-size: 11.5px; color: var(--text-muted); font-weight: 400; margin-top: 2px; }
.done-line { text-decoration: line-through; color: var(--text-muted); }
.muted { color: var(--text-muted); font-size: 12px; }
.row-actions { display: flex; gap: 6px; }
.strong { font-weight: 600; }

/* 图例 */
.cal-legend {
  display: flex;
  gap: 16px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
  flex-wrap: wrap;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-muted);
}
.dot { width: 8px; height: 8px; border-radius: 50%; }
.d-high { background: var(--danger); }
.d-mid { background: var(--warning); }
.d-low { background: var(--success); }
.d-done { background: var(--text-muted); }
.d-today { background: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }

/* 弹窗表单 */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.field { display: flex; flex-direction: column; gap: 6px; }
.field.full { grid-column: 1 / -1; }
.field-label { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); }
.req { color: var(--danger); }
.field .input { width: 100%; }

@media (max-width: 900px) {
  .stat-search { margin-left: 0; width: 100%; }
  .stat-search .input { width: 100%; }
  .cal-grid { gap: 4px; }
  .cal-cell { min-height: 80px; padding: 4px; }
}
</style>
