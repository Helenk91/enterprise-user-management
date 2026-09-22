<script setup>
/**
 * 数据导出中心
 * 一键导出各模块数据为 CSV / JSON（浏览器端生成）
 */
import { ref, onMounted } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import { exportToCsv, exportToJson, timestampName } from '../utils/export'
import { getUsers } from '../api/user'
import { getLogs } from '../api/log'
import { getTasks } from '../api/task'
import { getNotices } from '../api/notice'
import { useToast } from '../stores/toast'

const toast = useToast()

const states = ref({
  users: { loading: false, done: false, count: 0, time: '' },
  logs: { loading: false, done: false, count: 0, time: '' },
  tasks: { loading: false, done: false, count: 0, time: '' },
  notices: { loading: false, done: false, count: 0, time: '' },
})

const modules = [
  {
    key: 'users',
    name: '用户数据',
    icon: '▤',
    desc: '导出全部用户：姓名、邮箱、手机、角色、部门、地区、状态、注册时间',
    color: '#2563eb',
    handler: async () => {
      const res = await getUsers({ page: 1, pageSize: 1000 })
      const rows = res.data.list
      return exportToCsv(
        rows,
        {
          name: '姓名',
          email: '邮箱',
          phone: '手机号',
          role: '角色',
          department: '部门',
          region: '地区',
          status: '状态',
          created_at: '注册时间',
        },
        timestampName('用户数据')
      )
    },
  },
  {
    key: 'logs',
    name: '操作日志',
    icon: '≡',
    desc: '导出审计日志：操作类型、详情、操作人、IP、时间',
    color: '#7c3aed',
    handler: async () => {
      const res = await getLogs({ page: 1, pageSize: 1000 })
      const rows = res.data.list
      return exportToCsv(
        rows,
        {
          id: 'ID',
          action: '操作类型',
          detail: '详情',
          user_name: '操作人',
          ip: 'IP',
          created_at: '时间',
        },
        timestampName('操作日志')
      )
    },
  },
  {
    key: 'tasks',
    name: '任务数据',
    icon: '☑',
    desc: '导出任务清单：标题、优先级、状态、截止日期、描述',
    color: '#0fa968',
    handler: async () => {
      const res = await getTasks({ page: 1, pageSize: 1000 })
      const rows = res.data.list
      return exportToCsv(
        rows,
        {
          title: '标题',
          priority: '优先级',
          status: '状态',
          due_date: '截止日期',
          description: '描述',
          created_at: '创建时间',
        },
        timestampName('任务数据')
      )
    },
  },
  {
    key: 'notices',
    name: '公告数据',
    icon: '✉',
    desc: '导出公告：标题、优先级、作者、状态、发布时间',
    color: '#e8960c',
    handler: async () => {
      const res = await getNotices({ page: 1, pageSize: 1000 })
      const rows = res.data.list
      return exportToCsv(
        rows,
        {
          title: '标题',
          priority: '优先级',
          author: '作者',
          status: '状态',
          created_at: '发布时间',
        },
        timestampName('公告数据')
      )
    },
  },
]

async function doExport(m) {
  const st = states.value[m.key]
  st.loading = true
  try {
    const result = await m.handler()
    if (result.ok) {
      st.done = true
      st.count = result.count
      st.time = new Date().toLocaleTimeString()
      toast.success(`已导出 ${result.count} 条${m.name}`)
    } else {
      toast.error(result.message || '导出失败')
    }
  } catch (e) {
    toast.error(e.message)
  } finally {
    st.loading = false
  }
}

function exportJson(m) {
  toast.info(`「${m.name}」支持 CSV 导出，JSON 导出需在后端接口层接入`)
}

onMounted(() => {})
</script>

<template>
  <div>
    <PageHeader title="数据导出中心" sub="按模块一键导出 CSV / JSON · 数据在本地浏览器生成，不经过第三方">
      <template #actions>
        <span class="pill pill-info">CSV · UTF-8 BOM</span>
      </template>
    </PageHeader>

    <div class="export-grid">
      <div v-for="m in modules" :key="m.key" class="glass-card export-card">
        <div class="export-icon" :style="{ background: m.color + '1a', color: m.color }">{{ m.icon }}</div>
        <div class="export-main">
          <div class="export-name">{{ m.name }}</div>
          <div class="export-desc">{{ m.desc }}</div>
          <div v-if="states[m.key].done" class="export-done">
            ✓ 已导出 {{ states[m.key].count }} 条 · {{ states[m.key].time }}
          </div>
        </div>
        <div class="export-actions">
          <button class="btn btn-primary btn-small" :disabled="states[m.key].loading" @click="doExport(m)">
            {{ states[m.key].loading ? '导出中…' : '导出 CSV' }}
          </button>
          <button class="btn btn-ghost btn-small" :disabled="states[m.key].loading" @click="exportJson(m)">
            JSON
          </button>
        </div>
      </div>
    </div>

    <section class="glass-card mb-16">
      <div class="card-head"><div class="card-title">导出说明</div></div>
      <div class="notes">
        <div class="note">1. 导出文件为 UTF-8 BOM 编码 CSV，Excel 可直接打开并正确显示中文。</div>
        <div class="note">2. 单次最多导出最近 1000 条记录；如需全量数据请使用后端 CSV 接口。</div>
        <div class="note">3. 导出操作不写入审计日志（纯前端行为），请遵守数据安全规范。</div>
        <div class="note">4. 文件名包含导出时间戳，避免重复覆盖。</div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.export-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}
.export-card {
  display: flex;
  gap: 14px;
  padding: 18px 20px;
  align-items: flex-start;
}
.export-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.export-main {
  flex: 1;
  min-width: 0;
}
.export-name {
  font-weight: 700;
  font-size: 15px;
}
.export-desc {
  font-size: 12.5px;
  color: var(--text-muted);
  margin-top: 4px;
  line-height: 1.6;
}
.export-done {
  font-size: 12px;
  color: var(--success);
  font-weight: 600;
  margin-top: 8px;
}
.export-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}
.card-head {
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-subtle);
}
.card-title {
  font-size: 15px;
  font-weight: 700;
}
.notes {
  padding: 8px 18px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.note {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}
@media (max-width: 1000px) {
  .export-grid { grid-template-columns: 1fr; }
}
</style>
