<script setup>
/**
 * 系统配置
 */
import { ref, onMounted } from 'vue'
import { getSettings, createSetting, updateSetting, deleteSetting } from '../api/setting'
import AppModal from '../components/AppModal.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useToast } from '../stores/toast'

const toast = useToast()

const settings = ref([])
const loading = ref(false)

const modalOpen = ref(false)
const editing = ref(null)
const form = ref({ configKey: '', configValue: '', description: '' })

const confirmOpen = ref(false)
const deletingId = ref(null)

async function load() {
  loading.value = true
  try {
    settings.value = (await getSettings())?.data || []
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { configKey: '', configValue: '', description: '' }
  modalOpen.value = true
}

function openEdit(s) {
  editing.value = s
  form.value = { configKey: s.config_key, configValue: s.config_value, description: s.description || '' }
  modalOpen.value = true
}

async function submit() {
  if (!form.value.configKey.trim()) {
    toast.error('请输入配置键')
    return
  }
  try {
    if (editing.value) {
      await updateSetting(editing.value.id, { configValue: form.value.configValue, description: form.value.description })
      toast.success('配置已更新')
    } else {
      await createSetting(form.value)
      toast.success('配置已创建')
    }
    modalOpen.value = false
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

function askDelete(s) {
  deletingId.value = s.id
  confirmOpen.value = true
}

async function doDelete() {
  try {
    await deleteSetting(deletingId.value)
    toast.success('配置已删除')
    load()
  } catch (e) {
    toast.error(e.message)
  }
}

function groupOf(key) {
  if (key.startsWith('site.')) return '站点'
  if (key.startsWith('security.')) return '安全'
  if (key.startsWith('email.')) return '邮件'
  if (key.startsWith('upload.')) return '上传'
  return '其他'
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head">
      <h2>系统配置</h2>
      <span class="sub">键值对配置中心 · 支持分组视图</span>
      <div class="actions">
        <button class="btn btn-primary" @click="openCreate">＋ 新建配置</button>
      </div>
    </div>

    <section class="glass-card">
      <div v-if="loading" class="loading-bar"><span class="spinner" />加载中…</div>
      <div v-else-if="!settings.length" class="empty-state">暂无配置项</div>
      <div v-else class="config-groups">
        <div v-for="group in ['站点', '安全', '邮件', '上传', '其他']" :key="group">
          <div v-if="settings.filter((s) => groupOf(s.config_key) === group).length" class="config-group">
            <div class="config-group-title">{{ group }}</div>
            <div class="config-items">
              <div v-for="s in settings.filter((x) => groupOf(x.config_key) === group)" :key="s.id" class="config-item">
                <div class="config-main">
                  <div class="config-key num">{{ s.config_key }}</div>
                  <div class="config-value">{{ s.config_value }}</div>
                  <div v-if="s.description" class="config-desc">{{ s.description }}</div>
                </div>
                <div class="config-actions">
                  <button class="btn btn-ghost btn-small" @click="openEdit(s)">编辑</button>
                  <button class="btn btn-danger btn-small" @click="askDelete(s)">删</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <AppModal :open="modalOpen" :title="editing ? '编辑配置' : '新建配置'" @close="modalOpen = false">
      <div class="form-col">
        <label class="field">
          <span class="field-label">配置键 *</span>
          <input v-model="form.configKey" class="input" placeholder="如 site.title" :disabled="!!editing" />
        </label>
        <label class="field">
          <span class="field-label">配置值</span>
          <textarea v-model="form.configValue" class="input" rows="3" placeholder="配置值" />
        </label>
        <label class="field">
          <span class="field-label">描述</span>
          <input v-model="form.description" class="input" placeholder="用途说明" />
        </label>
      </div>
      <div class="modal-actions">
        <button class="btn" @click="modalOpen = false">取消</button>
        <button class="btn btn-primary" @click="submit">保存</button>
      </div>
    </AppModal>

    <ConfirmDialog
      :open="confirmOpen"
      title="删除配置"
      message="确定删除该配置项吗？"
      @cancel="confirmOpen = false"
      @confirm="doDelete(); confirmOpen = false"
    />
  </div>
</template>

<style scoped>
.config-groups {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.config-group-title {
  font-weight: 700;
  font-size: 13.5px;
  color: var(--primary);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.config-group-title::before {
  content: '';
  width: 4px;
  height: 16px;
  border-radius: 999px;
  background: var(--gradient-main);
}
.config-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}
.config-item {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: var(--bg-panel);
  transition: all 0.16s;
}
.config-item:hover {
  box-shadow: var(--shadow-lift);
  border-color: var(--border-subtle);
}
.config-main {
  flex: 1;
  min-width: 0;
}
.config-key {
  font-size: 12.5px;
  color: var(--primary);
  font-weight: 700;
}
.config-value {
  font-size: 13px;
  margin-top: 4px;
  word-break: break-all;
}
.config-desc {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 4px;
}
.config-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
