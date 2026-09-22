<script setup>
/**
 * 文件管理
 */
import { ref, computed, onMounted } from 'vue'
import { getFileTree, getFiles, getFileStats, createFolder, deleteFolder, deleteFile, recordDownload } from '../api/file'
import AppModal from '../components/AppModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useToast } from '../stores/toast'

const toast = useToast()

const folders = ref([])
const files = ref([])
const stats = ref({ types: [], totalBytes: 0, totalFiles: 0, totalFolders: 0 })
const loading = ref(false)
const currentFolder = ref(0)
const keyword = ref('')

const modalOpen = ref(false)
const folderName = ref('')
const confirmOpen = ref(false)
const deleteTarget = ref(null) // { type: 'file'|'folder', id }

function typeMeta(name) {
  const ext = (name.split('.').pop() || '').toLowerCase()
  const map = {
    doc: ['doc', 'docx'], pdf: ['pdf'], xls: ['xls', 'xlsx'], ppt: ['ppt', 'pptx'],
    img: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'], zip: ['zip', 'rar', '7z'],
    code: ['js', 'vue', 'ts', 'py', 'java', 'go', 'sql', 'html', 'css', 'json'],
  }
  for (const [type, exts] of Object.entries(map)) {
    if (exts.includes(ext)) return type
  }
  return 'other'
}
function typeIcon(file) {
  const icons = { doc: '📄', pdf: '📕', xls: '📊', ppt: '📽', img: '🖼', zip: '📦', code: '⌨', other: '📁' }
  return icons[typeMeta(file.name)] || '📁'
}
function formatBytes(b) {
  if (!b) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = Number(b)
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`
}

async function load() {
  loading.value = true
  try {
    const [tree, list, st] = await Promise.all([
      getFileTree(),
      getFiles({ folderId: currentFolder.value || undefined, keyword: keyword.value.trim() }),
      getFileStats(),
    ])
    folders.value = tree?.data || []
    files.value = list?.data || []
    stats.value = st?.data || { types: [], totalBytes: 0, totalFiles: 0, totalFolders: 0 }
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

function openFolder(folderId) {
  currentFolder.value = folderId
  load()
}

function backToRoot() {
  currentFolder.value = 0
  load()
}

async function submitFolder() {
  if (!folderName.value.trim()) {
    toast.error('请输入文件夹名称')
    return
  }
  try {
    await createFolder({ name: folderName.value.trim(), parentId: currentFolder.value || 0 })
    toast.success('文件夹已创建')
    modalOpen.value = false
    folderName.value = ''
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

function askDelete(type, id) {
  deleteTarget.value = { type, id }
  confirmOpen.value = true
}

async function doDelete() {
  try {
    if (deleteTarget.value.type === 'file') {
      await deleteFile(deleteTarget.value.id)
      toast.success('文件已删除')
    } else {
      await deleteFolder(deleteTarget.value.id)
      toast.success('文件夹已删除')
    }
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

async function doDownload(file) {
  try {
    await recordDownload(file.id)
    toast.success('下载已记录')
  } catch (e) {
    toast.error(e.message)
  }
}

function currentFolderName() {
  if (!currentFolder.value) return '全部文件'
  const f = folders.value.find((x) => x.id === currentFolder.value)
  return f ? f.name : '全部文件'
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head">
      <h2>文件管理</h2>
      <span class="sub">资料库 · 文件夹树 + 文件台账</span>
      <div class="actions">
        <button class="btn" @click="modalOpen = true">＋ 新建文件夹</button>
      </div>
    </div>

    <!-- 统计卡 -->
    <div class="stats-row mb-16">
      <div class="stat-card glass-card hoverable">
        <div class="stat-value num">{{ stats.totalFiles }}</div>
        <div class="stat-label">文件总数</div>
      </div>
      <div class="stat-card glass-card hoverable">
        <div class="stat-value num">{{ stats.totalFolders }}</div>
        <div class="stat-label">文件夹</div>
      </div>
      <div class="stat-card glass-card hoverable">
        <div class="stat-value num">{{ formatBytes(stats.totalBytes) }}</div>
        <div class="stat-label">占用空间</div>
      </div>
      <div class="stat-card glass-card hoverable">
        <div class="stat-value num">{{ stats.types.length }}</div>
        <div class="stat-label">文件类型</div>
      </div>
    </div>

    <section class="glass-card">
      <div class="card-toolbar">
        <div class="breadcrumb">
          <button class="crumb-btn" @click="backToRoot">📁 根目录</button>
          <span v-if="currentFolder" class="crumb-sep">/</span>
          <span v-if="currentFolder" class="crumb-cur">{{ currentFolderName() }}</span>
        </div>
        <div class="toolbar-right">
          <input v-model="keyword" class="input input-sm" placeholder="搜索文件名…" @keyup.enter="load()" />
          <button class="btn btn-primary btn-small" @click="load()">搜索</button>
        </div>
      </div>

      <!-- 文件夹区 -->
      <div v-if="folders.length" class="folder-area">
        <div v-for="f in folders.filter((x) => x.parent_id === currentFolder)" :key="f.id" class="folder-item" @dblclick="openFolder(f.id)">
          <span class="folder-icon">📁</span>
          <span class="folder-name">{{ f.name }}</span>
          <span class="folder-child-count num">{{ f.child_count || 0 }} 个子项</span>
          <button class="btn btn-danger btn-small" @click.stop="askDelete('folder', f.id)">删</button>
        </div>
      </div>

      <div v-if="loading" class="loading-bar"><span class="spinner" />加载中…</div>
      <div v-else-if="!files.length && !folders.filter((x) => x.parent_id === currentFolder).length" class="empty-state">
        <div class="big">📁</div>此目录为空
      </div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>类型</th>
              <th>大小</th>
              <th>下载次数</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in files" :key="file.id">
              <td>
                <span class="file-name">{{ typeIcon(file) }} {{ file.name }}</span>
              </td>
              <td><span class="pill pill-info">{{ file.type }}</span></td>
              <td class="num">{{ formatBytes(file.size) }}</td>
              <td class="num">{{ file.download_count || 0 }}</td>
              <td class="num text-sm">{{ file.created_at?.slice(0, 10) }}</td>
              <td>
                <button class="btn btn-ghost btn-small" @click="doDownload(file)">记录下载</button>
                <button class="btn btn-danger btn-small" @click="askDelete('file', file.id)">删</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 新建文件夹 -->
    <AppModal :open="modalOpen" title="新建文件夹" @close="modalOpen = false">
      <label class="field">
        <span class="field-label">文件夹名称 *</span>
        <input v-model="folderName" class="input" placeholder="输入名称" @keyup.enter="submitFolder" />
      </label>
      <div class="modal-actions">
        <button class="btn" @click="modalOpen = false">取消</button>
        <button class="btn btn-primary" @click="submitFolder">创建</button>
      </div>
    </AppModal>

    <ConfirmDialog
      :open="confirmOpen"
      :title="deleteTarget?.type === 'folder' ? '删除文件夹' : '删除文件'"
      message="确定删除吗？文件夹会连同内部文件一起删除。"
      @cancel="confirmOpen = false"
      @confirm="doDelete(); confirmOpen = false"
    />
  </div>
</template>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.stat-card {
  padding: 18px 20px;
}
.stat-value {
  font-size: 26px;
  font-weight: 800;
  background: var(--gradient-main);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.stat-label {
  font-size: 12.5px;
  color: var(--text-muted);
  margin-top: 4px;
}
.card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-subtle);
  flex-wrap: wrap;
  gap: 10px;
}
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}
.crumb-btn {
  border: none;
  background: var(--bg-hover);
  color: var(--primary);
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
}
.crumb-sep {
  color: var(--text-muted);
}
.crumb-cur {
  font-weight: 600;
  font-size: 13.5px;
}
.toolbar-right {
  display: flex;
  gap: 8px;
}
.input-sm {
  width: 180px;
  padding: 7px 12px;
  font-size: 13px;
}
.folder-area {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-subtle);
}
.folder-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.16s;
  background: var(--bg-panel);
}
.folder-item:hover {
  border-color: #b9cae8;
  box-shadow: var(--shadow-lift);
}
.folder-icon {
  font-size: 22px;
}
.folder-name {
  font-weight: 600;
  font-size: 13.5px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.folder-child-count {
  font-size: 11px;
  color: var(--text-muted);
}
.table-wrap {
  padding: 0 18px 18px;
  overflow-x: auto;
}
.file-name {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-weight: 500;
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
@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
