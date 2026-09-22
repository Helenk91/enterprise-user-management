<script setup>
/**
 * API 文档中心：全接口清单 + 分组视图
 */
import { ref, computed, onMounted } from 'vue'
import { getApiList } from '../api/tool'
import { useToast } from '../stores/toast'

const toast = useToast()

const apis = ref([])
const loading = ref(false)
const search = ref('')
const group = ref('全部')

const groups = computed(() => {
  const map = {}
  for (const a of apis.value) {
    const seg = a.path.split('/')[2] || '其他'
    const key = { auth: '认证', users: '用户', stats: '统计', logs: '日志', profile: '个人资料', security: '安全', notices: '公告', tasks: '任务', messages: '消息', files: '文件', dict: '字典', roles: '角色', menus: '菜单', settings: '配置', dashboard: '仪表盘', monitor: '监控', tools: '工具' }[seg] || seg
    map[key] = (map[key] || 0) + 1
  }
  return [{ name: '全部', count: apis.value.length }, ...Object.entries(map).map(([name, count]) => ({ name, count }))]
})

const filtered = computed(() => {
  const kw = search.value.trim().toLowerCase()
  return apis.value.filter((a) => {
    if (group.value !== '全部') {
      const seg = a.path.split('/')[2] || '其他'
      const key = { auth: '认证', users: '用户', stats: '统计', logs: '日志', profile: '个人资料', security: '安全', notices: '公告', tasks: '任务', messages: '消息', files: '文件', dict: '字典', roles: '角色', menus: '菜单', settings: '配置', dashboard: '仪表盘', monitor: '监控', tools: '工具' }[seg] || seg
      if (key !== group.value) return false
    }
    if (!kw) return true
    return a.path.toLowerCase().includes(kw) || a.desc.toLowerCase().includes(kw)
  })
})

function methodClass(m) {
  return { GET: 'm-get', POST: 'm-post', PUT: 'm-put', DELETE: 'm-delete', PATCH: 'm-patch' }[m] || 'm-get'
}

function copyPath(a) {
  navigator.clipboard?.writeText(`http://localhost:3000${a.path}`)
  toast.success('接口地址已复制')
}

async function load() {
  loading.value = true
  try {
    apis.value = (await getApiList())?.data || []
  } catch (e) {
    toast.error(e.message)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head">
      <h2>API 文档中心</h2>
      <span class="sub">全部 RESTful 接口 · 统一返回 { code, message, data } · 需携带 Bearer Token</span>
    </div>

    <div class="toolbar mb-16">
      <input v-model="search" class="input search-input" placeholder="搜索接口路径或说明…" />
      <div class="chips">
        <button
          v-for="g in groups"
          :key="g.name"
          class="chip"
          :class="{ active: group === g.name }"
          @click="group = g.name"
        >
          {{ g.name }} <span class="num">{{ g.count }}</span>
        </button>
      </div>
    </div>

    <section class="glass-card">
      <div v-if="loading" class="loading-bar"><span class="spinner" />加载中…</div>
      <div v-else class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 90px">方法</th>
              <th>接口路径</th>
              <th>说明</th>
              <th style="width: 90px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(a, i) in filtered" :key="i">
              <td><span class="method" :class="methodClass(a.method)">{{ a.method }}</span></td>
              <td><code class="path num">{{ a.path }}</code></td>
              <td class="desc">{{ a.desc }}</td>
              <td><button class="btn btn-ghost btn-small" @click="copyPath(a)">复制</button></td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filtered.length" class="empty-state">没有匹配的接口</div>
        <div class="api-footer text-muted text-sm">
          共 <b class="num">{{ filtered.length }}</b> 个接口 · 所有接口均经过 JWT 鉴权，敏感操作记录审计日志
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.search-input {
  width: 300px;
}
.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.chip {
  border: 1px solid var(--border-subtle);
  background: var(--bg-panel);
  color: var(--text-secondary);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.15s;
}
.chip .num {
  color: var(--text-muted);
  margin-left: 3px;
}
.chip:hover {
  color: var(--primary);
  border-color: var(--border-strong);
}
.chip.active {
  background: var(--gradient-main);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
}
.chip.active .num {
  color: rgba(255, 255, 255, 0.85);
}
.table-wrap {
  padding: 0 18px 12px;
  overflow-x: auto;
}
.method {
  display: inline-block;
  font-size: 11px;
  font-weight: 800;
  border-radius: 6px;
  padding: 3px 9px;
  letter-spacing: 0.04em;
}
.m-get { background: var(--success-soft); color: var(--success); }
.m-post { background: var(--info-soft); color: var(--primary); }
.m-put { background: var(--warning-soft); color: var(--warning); }
.m-delete { background: var(--danger-soft); color: var(--danger); }
.m-patch { background: var(--violet-soft); color: var(--chart-purple); }
.path {
  background: var(--bg-input);
  border-radius: 6px;
  padding: 3px 9px;
  font-size: 12px;
  color: var(--primary);
}
.desc {
  color: var(--text-secondary);
  font-size: 13px;
}
.api-footer {
  padding: 12px 2px;
  border-top: 1px solid var(--border-subtle);
}
</style>
