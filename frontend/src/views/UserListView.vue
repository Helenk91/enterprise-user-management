<script setup>
/**
 * 用户管理 v3：搜索 / 分页 / 批量操作 / 导入 / 重置密码 / CSV 导出 / 详情弹窗
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppPagination from '../components/AppPagination.vue'
import AppModal from '../components/AppModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { getUsers, deleteUser, batchDeleteUsers, exportCsv, importUsers, batchStatus, resetPassword } from '../api/user'
import { format } from '../utils/format'
import { toast } from '../utils/toast'

const router = useRouter()

const users = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = 10
const keyword = ref('')
const loading = ref(false)
const error = ref('')

const selected = ref([])
const allChecked = ref(false)

const detailVisible = ref(false)
const detailUser = ref(null)

const confirmVisible = ref(false)
const confirmPayload = ref({ type: '', id: null, name: '' })

/* 导入 */
const importVisible = ref(false)
const importText = ref('')
const importResult = ref(null)
const importing = ref(false)

/* 重置密码 */
const resetVisible = ref(false)
const resetUser = ref(null)
const resetPwd = ref('')
const resetting = ref(false)

async function loadUsers() {
  loading.value = true
  error.value = ''
  try {
    const res = await getUsers({
      page: page.value,
      pageSize,
      keyword: keyword.value,
    })
    users.value = res.data.list
    total.value = res.data.total
    selected.value = []
    allChecked.value = false
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  loadUsers()
}

function reset() {
  keyword.value = ''
  page.value = 1
  loadUsers()
}

function goPage(p) {
  page.value = p
  loadUsers()
}

function toggleAll() {
  allChecked.value = !allChecked.value
  selected.value = allChecked.value ? users.value.map((u) => u.id) : []
}

function toggleOne(id) {
  const idx = selected.value.indexOf(id)
  if (idx > -1) selected.value.splice(idx, 1)
  else selected.value.push(id)
  allChecked.value = users.value.length > 0 && selected.value.length === users.value.length
}

function askDelete(id, name) {
  confirmPayload.value = { type: 'single', id, name }
  confirmVisible.value = true
}

function askBatchDelete() {
  confirmPayload.value = { type: 'batch', id: null, name: `${selected.value.length} 个用户` }
  confirmVisible.value = true
}

async function doConfirm() {
  confirmVisible.value = false
  try {
    if (confirmPayload.value.type === 'single') {
      await deleteUser(confirmPayload.value.id)
      toast.success('删除成功')
    } else {
      const res = await batchDeleteUsers(selected.value)
      toast.success(res.message || '批量删除成功')
    }
    if (users.value.length === selected.value.length && page.value > 1) {
      page.value -= 1
    }
    await loadUsers()
  } catch (e) {
    toast.error(e.message)
  }
}

/* 批量启用/禁用 */
const statusConfirm = ref({ open: false, status: 'active' })
function askBatchStatus(status) {
  statusConfirm.value = { open: true, status }
}
async function doBatchStatus() {
  try {
    const res = await batchStatus(selected.value, statusConfirm.value.status)
    toast.success(res.message || '状态已更新')
    loadUsers()
  } catch (e) {
    toast.error(e.message)
  }
}

/* 导入用户 */
function openImport() {
  importText.value = ''
  importResult.value = null
  importVisible.value = true
}

function parseImportRows() {
  const rows = []
  const lines = importText.value.trim().split('\n')
  for (const line of lines) {
    const cols = line.split(/[,，\t]/).map((s) => s.trim())
    if (!cols[0] || !cols[1]) continue
    rows.push({
      name: cols[0],
      email: cols[1],
      phone: cols[2] || '',
      password: cols[3] || 'User@12345',
      department: cols[4] || '',
      region: cols[5] || '',
    })
  }
  return rows
}

async function doImport() {
  const rows = parseImportRows()
  if (!rows.length) {
    toast.error('请按格式填写数据：姓名,邮箱,手机号,密码,部门,地区')
    return
  }
  importing.value = true
  try {
    const res = await importUsers(rows)
    importResult.value = res
    toast.success(res.message)
    loadUsers()
  } catch (e) {
    toast.error(e.message)
  } finally {
    importing.value = false
  }
}

/* 重置密码 */
function openReset(u) {
  resetUser.value = u
  resetPwd.value = ''
  resetVisible.value = true
}
async function doReset() {
  if (!resetPwd.value) {
    toast.error('请输入新密码')
    return
  }
  resetting.value = true
  try {
    const res = await resetPassword(resetUser.value.id, resetPwd.value)
    toast.success(res.message || '密码已重置')
    resetVisible.value = false
  } catch (e) {
    toast.error(e.message)
  } finally {
    resetting.value = false
  }
}

async function doExport() {
  try {
    const res = await exportCsv({ keyword: keyword.value })
    const blob = new Blob([res], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('导出成功，请查看下载文件')
  } catch (e) {
    toast.error(e.message)
  }
}

function showDetail(u) {
  detailUser.value = u
  detailVisible.value = true
}

function genderText(g) {
  return { male: '男', female: '女', unknown: '保密' }[g] || '未设置'
}

onMounted(loadUsers)
</script>

<template>
  <div class="glass-card list-card">
    <div class="card-head">
      <div class="card-title">
        <h2>用户管理</h2>
        <span class="count-badge num">{{ total }}</span>
      </div>
      <div class="head-actions">
        <button class="btn btn-ghost btn-small" @click="doExport">⬇ 导出 CSV</button>
        <button class="btn btn-ghost btn-small" @click="openImport">⇪ 批量导入</button>
        <button class="btn btn-primary btn-small" @click="router.push('/users/new')">＋ 新增用户</button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-box">
        <span class="s-icon">⌕</span>
        <input
          v-model="keyword"
          class="input s-input"
          placeholder="按姓名 / 邮箱 / 手机号搜索"
          @keyup.enter="search"
        />
      </div>
      <button class="btn btn-small" @click="search">搜索</button>
      <button class="btn btn-ghost btn-small" @click="reset">重置</button>
      <div v-if="selected.length" class="batch-bar">
        已选 <b class="num">{{ selected.length }}</b> 项
        <button class="btn btn-small" @click="askBatchStatus('active')">批量启用</button>
        <button class="btn btn-small" @click="askBatchStatus('disabled')">批量禁用</button>
        <button class="btn btn-danger btn-small" @click="askBatchDelete">批量删除</button>
      </div>
    </div>

    <div v-if="error" class="error-box">{{ error }}</div>
    <div v-else-if="loading" class="loading-bar">
      <span class="spinner" />
      正在加载用户数据...
    </div>
    <div v-else-if="users.length === 0" class="empty-state">暂无数据，点击「＋ 新增用户」添加</div>

    <div v-else class="table-wrap">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-check">
              <input type="checkbox" class="ck" :checked="allChecked" @change="toggleAll" />
            </th>
            <th>ID</th>
            <th>姓名</th>
            <th>邮箱</th>
            <th>部门</th>
            <th>角色</th>
            <th>状态</th>
            <th>创建时间</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td class="col-check">
              <input
                type="checkbox"
                class="ck"
                :checked="selected.includes(u.id)"
                @change="toggleOne(u.id)"
              />
            </td>
            <td class="cell-id num">#{{ u.id }}</td>
            <td>
              <span class="avatar" :class="`avatar-${u.role}`">{{ (u.name || '?').charAt(0) }}</span>
              <span class="name">{{ u.name }}</span>
            </td>
            <td class="cell-mail">{{ u.email }}</td>
            <td class="cell-dept">{{ u.department || '—' }}</td>
            <td>
              <span class="pill" :class="u.role === 'admin' ? 'pill-violet' : 'pill-info'">
                {{ format.roleText(u.role) }}
              </span>
            </td>
            <td>
              <span class="pill" :class="u.status === 'active' ? 'pill-success' : 'pill-danger'">
                {{ format.statusText(u.status) }}
              </span>
            </td>
            <td class="cell-time num">{{ format.dateTime(u.created_at) }}</td>
            <td class="col-actions">
              <button class="btn btn-ghost btn-small" @click="showDetail(u)">详情</button>
              <button class="btn btn-ghost btn-small" @click="router.push(`/users/${u.id}/edit`)">编辑</button>
              <button class="btn btn-ghost btn-small" @click="openReset(u)">重置密码</button>
              <button class="btn btn-danger btn-small" @click="askDelete(u.id, u.name)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination v-if="total > pageSize" :total="total" :page="page" :page-size="pageSize" @change="goPage" />

    <!-- 详情弹窗 -->
    <AppModal title="用户详情" :open="detailVisible" width="520" @close="detailVisible = false">
      <div v-if="detailUser" class="detail-grid">
        <div class="detail-item"><span>ID</span><b class="num">#{{ detailUser.id }}</b></div>
        <div class="detail-item"><span>姓名</span><b>{{ detailUser.name }}</b></div>
        <div class="detail-item"><span>邮箱</span><b>{{ detailUser.email }}</b></div>
        <div class="detail-item"><span>手机号</span><b>{{ detailUser.phone || '-' }}</b></div>
        <div class="detail-item"><span>部门</span><b>{{ detailUser.department || '-' }}</b></div>
        <div class="detail-item"><span>地区</span><b>{{ detailUser.region || '-' }}</b></div>
        <div class="detail-item"><span>性别</span><b>{{ genderText(detailUser.gender) }}</b></div>
        <div class="detail-item"><span>角色</span><b>{{ format.roleText(detailUser.role) }}</b></div>
        <div class="detail-item"><span>状态</span><b>{{ format.statusText(detailUser.status) }}</b></div>
        <div class="detail-item"><span>最后登录</span><b>{{ detailUser.last_login_at ? format.dateTime(detailUser.last_login_at) : '从未登录' }}</b></div>
        <div class="detail-item"><span>创建时间</span><b>{{ format.dateTime(detailUser.created_at) }}</b></div>
      </div>
      <template #footer>
        <button class="btn btn-primary" @click="detailVisible = false">关闭</button>
      </template>
    </AppModal>

    <!-- 批量状态确认 -->
    <ConfirmDialog
      :open="statusConfirm.open"
      :title="statusConfirm.status === 'active' ? '批量启用' : '批量禁用'"
      :message="`确定对选中的 ${selected.length} 个用户执行${statusConfirm.status === 'active' ? '启用' : '禁用'}操作吗？`"
      @confirm="statusConfirm.open = false; doBatchStatus()"
      @cancel="statusConfirm.open = false"
    />

    <!-- 导入弹窗 -->
    <AppModal title="批量导入用户" :open="importVisible" width="560" @close="importVisible = false">
      <p class="import-tip">
        每行一个用户，格式：<b>姓名,邮箱,手机号,密码,部门,地区</b>（姓名和邮箱必填，密码留空默认 User@12345）
      </p>
      <textarea v-model="importText" class="input import-textarea" placeholder="张三,zhangsan@example.com,13800000001,Zhang@123,技术部,北京&#10;李四,lisi@example.com,13800000002,,市场部,上海" />
      <div v-if="importResult" class="import-result">
        <p>导入完成：成功 <b class="num" style="color: var(--success)">{{ importResult.success }}</b> 条，失败 <b class="num" style="color: var(--danger)">{{ importResult.failures.length }}</b> 条</p>
        <ul v-if="importResult.failures.length" class="import-failures">
          <li v-for="(f, i) in importResult.failures" :key="i">{{ f }}</li>
        </ul>
      </div>
      <template #footer>
        <button class="btn" @click="importVisible = false">关闭</button>
        <button class="btn btn-primary" :disabled="importing" @click="doImport">
          {{ importing ? '导入中…' : '开始导入' }}
        </button>
      </template>
    </AppModal>

    <!-- 重置密码弹窗 -->
    <AppModal title="重置用户密码" :open="resetVisible" width="420" @close="resetVisible = false">
      <p class="import-tip">为用户 <b>{{ resetUser?.name }}</b>（{{ resetUser?.email }}）设置新密码：</p>
      <input v-model="resetPwd" type="password" class="input" placeholder="8 位以上，含大小写/数字/符号" @keyup.enter="doReset" />
      <template #footer>
        <button class="btn" @click="resetVisible = false">取消</button>
        <button class="btn btn-primary" :disabled="resetting" @click="doReset">
          {{ resetting ? '提交中…' : '确认重置' }}
        </button>
      </template>
    </AppModal>

    <!-- 删除确认 -->
    <ConfirmDialog
      :open="confirmVisible"
      title="删除确认"
      :message="`确定要删除「${confirmPayload.name}」吗？此操作不可恢复。`"
      danger
      @confirm="doConfirm"
      @cancel="confirmVisible = false"
    />
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
  background: var(--bg-active);
  border: 1px solid rgba(37, 99, 235, 0.25);
  color: var(--primary);
  font-size: 12px;
  border-radius: 999px;
  padding: 2px 11px;
  font-weight: 600;
}
.head-actions {
  display: flex;
  gap: 8px;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.search-box {
  position: relative;
  flex: 1;
  max-width: 340px;
}
.s-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 15px;
}
.s-input {
  padding-left: 36px;
}
.batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--primary);
  background: var(--gradient-soft);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: var(--radius-sm);
  padding: 5px 12px;
}
.batch-bar b {
  font-weight: 700;
}
.table-wrap {
  overflow-x: auto;
}
.cell-id {
  color: var(--text-muted);
}
.cell-mail {
  color: var(--text-secondary);
  max-width: 190px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cell-dept {
  color: var(--text-secondary);
}
.cell-time {
  font-size: 12.5px;
  color: var(--text-muted);
  white-space: nowrap;
}
.col-check {
  width: 38px;
  text-align: center;
}
.ck {
  accent-color: var(--primary);
  width: 15px;
  height: 15px;
  cursor: pointer;
}
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 700;
  margin-right: 9px;
  vertical-align: middle;
  color: #fff;
}
.avatar-admin {
  background: linear-gradient(135deg, var(--chart-violet), var(--chart-indigo));
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}
.avatar-user {
  background: var(--gradient-main);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}
.name {
  font-weight: 600;
  vertical-align: middle;
}
.col-actions {
  white-space: nowrap;
}
.col-actions .btn {
  margin-right: 5px;
}
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 13px;
}
.detail-item span {
  display: block;
  font-size: 11.5px;
  color: var(--text-muted);
  margin-bottom: 3px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.detail-item b {
  font-size: 14px;
  color: var(--text-primary);
  word-break: break-all;
  font-weight: 600;
}
.import-tip {
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-bottom: 10px;
  line-height: 1.6;
}
.import-tip b {
  color: var(--primary);
}
.import-textarea {
  font-family: var(--font-mono);
  font-size: 12.5px;
  min-height: 150px;
  margin-bottom: 12px;
}
.import-result {
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px;
  background: var(--bg-input);
  font-size: 13px;
}
.import-result p {
  margin: 0 0 6px;
}
.import-failures {
  list-style: none;
  max-height: 120px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.import-failures li {
  font-size: 12px;
  color: var(--danger);
}
</style>
