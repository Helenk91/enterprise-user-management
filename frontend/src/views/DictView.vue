<script setup>
/**
 * 数据字典管理
 */
import { ref, onMounted } from 'vue'
import { getDictTypes, createDictType, updateDictType, deleteDictType, getDictItems, createDictItem, updateDictItem, deleteDictItem } from '../api/dict'
import AppModal from '../components/AppModal.vue'
import AppPagination from '../components/AppPagination.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useToast } from '../stores/toast'

const toast = useToast()

const types = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(8)
const keyword = ref('')
const loading = ref(false)

const activeType = ref(null)
const items = ref([])
const itemsLoading = ref(false)

const typeModal = ref(false)
const typeForm = ref({ typeCode: '', typeName: '', remark: '' })
const editingType = ref(null)

const itemModal = ref(false)
const itemForm = ref({ label: '', value: '', sort: 0, status: 'active' })
const editingItem = ref(null)

const confirmOpen = ref(false)
const deleteTarget = ref(null)

async function loadTypes() {
  loading.value = true
  try {
    const data = await getDictTypes({ page: page.value, pageSize: pageSize.value, keyword: keyword.value.trim() })
    types.value = data?.data || []
    total.value = data?.data?.length || 0
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

async function selectType(t) {
  activeType.value = t
  itemsLoading.value = true
  try {
    items.value = (await getDictItems(t.type_code))?.data || []
  } catch (e) {
    toast.error(e.message)
  } finally {
    itemsLoading.value = false
  }
}

function openTypeCreate() {
  editingType.value = null
  typeForm.value = { typeCode: '', typeName: '', remark: '' }
  typeModal.value = true
}

function openTypeEdit(t) {
  editingType.value = t
  typeForm.value = { typeCode: t.type_code, typeName: t.type_name, remark: t.remark || '' }
  typeModal.value = true
}

async function submitType() {
  if (!typeForm.value.typeCode.trim() || !typeForm.value.typeName.trim()) {
    toast.error('编码与名称必填')
    return
  }
  try {
    if (editingType.value) {
      await updateDictType(editingType.value.id, typeForm.value)
      toast.success('字典类型已更新')
    } else {
      await createDictType(typeForm.value)
      toast.success('字典类型已创建')
    }
    typeModal.value = false
    loadTypes()
  } catch (e) {
    toast.error(e.message)
  }
}

function openItemCreate() {
  if (!activeType.value) {
    toast.error('请先选择左侧字典类型')
    return
  }
  editingItem.value = null
  itemForm.value = { label: '', value: '', sort: 0, status: 'active' }
  itemModal.value = true
}

function openItemEdit(item) {
  editingItem.value = item
  itemForm.value = { label: item.label, value: item.value, sort: item.sort, status: item.status }
  itemModal.value = true
}

async function submitItem() {
  if (!itemForm.value.label.trim() || !itemForm.value.value.trim()) {
    toast.error('标签与值必填')
    return
  }
  try {
    if (editingItem.value) {
      await updateDictItem(editingItem.value.id, itemForm.value)
      toast.success('字典项已更新')
    } else {
      await createDictItem({ ...itemForm.value, typeCode: activeType.value.type_code })
      toast.success('字典项已创建')
    }
    itemModal.value = false
    selectType(activeType.value)
  } catch (e) {
    toast.error(e.message)
  }
}

function askDelete(type, target) {
  deleteTarget.value = { type, target }
  confirmOpen.value = true
}

async function doDelete() {
  try {
    if (deleteTarget.value.type === 'type') {
      await deleteDictType(deleteTarget.value.target.id)
      toast.success('字典类型已删除')
      if (activeType.value?.id === deleteTarget.value.target.id) activeType.value = null
      loadTypes()
    } else {
      await deleteDictItem(deleteTarget.value.target.id)
      toast.success('字典项已删除')
      selectType(activeType.value)
    }
  } catch (e) {
    toast.error(e.message)
  }
}

onMounted(loadTypes)
</script>

<template>
  <div>
    <div class="page-head">
      <h2>数据字典</h2>
      <span class="sub">系统枚举与选项配置 · 前后端共用数据源</span>
      <div class="actions">
        <button class="btn btn-primary" @click="openTypeCreate">＋ 新建类型</button>
      </div>
    </div>

    <div class="dict-layout">
      <!-- 左侧类型列表 -->
      <section class="glass-card left-panel">
        <div class="panel-tools">
          <input v-model="keyword" class="input input-sm" placeholder="搜索类型…" @keyup.enter="page = 1; loadTypes()" />
        </div>
        <div v-if="loading" class="loading-bar"><span class="spinner" /></div>
        <div v-else class="type-list">
          <div
            v-for="t in types"
            :key="t.id"
            class="type-item"
            :class="{ active: activeType?.id === t.id }"
            @click="selectType(t)"
          >
            <div class="type-name">{{ t.type_name }}</div>
            <div class="type-code num">{{ t.type_code }}</div>
            <div class="type-actions">
              <button class="btn btn-ghost btn-small" @click.stop="openTypeEdit(t)">编辑</button>
              <button class="btn btn-danger btn-small" @click.stop="askDelete('type', t)">删</button>
            </div>
          </div>
          <div v-if="!types.length" class="empty-state">暂无字典类型</div>
        </div>
        <AppPagination
          v-if="total > pageSize"
          :page="page"
          :total="total"
          :page-size="pageSize"
          @change="(p) => { page = p; loadTypes() }"
        />
      </section>

      <!-- 右侧字典项 -->
      <section class="glass-card right-panel">
        <div class="card-head">
          <div class="card-title">
            {{ activeType ? `${activeType.type_name}（${activeType.type_code}）` : '字典项' }}
          </div>
          <button class="btn btn-small btn-primary" @click="openItemCreate">＋ 新增字典项</button>
        </div>

        <div v-if="!activeType" class="empty-state">
          <div class="big">▤</div>请选择左侧字典类型查看字典项
        </div>
        <div v-else-if="itemsLoading" class="loading-bar"><span class="spinner" />加载中…</div>
        <div v-else-if="!items.length" class="empty-state">该类型下暂无字典项</div>
        <div v-else class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>标签</th>
                <th>值</th>
                <th>排序</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id">
                <td>{{ item.label }}</td>
                <td class="num">{{ item.value }}</td>
                <td class="num">{{ item.sort }}</td>
                <td>
                  <span v-if="item.status === 'active'" class="pill pill-success">启用</span>
                  <span v-else class="pill pill-warning">停用</span>
                </td>
                <td>
                  <button class="btn btn-ghost btn-small" @click="openItemEdit(item)">编辑</button>
                  <button class="btn btn-danger btn-small" @click="askDelete('item', item)">删</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- 类型弹窗 -->
    <AppModal :open="typeModal" :title="editingType ? '编辑字典类型' : '新建字典类型'" @close="typeModal = false">
      <div class="form-col">
        <label class="field">
          <span class="field-label">类型编码 *</span>
          <input v-model="typeForm.typeCode" class="input" placeholder="如 gender / status" :disabled="!!editingType" />
        </label>
        <label class="field">
          <span class="field-label">类型名称 *</span>
          <input v-model="typeForm.typeName" class="input" placeholder="如 性别" />
        </label>
        <label class="field">
          <span class="field-label">备注</span>
          <input v-model="typeForm.remark" class="input" placeholder="用途说明" />
        </label>
      </div>
      <div class="modal-actions">
        <button class="btn" @click="typeModal = false">取消</button>
        <button class="btn btn-primary" @click="submitType">保存</button>
      </div>
    </AppModal>

    <!-- 字典项弹窗 -->
    <AppModal :open="itemModal" :title="editingItem ? '编辑字典项' : '新增字典项'" @close="itemModal = false">
      <div class="form-grid">
        <label class="field">
          <span class="field-label">标签 *</span>
          <input v-model="itemForm.label" class="input" placeholder="显示名" />
        </label>
        <label class="field">
          <span class="field-label">值 *</span>
          <input v-model="itemForm.value" class="input" placeholder="存储值" />
        </label>
        <label class="field">
          <span class="field-label">排序</span>
          <input v-model.number="itemForm.sort" type="number" class="input" />
        </label>
        <label class="field">
          <span class="field-label">状态</span>
          <select v-model="itemForm.status" class="input">
            <option value="active">启用</option>
            <option value="disabled">停用</option>
          </select>
        </label>
      </div>
      <div class="modal-actions">
        <button class="btn" @click="itemModal = false">取消</button>
        <button class="btn btn-primary" @click="submitItem">保存</button>
      </div>
    </AppModal>

    <ConfirmDialog
      :open="confirmOpen"
      :title="deleteTarget?.type === 'type' ? '删除字典类型' : '删除字典项'"
      message="删除字典类型将同时删除其下所有字典项。"
      @cancel="confirmOpen = false"
      @confirm="doDelete(); confirmOpen = false"
    />
  </div>
</template>

<style scoped>
.dict-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  align-items: start;
}
.left-panel {
  padding: 16px;
}
.panel-tools {
  margin-bottom: 12px;
}
.input-sm {
  padding: 7px 12px;
  font-size: 13px;
}
.type-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 560px;
  overflow-y: auto;
}
.type-item {
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.15s;
  background: var(--bg-panel);
}
.type-item:hover {
  border-color: #b9cae8;
}
.type-item.active {
  border-color: rgba(37, 99, 235, 0.45);
  background: var(--gradient-soft);
}
.type-name {
  font-weight: 700;
  font-size: 14px;
}
.type-code {
  font-size: 11.5px;
  color: var(--text-muted);
  margin: 2px 0 8px;
}
.type-actions {
  display: flex;
  gap: 6px;
}
.right-panel {
  min-height: 400px;
}
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
.table-wrap {
  padding: 0 18px 18px;
  overflow-x: auto;
}
.form-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}
@media (max-width: 900px) {
  .dict-layout {
    grid-template-columns: 1fr;
  }
}
</style>
