<script setup>
/**
 * 菜单管理
 */
import { ref, onMounted } from 'vue'
import { getMenus, createMenu, updateMenu, deleteMenu } from '../api/menu'
import AppModal from '../components/AppModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useToast } from '../stores/toast'

const toast = useToast()

const menus = ref([])
const loading = ref(false)

const modalOpen = ref(false)
const editing = ref(null)
const form = ref({ name: '', path: '', icon: '', parentId: 0, sort: 0, visible: true })

const confirmOpen = ref(false)
const deletingId = ref(null)

const parentOptions = ref([])

async function load() {
  loading.value = true
  try {
    menus.value = (await getMenus())?.data || []
    parentOptions.value = [{ id: 0, name: '（顶级菜单）' }, ...menus.value.map((m) => ({ id: m.id, name: m.name }))]
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { name: '', path: '', icon: '', parentId: 0, sort: 0, visible: true }
  modalOpen.value = true
}

function openEdit(m) {
  editing.value = m
  form.value = {
    name: m.name,
    path: m.path || '',
    icon: m.icon || '',
    parentId: m.parent_id || 0,
    sort: m.sort || 0,
    visible: !!m.visible,
  }
  modalOpen.value = true
}

async function submit() {
  if (!form.value.name.trim()) {
    toast.error('请输入菜单名称')
    return
  }
  try {
    if (editing.value) {
      await updateMenu(editing.value.id, form.value)
      toast.success('菜单已更新')
    } else {
      await createMenu(form.value)
      toast.success('菜单已创建')
    }
    modalOpen.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

function askDelete(m) {
  deletingId.value = m.id
  confirmOpen.value = true
}

async function doDelete() {
  try {
    await deleteMenu(deletingId.value)
    toast.success('菜单已删除')
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

function parentName(id) {
  return id ? (menus.value.find((m) => m.id === id)?.name || `#${id}`) : '—'
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head">
      <h2>菜单管理</h2>
      <span class="sub">侧边栏菜单与路由配置 · 支持二级层级</span>
      <div class="actions">
        <button class="btn btn-primary" @click="openCreate">＋ 新建菜单</button>
      </div>
    </div>

    <section class="glass-card">
      <div v-if="loading" class="loading-bar"><span class="spinner" />加载中…</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>图标</th>
              <th>菜单名称</th>
              <th>路径</th>
              <th>父级</th>
              <th>排序</th>
              <th>可见</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in menus" :key="m.id">
              <td class="num text-muted">#{{ m.id }}</td>
              <td class="menu-icon">{{ m.icon || '·' }}</td>
              <td class="menu-name">{{ m.name }}</td>
              <td><code class="menu-path num">{{ m.path || '—' }}</code></td>
              <td class="text-muted">{{ parentName(m.parent_id) }}</td>
              <td class="num">{{ m.sort }}</td>
              <td>
                <span v-if="m.visible" class="pill pill-success">显示</span>
                <span v-else class="pill pill-warning">隐藏</span>
              </td>
              <td>
                <button class="btn btn-ghost btn-small" @click="openEdit(m)">编辑</button>
                <button class="btn btn-danger btn-small" @click="askDelete(m)">删</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!menus.length" class="empty-state">暂无菜单</div>
      </div>
    </section>

    <AppModal :open="modalOpen" :title="editing ? '编辑菜单' : '新建菜单'" @close="modalOpen = false">
      <div class="form-grid">
        <label class="field">
          <span class="field-label">菜单名称 *</span>
          <input v-model="form.name" class="input" placeholder="如 数据分析" />
        </label>
        <label class="field">
          <span class="field-label">路由路径</span>
          <input v-model="form.path" class="input" placeholder="如 /analytics" />
        </label>
        <label class="field">
          <span class="field-label">图标</span>
          <input v-model="form.icon" class="input" placeholder="emoji 或符号" />
        </label>
        <label class="field">
          <span class="field-label">父级菜单</span>
          <select v-model.number="form.parentId" class="input">
            <option v-for="p in parentOptions" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">排序</span>
          <input v-model.number="form.sort" type="number" class="input" />
        </label>
        <label class="field checkbox-field">
          <span class="field-label">可见性</span>
          <label class="switch-row">
            <input v-model="form.visible" type="checkbox" class="switch" />
            <span>{{ form.visible ? '在导航显示' : '隐藏' }}</span>
          </label>
        </label>
      </div>
      <div class="modal-actions">
        <button class="btn" @click="modalOpen = false">取消</button>
        <button class="btn btn-primary" @click="submit">保存</button>
      </div>
    </AppModal>

    <ConfirmDialog
      :open="confirmOpen"
      title="删除菜单"
      message="删除菜单将使其子菜单提升为顶级菜单。"
      @cancel="confirmOpen = false"
      @confirm="doDelete(); confirmOpen = false"
    />
  </div>
</template>

<style scoped>
.table-wrap {
  padding: 0 18px 18px;
  overflow-x: auto;
}
.menu-icon {
  font-size: 17px;
}
.menu-name {
  font-weight: 600;
}
.menu-path {
  background: #f1f4fa;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--primary);
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
.field-label {
  font-size: 12.5px;
  color: var(--text-secondary);
  font-weight: 600;
}
.switch-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}
.switch {
  accent-color: var(--primary);
  width: 16px;
  height: 16px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}
</style>
