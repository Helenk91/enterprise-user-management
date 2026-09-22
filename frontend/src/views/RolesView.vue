<script setup>
/**
 * 角色权限管理（RBAC）
 */
import { ref, onMounted } from 'vue'
import { getRoles, createRole, updateRole, deleteRole, getPermissions, getRolePerms, assignPerms } from '../api/role'
import AppModal from '../components/AppModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useToast } from '../stores/toast'

const toast = useToast()

const roles = ref([])
const permissions = ref({})
const loading = ref(false)

const roleModal = ref(false)
const editingRole = ref(null)
const roleForm = ref({ roleCode: '', roleName: '', description: '' })

const permModal = ref(false)
const activeRole = ref(null)
const checkedIds = ref([])

const confirmOpen = ref(false)
const deletingId = ref(null)

async function load() {
  loading.value = true
  try {
    const [r, p] = await Promise.all([getRoles(), getPermissions()])
    roles.value = r?.data || []
    permissions.value = p?.data || {}
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

function openRoleCreate() {
  editingRole.value = null
  roleForm.value = { roleCode: '', roleName: '', description: '' }
  roleModal.value = true
}

function openRoleEdit(role) {
  editingRole.value = role
  roleForm.value = { roleCode: role.role_code, roleName: role.role_name, description: role.description || '' }
  roleModal.value = true
}

async function submitRole() {
  if (!roleForm.value.roleCode.trim() || !roleForm.value.roleName.trim()) {
    toast.error('编码与名称必填')
    return
  }
  try {
    if (editingRole.value) {
      await updateRole(editingRole.value.id, roleForm.value)
      toast.success('角色已更新')
    } else {
      await createRole(roleForm.value)
      toast.success('角色已创建')
    }
    roleModal.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

async function openPerm(role) {
  activeRole.value = role
  try {
    const data = await getRolePerms(role.id)
    checkedIds.value = data.permIds || []
    permModal.value = true
  } catch (e) {
    toast.error(e.message)
  }
}

function togglePerm(permId) {
  const idx = checkedIds.value.indexOf(permId)
  if (idx >= 0) checkedIds.value.splice(idx, 1)
  else checkedIds.value.push(permId)
}

async function submitPerms() {
  try {
    await assignPerms(activeRole.value.id, checkedIds.value)
    toast.success(`已保存 ${checkedIds.value.length} 项权限`)
    permModal.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

function askDelete(role) {
  deletingId.value = role.id
  confirmOpen.value = true
}

async function doDelete() {
  try {
    await deleteRole(deletingId.value)
    toast.success('角色已删除')
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

function permCount(role) {
  return role.perm_count || 0
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head">
      <h2>角色权限</h2>
      <span class="sub">RBAC 权限模型 · 角色-权限-用户三级关联</span>
      <div class="actions">
        <button class="btn btn-primary" @click="openRoleCreate">＋ 新建角色</button>
      </div>
    </div>

    <div class="role-layout">
      <!-- 角色卡片 -->
      <div class="role-grid">
        <div v-for="r in roles" :key="r.id" class="role-card glass-card hoverable">
          <div class="role-top">
            <span class="role-icon">⚿</span>
            <div class="role-head">
              <div class="role-name">{{ r.role_name }}</div>
              <div class="role-code num">{{ r.role_code }}</div>
            </div>
            <span v-if="r.status === 'active'" class="pill pill-success">启用</span>
            <span v-else class="pill pill-warning">停用</span>
          </div>
          <div class="role-desc">{{ r.description || '暂无描述' }}</div>
          <div class="role-perm-count">
            已分配权限 <b class="num">{{ permCount(r) }}</b> 项
          </div>
          <div class="role-actions">
            <button class="btn btn-primary btn-small" @click="openPerm(r)">分配权限</button>
            <button class="btn btn-ghost btn-small" @click="openRoleEdit(r)">编辑</button>
            <button class="btn btn-danger btn-small" @click="askDelete(r)">删除</button>
          </div>
        </div>
        <div v-if="!roles.length && !loading" class="empty-state">暂无角色</div>
      </div>

      <!-- 权限全景 -->
      <section class="glass-card perm-panel">
        <div class="card-head">
          <div class="card-title">权限点清单</div>
          <span class="text-muted text-sm">按模块分组 · 共 {{ Object.values(permissions).flat().length }} 项</span>
        </div>
        <div class="perm-groups">
          <div v-for="(perms, module) in permissions" :key="module" class="perm-group">
            <div class="perm-module">{{ module }}</div>
            <div class="perm-items">
              <span v-for="p in perms" :key="p.id" class="perm-item">
                <span class="perm-code num">{{ p.perm_code }}</span>
                <span class="perm-name">{{ p.perm_name }}</span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 角色弹窗 -->
    <AppModal :open="roleModal" :title="editingRole ? '编辑角色' : '新建角色'" @close="roleModal = false">
      <div class="form-col">
        <label class="field">
          <span class="field-label">角色编码 *</span>
          <input v-model="roleForm.roleCode" class="input" placeholder="如 operator" :disabled="!!editingRole" />
        </label>
        <label class="field">
          <span class="field-label">角色名称 *</span>
          <input v-model="roleForm.roleName" class="input" placeholder="如 运营专员" />
        </label>
        <label class="field">
          <span class="field-label">描述</span>
          <textarea v-model="roleForm.description" class="input" rows="3" placeholder="角色职责说明" />
        </label>
      </div>
      <div class="modal-actions">
        <button class="btn" @click="roleModal = false">取消</button>
        <button class="btn btn-primary" @click="submitRole">保存</button>
      </div>
    </AppModal>

    <!-- 分配权限弹窗 -->
    <AppModal
      :open="permModal"
      :title="`分配权限 — ${activeRole?.role_name || ''}`"
      @close="permModal = false"
      wide
    >
      <div class="perm-check-groups">
        <div v-for="(perms, module) in permissions" :key="module" class="perm-check-group">
          <div class="perm-check-module">{{ module }}</div>
          <div class="perm-check-items">
            <label v-for="p in perms" :key="p.id" class="perm-check">
              <input
                type="checkbox"
                :checked="checkedIds.includes(p.id)"
                @change="togglePerm(p.id)"
              />
              <span class="perm-code num">{{ p.perm_code }}</span>
              <span class="perm-name">{{ p.perm_name }}</span>
            </label>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn" @click="permModal = false">取消</button>
        <button class="btn btn-primary" @click="submitPerms">保存权限 ({{ checkedIds.length }})</button>
      </div>
    </AppModal>

    <ConfirmDialog
      :open="confirmOpen"
      title="删除角色"
      message="删除角色将解除其权限关联，确定继续吗？"
      @cancel="confirmOpen = false"
      @confirm="doDelete(); confirmOpen = false"
    />
  </div>
</template>

<style scoped>
.role-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}
.role-card {
  padding: 18px;
}
.role-top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.role-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--gradient-soft);
  border: 1px solid rgba(37, 99, 235, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--primary);
}
.role-head {
  flex: 1;
}
.role-name {
  font-weight: 700;
  font-size: 15px;
}
.role-code {
  font-size: 11.5px;
  color: var(--text-muted);
}
.role-desc {
  font-size: 12.5px;
  color: var(--text-secondary);
  margin: 12px 0 8px;
  min-height: 36px;
}
.role-perm-count {
  font-size: 12.5px;
  color: var(--text-muted);
  margin-bottom: 14px;
}
.role-perm-count b {
  color: var(--primary);
  font-size: 16px;
}
.role-actions {
  display: flex;
  gap: 8px;
}
.perm-panel {
  padding-bottom: 8px;
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
.perm-groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
  padding: 16px 18px;
}
.perm-group {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px;
  background: var(--bg-input);
}
.perm-module {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 10px;
  color: var(--primary);
}
.perm-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.perm-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-panel);
  border-radius: 999px;
  padding: 3px 12px;
  font-size: 12px;
}
.perm-code {
  color: var(--primary);
  font-weight: 600;
}
.perm-name {
  color: var(--text-secondary);
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
.perm-check-groups {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  max-height: 440px;
  overflow-y: auto;
}
.perm-check-group {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px;
}
.perm-check-module {
  font-weight: 700;
  font-size: 13px;
  color: var(--primary);
  margin-bottom: 10px;
}
.perm-check-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.perm-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  cursor: pointer;
}
.perm-check input {
  accent-color: var(--primary);
  width: 15px;
  height: 15px;
}
</style>
