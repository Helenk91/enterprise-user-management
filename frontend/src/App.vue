<script setup>
/**
 * 应用外壳 v3：白色科技感侧边栏 + 顶栏（全局搜索/通知铃铛）
 */
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useUserStore } from './stores/user'
import ToastContainer from './components/ToastContainer.vue'
import AppModal from './components/AppModal.vue'
import { getUnreadCount, getLatestNotices } from './api/message'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

/* ===== 分组导航 ===== */
const navGroups = [
  {
    label: '工作台',
    items: [
      { to: '/', label: '数据概览', icon: '◈', match: (p) => p === '/' },
      { to: '/users', label: '用户管理', icon: '▤', match: (p) => p.startsWith('/users') },
      { to: '/logs', label: '操作日志', icon: '≡', match: (p) => p.startsWith('/logs') },
    ],
  },
  {
    label: '业务中心',
    items: [
      { to: '/tasks', label: '待办任务', icon: '☑', match: (p) => p.startsWith('/tasks') },
      { to: '/calendar', label: '任务日历', icon: '▦', match: (p) => p.startsWith('/calendar') },
      { to: '/contacts', label: '团队通讯录', icon: '◉', match: (p) => p.startsWith('/contacts') },
      { to: '/notices', label: '通知公告', icon: '✉', match: (p) => p.startsWith('/notices') },
      { to: '/messages', label: '消息中心', icon: '❐', match: (p) => p.startsWith('/messages') },
      { to: '/files', label: '文件管理', icon: '⌁', match: (p) => p.startsWith('/files') },
    ],
  },
  {
    label: '系统管理',
    items: [
      { to: '/roles', label: '角色权限', icon: '⚿', match: (p) => p.startsWith('/roles') },
      { to: '/menus', label: '菜单管理', icon: '☰', match: (p) => p.startsWith('/menus') },
      { to: '/dict', label: '数据字典', icon: '▤', match: (p) => p.startsWith('/dict') },
      { to: '/settings', label: '系统配置', icon: '⚙', match: (p) => p.startsWith('/settings') },
      { to: '/monitor', label: '系统监控', icon: '◉', match: (p) => p.startsWith('/monitor') },
      { to: '/self-test', label: '系统自测', icon: '⚒', match: (p) => p.startsWith('/self-test') },
    ],
  },
  {
    label: '账户与安全',
    items: [
      { to: '/security', label: '登录历史', icon: '↻', match: (p) => p.startsWith('/security') },
      { to: '/profile', label: '个人中心', icon: '⚙', match: (p) => p.startsWith('/profile') },
    ],
  },
  {
    label: '数据中心与支持',
    items: [
      { to: '/report', label: '综合报表', icon: '▤', match: (p) => p.startsWith('/report') },
      { to: '/analytics', label: '数据分析', icon: '◈', match: (p) => p.startsWith('/analytics') },
      { to: '/export', label: '数据导出', icon: '⇩', match: (p) => p.startsWith('/export') },
      { to: '/data-screen', label: '数据大屏', icon: '◫', match: (p) => p.startsWith('/data-screen') },
      { to: '/tools', label: '系统工具', icon: '✚', match: (p) => p.startsWith('/tools') },
      { to: '/docs', label: 'API 文档', icon: '⌘', match: (p) => p.startsWith('/docs') },
      { to: '/help', label: '帮助中心', icon: '?', match: (p) => p.startsWith('/help') },
    ],
  },
]

const currentTitle = computed(() => {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.match(route.path)) return item.label
    }
  }
  return '用户管理系统'
})

/* ===== 全局搜索（分组细化版） ===== */
const searchOpen = ref(false)
const searchKeyword = ref('')
const searchResults = ref([])   // 按分组：[{ group, items }]
const searchIndex = ref(-1)     // 键盘导航当前项（跨组扁平索引）
const filterGroup = ref('全部') // 分组筛选 chips
const groupLabels = ['全部', '工作台', '业务中心', '系统管理', '账户与安全', '数据中心与支持']

// 检索增强元数据：别名关键词 + 功能描述（不改变导航结构）
const SEARCH_META = {
  '/':            { keys: ['首页', '仪表盘', '总览', 'dashboard', '工作台'], desc: '核心指标与快捷入口' },
  '/users':       { keys: ['人员', '账号', '用户列表', '增删改', '导入', '导出', '注册'], desc: '用户账号全生命周期管理' },
  '/logs':        { keys: ['审计', '日志', '操作记录', '留痕'], desc: '全量操作审计日志' },
  '/tasks':       { keys: ['待办', '任务', '事项', '看板', 'todo'], desc: '个人任务看板' },
  '/calendar':    { keys: ['日程', '日历', '排期', '计划', 'date'], desc: '任务日历视图' },
  '/contacts':    { keys: ['通讯录', '同事', '组织', '人员', 'address'], desc: '团队通讯录' },
  '/notices':     { keys: ['公告', '通知', '发文', 'publish'], desc: '通知公告发布管理' },
  '/messages':    { keys: ['消息', '站内信', '通知', 'mail'], desc: '站内消息中心' },
  '/files':       { keys: ['文件', '上传', '下载', '网盘', '素材'], desc: '企业文件管理' },
  '/roles':       { keys: ['角色', '权限', 'rbac', '授权'], desc: '角色-权限-用户三级关联' },
  '/menus':       { keys: ['菜单', '导航', '路由'], desc: '系统菜单配置' },
  '/dict':        { keys: ['字典', '枚举', '选项', '配置'], desc: '数据字典与枚举' },
  '/settings':    { keys: ['配置', '参数', '站点', '键值'], desc: '键值对配置中心' },
  '/monitor':     { keys: ['监控', '服务器', 'cpu', '内存', '性能'], desc: '服务器实时运行状态' },
  '/self-test':   { keys: ['自测', '自检', '体检', 'selftest', '诊断'], desc: '一键全链路系统自检' },
  '/security':    { keys: ['登录历史', '会话', '设备', '下线', '安全'], desc: '登录历史与会话管理' },
  '/profile':     { keys: ['个人', '资料', '密码', '头像', '账号'], desc: '个人资料与修改密码' },
  '/report':      { keys: ['报表', '统计', '汇总', 'report'], desc: '综合经营报表' },
  '/analytics':   { keys: ['分析', '趋势', '热力图', '行为'], desc: '数据分析与可视化' },
  '/export':      { keys: ['导出', 'csv', 'json', '下载'], desc: '数据导出中心' },
  '/data-screen': { keys: ['大屏', '监控屏', '驾驶舱', '看板'], desc: '数据监控大屏' },
  '/tools':       { keys: ['工具', '健康检查', '缓存', '诊断'], desc: '系统工具中心' },
  '/docs':        { keys: ['api', '接口', '文档', '开发'], desc: 'API 接口文档' },
  '/help':        { keys: ['帮助', '说明', 'faq', '使用'], desc: '帮助中心' },
}

const hotItems = [
  { to: '/users', label: '用户管理', icon: '▤' },
  { to: '/tasks', label: '待办任务', icon: '☑' },
  { to: '/calendar', label: '任务日历', icon: '▦' },
  { to: '/notices', label: '通知公告', icon: '✉' },
  { to: '/files', label: '文件管理', icon: '⌁' },
  { to: '/data-screen', label: '数据大屏', icon: '◫' },
  { to: '/self-test', label: '系统自测', icon: '⚒' },
  { to: '/docs', label: 'API 文档', icon: '⌘' },
]

function runSearch() {
  filterGroup.value = '全部' // 新关键词搜索时重置分组过滤
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) {
    searchResults.value = []
    searchIndex.value = -1
    return
  }
  const grouped = []
  for (const group of navGroups) {
    const hits = []
    for (const item of group.items) {
      const meta = SEARCH_META[item.to] || {}
      const keys = [item.label, ...(meta.keys || [])].join(' ').toLowerCase()
      if (keys.includes(kw)) {
        hits.push({ ...item, group: group.label, desc: meta.desc || '' })
      }
    }
    if (hits.length) grouped.push({ group: group.label, items: hits })
  }
  searchResults.value = grouped
  searchIndex.value = grouped.length ? 0 : -1
}
function flatHits() {
  const out = []
  for (const g of visibleGroups()) for (const it of g.items) out.push(it)
  return out
}
function flatIndex(gi, ri) {
  let n = 0
  for (let i = 0; i < gi; i++) n += visibleGroups()[i].items.length
  return n + ri
}
function visibleGroups() {
  if (filterGroup.value === '全部') return searchResults.value
  return searchResults.value.filter((g) => g.group === filterGroup.value)
}
function hitCount() {
  return searchResults.value.reduce((n, g) => n + g.items.length, 0)
}
function onSearchKey(e) {
  if (e.key === 'Escape') {
    searchOpen.value = false
    searchKeyword.value = ''
    searchIndex.value = -1
    return
  }
  if (!hitCount()) return
  const flat = flatHits()
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    searchIndex.value = (searchIndex.value + 1) % flat.length
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    searchIndex.value = (searchIndex.value - 1 + flat.length) % flat.length
  } else if (e.key === 'Enter') {
    const it = flat[searchIndex.value] || flat[0]
    if (it) goTo(it)
  }
}
function pickGroup(label) {
  filterGroup.value = label
  if (!searchKeyword.value.trim() && label !== '全部') {
    // 空关键词：直接展示该分组全部功能
    const g = navGroups.find((x) => x.label === label)
    searchResults.value = g
      ? [{ group: label, items: g.items.map((it) => ({ ...it, group: label, desc: (SEARCH_META[it.to] || {}).desc || '' })) }]
      : []
    searchIndex.value = searchResults.value.length ? 0 : -1
  } else {
    runSearch()
  }
}
function highlight(label) {
  const kw = searchKeyword.value.trim()
  if (!kw) return label
  const i = label.toLowerCase().indexOf(kw.toLowerCase())
  if (i < 0) return label
  return (
    label.slice(0, i) +
    '<b class="search-mark">' +
    label.slice(i, i + kw.length) +
    '</b>' +
    label.slice(i + kw.length)
  )
}
function goTo(item) {
  searchOpen.value = false
  searchKeyword.value = ''
  searchIndex.value = -1
  filterGroup.value = '全部'
  router.push(item.to)
}


/* ===== 通知铃铛 ===== */
const unread = ref(0)
const notices = ref([])
const noticeOpen = ref(false)
async function refreshNotifications() {
  if (!userStore.isLoggedIn) return
  try {
    const u = await getUnreadCount()
    unread.value = u.count
    const n = await getLatestNotices()
    notices.value = (n || []).slice(0, 5)
  } catch {
    /* 忽略 */
  }
}
watch(() => route.path, refreshNotifications)

/* ===== 主题切换（白色 / 深色） ===== */
const theme = ref(localStorage.getItem('ems_theme') || 'light')
function applyTheme() {
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('ems_theme', theme.value)
}
function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  applyTheme()
  // 通知图表视图重绘（ECharts 配色跟随主题）
  window.dispatchEvent(new CustomEvent('ems-theme-change'))
}
applyTheme()

/* ===== 字体切换（思源黑体 / 等线 / MiSans / 黑体 / 宋体 / 楷体 / 等宽） ===== */
const FONT_OPTIONS = [
  { key: 'noto', label: '思源黑体' },
  { key: 'deng', label: '等线' },
  { key: 'misans', label: '小米 MiSans' },
  { key: 'heiti', label: '黑体' },
  { key: 'songti', label: '宋体' },
  { key: 'kaiti', label: '楷体' },
  { key: 'mono', label: '等宽' },
]
let font = ref(localStorage.getItem('ems_font') || 'noto')
// 旧版本默认字体（default / heiti）迁移到思源黑体
if (font.value === 'default' || font.value === 'heiti') {
  font.value = 'noto'
  localStorage.setItem('ems_font', 'noto')
}
const fontOpen = ref(false)
function currentFontLabel() {
  return (FONT_OPTIONS.find((f) => f.key === font.value) || FONT_OPTIONS[0]).label
}
function applyFont() {
  document.documentElement.setAttribute('data-font', font.value)
  localStorage.setItem('ems_font', font.value)
  // 通知图表视图重绘（ECharts 文字字体跟随）
  window.dispatchEvent(new CustomEvent('ems-font-change'))
}
function pickFont(key) {
  font.value = key
  applyFont()
  fontOpen.value = false
}
applyFont()

/* ===== 退出（需确认） ===== */
const logoutOpen = ref(false)
function askLogout() {
  logoutOpen.value = true
}
function confirmLogout() {
  logoutOpen.value = false
  userStore.logout()
  router.push('/login')
}

if (userStore.isLoggedIn) {
  refreshNotifications()
}
</script>

<template>
  <div v-if="userStore.isLoggedIn" class="app-shell">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">U</div>
        <div class="brand-text">
          <div class="brand-name">企业管理系统</div>
          <div class="brand-tag">ENTERPRISE</div>
        </div>
      </div>

      <nav class="side-nav">
        <template v-for="group in navGroups" :key="group.label">
          <div class="nav-group-label">{{ group.label }}</div>
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="side-link"
            :class="{ active: item.match(route.path) }"
          >
            <span class="side-icon">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
            <span v-if="item.to === '/messages' && unread > 0" class="side-badge num">{{ unread }}</span>
          </RouterLink>
        </template>
      </nav>

      <div class="side-foot">
        <div class="security-tag">
          <span class="dot" />
          安全会话已启用
        </div>
        <div class="side-version num">v4.0.0</div>
      </div>
    </aside>

    <!-- 右侧主体 -->
    <div class="main-col">
      <header class="topbar">
        <div class="topbar-title">
          <span class="crumb">控制台</span>
          <span class="crumb-sep">/</span>
          <span class="crumb-cur">{{ currentTitle }}</span>
        </div>

        <div class="topbar-right">
          <!-- 全局搜索 -->
          <div class="search-box" :class="{ open: searchOpen }">
            <input
              v-model="searchKeyword"
              class="search-input"
              placeholder="搜索功能…"
              @focus="searchOpen = true"
              @input="runSearch"
              @keydown="onSearchKey"
              @blur="searchOpen = false"
            />
            <div v-if="searchOpen" class="search-panel glass-card" @mousedown.prevent @keydown.stop>
              <!-- 分组筛选 -->
              <div class="search-chips">
                <span
                  v-for="g in groupLabels"
                  :key="g"
                  class="chip"
                  :class="{ on: filterGroup === g }"
                  @click="pickGroup(g)"
                >{{ g }}</span>
              </div>

              <!-- 有关键词：分组结果 -->
              <template v-if="searchKeyword.trim() || filterGroup !== '全部'">
                <div v-if="hitCount()" class="search-meta">
                  找到 <b>{{ hitCount() }}</b> 项功能 · <span class="kbd">↑↓</span> 选择 · <span class="kbd">Enter</span> 跳转 · <span class="kbd">Esc</span> 关闭
                </div>
                <div v-for="(g, gi) in visibleGroups()" :key="g.group" class="search-group-block">
                  <div class="search-group-title">
                    <span class="sg-dot" :class="'sg-' + gi"></span>{{ g.group }}
                    <span class="sg-count">{{ g.items.length }}</span>
                  </div>
                  <div
                    v-for="(r, ri) in g.items"
                    :key="r.to"
                    class="search-item"
                    :class="{ first: flatIndex(gi, ri) === searchIndex }"
                    @click="goTo(r)"
                    @mouseenter="searchIndex = flatIndex(gi, ri)"
                  >
                    <span class="s-icon">{{ r.icon }}</span>
                    <div class="s-main">
                      <div class="search-name" v-html="highlight(r.label)"></div>
                      <div class="search-desc">{{ r.desc }}</div>
                    </div>
                    <span class="s-tag">{{ r.group }}</span>
                    <span class="s-path">{{ r.to }}</span>
                  </div>
                </div>
                <div v-if="!hitCount()" class="search-empty">
                  <div class="search-empty-title">未找到「{{ searchKeyword }}」相关功能</div>
                  <div class="search-empty-sub">试试：用户 / 任务 / 公告 / 文件 / 权限 / 大屏 / 自测</div>
                </div>
              </template>

              <!-- 空关键词：热门功能 + 分组速览 -->
              <template v-else>
                <div class="search-meta">热门功能 · 点击直达</div>
                <div class="hot-grid">
                  <div v-for="h in hotItems" :key="h.to" class="hot-item" @click="goTo(h)">
                    <span class="hot-icon">{{ h.icon }}</span>
                    <span class="hot-label">{{ h.label }}</span>
                  </div>
                </div>
                <div class="search-group-title" style="margin-top: 12px">
                  <span class="sg-dot sg-all"></span>全部分组速览
                  <span class="sg-count">{{ groupLabels.length - 1 }} 组 · {{ navGroups.reduce((n, x) => n + x.items.length, 0) }} 项</span>
                </div>
                <div class="group-overview">
                  <div v-for="g in navGroups" :key="g.label" class="go-row" @click="pickGroup(g.label)">
                    <span class="go-name">{{ g.label }}</span>
                    <span class="go-meta">{{ g.items.length }} 项功能</span>
                    <span class="go-arrow">→</span>
                  </div>
                </div>
              </template>
            </div>

          </div>

          <!-- 主题切换 -->
          <button
            class="theme-toggle"
            :title="theme === 'light' ? '切换深色主题' : '切换浅色主题'"
            @click="toggleTheme"
          >
            {{ theme === 'light' ? '☾' : '☀' }}
          </button>

          <!-- 字体切换 -->
          <div class="font-wrap" @click="fontOpen = !fontOpen">
            <button class="theme-toggle" :title="'切换字体：' + currentFontLabel()">字</button>
            <div v-if="fontOpen" class="font-panel glass-card" @click.stop>
              <div class="font-head">
                <b>界面字体</b>
                <span class="text-xs">当前：{{ currentFontLabel() }}</span>
              </div>
              <div
                v-for="f in FONT_OPTIONS"
                :key="f.key"
                class="font-option"
                :class="{ on: font === f.key }"
                @click="pickFont(f.key)"
              >
                <span class="font-name" :class="'fo-' + f.key">示例文字 123 ABC</span>
                <span class="font-label">{{ f.label }}</span>
              </div>
              <div class="font-tip text-xs">选择后即时生效并自动保存</div>
            </div>
          </div>

          <!-- 通知铃铛 -->
          <div class="bell-wrap" @click="noticeOpen = !noticeOpen">
            <span class="bell">🔔</span>
            <span v-if="unread > 0" class="badge-dot">{{ unread }}</span>
            <div v-if="noticeOpen" class="notice-panel glass-card">
              <div class="notice-head">
                <b>最新公告</b>
                <RouterLink to="/notices" class="text-sm" @click="noticeOpen = false">全部</RouterLink>
              </div>
              <div v-if="notices.length" class="notice-list">
                <RouterLink
                  v-for="n in notices"
                  :key="n.id"
                  to="/notices"
                  class="notice-item"
                  @click="noticeOpen = false"
                >
                  <div class="notice-title">{{ n.title }}</div>
                  <div class="notice-meta">{{ n.author }} · {{ n.created_at?.slice(0, 10) }}</div>
                </RouterLink>
              </div>
              <div v-else class="search-empty">暂无公告</div>
            </div>
          </div>

          <div class="topbar-user">
            <div class="user-chip">
              <span class="user-avatar" :class="`ua-${userStore.user?.role || 'user'}`">
                {{ (userStore.displayName || '?').charAt(0) }}
              </span>
              <span class="user-meta">
                <span class="user-name">{{ userStore.displayName }}</span>
                <span class="user-role">{{ userStore.isAdmin ? '管理员' : '普通用户' }}</span>
              </span>
            </div>
            <RouterLink to="/profile" class="btn btn-ghost btn-small">个人中心</RouterLink>
            <button class="btn btn-ghost btn-small btn-logout" @click="askLogout">退出</button>
          </div>
        </div>
      </header>

      <main class="content">
        <RouterView v-slot="{ Component }">
          <Transition name="fade-page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>

      <footer class="app-footer">
        企业管理系统 v4.0 · Vue 3 / Express / MySQL · 白色科技主题 · 数据大屏 / API 文档 / 系统工具 · 安全加固（JWT 黑名单 · 登录锁定 · 限流 · RBAC）
      </footer>
    </div>

    <!-- 退出登录确认 -->
    <AppModal :open="logoutOpen" title="退出登录" @close="logoutOpen = false">
      <div class="logout-tip">
        <div class="logout-ico">⎋</div>
        <div class="logout-msg">确定要退出当前账号吗？</div>
        <div class="logout-sub">退出后需要重新输入账号密码登录，未完成的操作将不会被保存。</div>
      </div>
      <template #footer>
        <button class="btn" @click="logoutOpen = false">取消</button>
        <button class="btn btn-danger" @click="confirmLogout">确认退出</button>
      </template>
    </AppModal>

    <ToastContainer />
  </div>
  <!-- 未登录分支：按路由 key 渲染，防止组件缓存残留导致页面错位 -->
  <RouterView v-else :key="route.path" />
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

/* ===== 侧边栏（白色科技） ===== */
.sidebar {
  width: 232px;
  flex-shrink: 0;
  background: var(--bg-panel);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  position: sticky;
  top: 0;
  height: 100vh;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px 22px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 18px;
}
.brand-logo {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--gradient-main);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  box-shadow: 0 6px 22px rgba(37, 99, 235, 0.4);
}
.brand-name {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--text-primary);
}
.brand-tag {
  font-size: 10px;
  letter-spacing: 0.28em;
  color: var(--text-muted);
  margin-top: 2px;
}
.side-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
}
.nav-group-label {
  font-size: 10.5px;
  letter-spacing: 0.14em;
  color: var(--text-muted);
  text-transform: uppercase;
  padding: 12px 10px 6px;
  font-weight: 700;
}
.side-link {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: 10px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.16s;
  border: 1px solid transparent;
  position: relative;
}
.side-link:hover {
  color: var(--primary);
  background: var(--bg-hover);
}
.side-link.active {
  color: var(--primary);
  background: var(--gradient-soft);
  border-color: rgba(37, 99, 235, 0.18);
  font-weight: 600;
}
.side-link.active::before {
  content: '';
  position: absolute;
  left: -14px;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 999px;
  background: var(--gradient-main);
  box-shadow: 0 0 10px rgba(37, 99, 235, 0.6);
}
.side-icon {
  width: 22px;
  text-align: center;
  font-size: 15px;
  color: var(--primary);
  opacity: 0.85;
}
.side-badge {
  margin-left: auto;
  background: var(--danger);
  color: #fff;
  font-size: 10.5px;
  border-radius: 999px;
  padding: 0 7px;
  line-height: 17px;
}
.side-foot {
  padding: 14px 10px 4px;
  border-top: 1px solid var(--border-subtle);
}
.security-tag {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  color: var(--text-muted);
}
.security-tag .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 8px rgba(15, 169, 104, 0.7);
  animation: pulse 2s infinite;
}
.side-version {
  margin-top: 8px;
  font-size: 10.5px;
  color: var(--text-muted);
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

/* ===== 主体列 ===== */
.main-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.topbar {
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 90;
}
.topbar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
}
.crumb {
  color: var(--text-muted);
}
.crumb-sep {
  color: var(--text-muted);
  opacity: 0.5;
}
.crumb-cur {
  color: var(--text-primary);
  font-weight: 600;
}
.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

/* 搜索 */
.search-box {
  position: relative;
}
.search-input {
  width: 200px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  border-radius: 999px;
  padding: 7px 16px;
  font-size: 13px;
  transition: all 0.2s;
}
.search-input:focus {
  outline: none;
  width: 250px;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  background: var(--bg-panel);
}
.search-panel {
  position: absolute;
  right: 0;
  top: 44px;
  width: 270px;
  padding: 8px;
  z-index: 200;
  border-radius: 12px;
}
.search-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.search-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.search-item:hover,
.search-item.first {
  background: var(--bg-hover);
}
.search-name {
  font-size: 13.5px;
  color: var(--text-primary);
  font-weight: 500;
}
.search-group {
  font-size: 11px;
  color: var(--text-muted);
}
.search-empty {
  text-align: center;
  padding: 22px 0;
  color: var(--text-muted);
  font-size: 12.5px;
}


/* 搜索面板 v2（分组细化） */
.search-panel {
  width: 372px;
  padding: 10px;
  max-height: 480px;
  overflow-y: auto;
}
/* 深色下修正：全局 .glass-card 会把定位覆盖为 relative、背景置为渐变透明，
   搜索面板必须保持 absolute 悬浮定位 + 不透明底色 */
html[data-theme='dark'] .search-panel {
  position: absolute;
  background: rgba(16, 26, 46, 0.97);
  border-color: rgba(82, 120, 185, 0.26);
}
.search-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 2px 2px 9px;
  border-bottom: 1px dashed var(--border-subtle);
  margin-bottom: 8px;
}
.chip {
  font-size: 11.5px;
  color: var(--text-secondary);
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 3px 10px;
  cursor: pointer;
  transition: all 0.15s;
}
.chip:hover { border-color: var(--primary); color: var(--primary); }
.chip.on {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  font-weight: 600;
}
.search-meta {
  font-size: 11.5px;
  color: var(--text-muted);
  padding: 4px 4px 8px;
}
.search-meta b { color: var(--primary); font-weight: 700; }
.kbd {
  display: inline-block;
  font-size: 10px;
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 0 4px;
  margin: 0 1px;
  background: var(--bg-input);
}
.search-group-block { margin-bottom: 6px; }
.search-group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-secondary);
  padding: 8px 6px 4px;
}
.sg-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
  background: #94a3b8;
}
.sg-0 { background: #2563eb; }
.sg-1 { background: #0ea5e9; }
.sg-2 { background: var(--chart-violet); }
.sg-3 { background: #f59e0b; }
.sg-4 { background: #22c55e; }
.sg-all { background: linear-gradient(135deg, #2563eb, #22c55e); }
.sg-count {
  font-size: 10.5px;
  color: var(--text-muted);
  background: var(--bg-input);
  border-radius: 99px;
  padding: 1px 7px;
}
.search-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 9px;
  border-radius: 9px;
  cursor: pointer;
  border: 1px solid transparent;
}
.search-item:hover,
.search-item.first {
  background: var(--bg-hover);
  border-color: var(--border-subtle);
}
.s-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  font-size: 14px;
  color: var(--primary);
  flex-shrink: 0;
}
.s-main { flex: 1; min-width: 0; }
.search-name { font-size: 13.5px; color: var(--text-primary); font-weight: 600; }
.search-mark { color: var(--primary); background: rgba(37, 99, 235, 0.1); border-radius: 3px; padding: 0 2px; }
.search-desc {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.s-tag {
  font-size: 10px;
  color: var(--text-muted);
  border: 1px solid var(--border-subtle);
  border-radius: 5px;
  padding: 1px 6px;
  flex-shrink: 0;
}
.s-path {
  font-size: 10px;
  color: #a0aec0;
  font-family: Consolas, monospace;
  flex-shrink: 0;
}
.search-empty-title {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 5px;
}
.search-empty-sub { font-size: 11.5px; color: var(--text-muted); }
.hot-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 7px;
}
.hot-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 4px;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-input);
  cursor: pointer;
  transition: all 0.15s;
}
.hot-item:hover {
  border-color: var(--primary);
  background: var(--bg-hover);
  transform: translateY(-1px);
}
.hot-icon { font-size: 16px; color: var(--primary); }
.hot-label { font-size: 11.5px; color: var(--text-primary); font-weight: 500; }
.group-overview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 2px;
}
.go-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
.go-row:hover { background: var(--bg-hover); }
.go-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.go-meta { font-size: 11px; color: var(--text-muted); }
.go-arrow { font-size: 12px; color: var(--primary); }

/* 通知铃铛 */
.theme-toggle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border-subtle);
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.16s;
}
.theme-toggle:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--bg-hover);
}

/* 字体切换 */
.font-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.font-panel {
  position: absolute;
  right: 0;
  top: 46px;
  width: 252px;
  padding: 10px;
  z-index: 200;
  border-radius: 12px;
}
html[data-theme='dark'] .font-panel {
  position: absolute;
  background: rgba(16, 26, 46, 0.97);
  border-color: rgba(82, 120, 185, 0.26);
}
.font-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 9px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 6px;
}
.font-head b { font-size: 13.5px; }
.font-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 9px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.font-option:hover { background: var(--bg-hover); }
.font-option.on {
  background: var(--bg-active);
  border-color: rgba(37, 99, 235, 0.22);
}
.font-name { font-size: 14px; color: var(--text-primary); }
.font-label { font-size: 11.5px; color: var(--text-muted); flex-shrink: 0; }
.font-option.on .font-label { color: var(--primary); font-weight: 700; }
.fo-noto { font-family: 'Noto Sans SC', 'Source Han Sans SC', sans-serif; }
.fo-deng { font-family: 'DengXian', '等线', sans-serif; }
.fo-misans { font-family: 'MiSans', sans-serif; }
.fo-heiti { font-family: 'SimHei', '黑体', 'Microsoft YaHei', sans-serif; }
.fo-songti { font-family: 'SimSun', '宋体', 'NSimSun', serif; }
.fo-kaiti { font-family: 'KaiTi', '楷体', 'STKaiti', serif; }
.fo-mono { font-family: 'JetBrains Mono', Consolas, 'Courier New', monospace; }
.font-tip { padding: 8px 6px 2px; color: var(--text-muted); border-top: 1px dashed var(--border-subtle); margin-top: 4px; }
.bell-wrap {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  transition: all 0.16s;
}
.bell-wrap:hover {
  border-color: var(--primary);
  background: var(--bg-hover);
}
.bell {
  font-size: 16px;
}
.notice-panel {
  position: absolute;
  right: 0;
  top: 46px;
  width: 300px;
  padding: 10px;
  z-index: 200;
  border-radius: 12px;
}
/* 深色下修正：同搜索面板，防止 .glass-card 全局规则覆盖定位与背景 */
html[data-theme='dark'] .notice-panel {
  position: absolute;
  background: rgba(16, 26, 46, 0.97);
  border-color: rgba(82, 120, 185, 0.26);
}
.notice-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 10px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 6px;
}
.notice-head b {
  font-size: 13.5px;
}
.notice-list {
  display: flex;
  flex-direction: column;
}
.notice-item {
  text-decoration: none;
  padding: 9px 8px;
  border-radius: 8px;
}
.notice-item:hover {
  background: var(--bg-hover);
}
.notice-title {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notice-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

/* 用户区 */
.topbar-user {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 9px;
  padding-right: 6px;
}
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}
.ua-admin {
  background: linear-gradient(135deg, var(--chart-violet), var(--chart-indigo));
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
}
.ua-user {
  background: var(--gradient-main);
  box-shadow: 0 0 12px rgba(37, 99, 235, 0.35);
}
.user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.user-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.user-role {
  font-size: 11px;
  color: var(--text-muted);
}
.logout-tip {
  text-align: center;
  padding: 6px 4px 2px;
}
.logout-ico {
  font-size: 40px;
  color: var(--warning);
  margin-bottom: 12px;
  line-height: 1;
}
.logout-msg {
  font-size: 15.5px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}
.logout-sub {
  font-size: 12.5px;
  color: var(--text-muted);
  line-height: 1.6;
}
.btn-logout {
  color: var(--danger);
  border-color: rgba(229, 72, 77, 0.3);
}
.btn-logout:hover {
  background: var(--danger-soft);
  color: var(--danger);
  border-color: rgba(229, 72, 77, 0.5);
}

.content {
  flex: 1;
  padding: 26px 28px;
  max-width: 1360px;
  width: 100%;
}
.app-footer {
  text-align: center;
  padding: 16px;
  color: var(--text-muted);
  font-size: 12px;
  border-top: 1px solid var(--border-subtle);
}

@media (max-width: 900px) {
  .sidebar {
    width: 64px;
  }
  .brand-text,
  .side-link span:not(.side-icon),
  .nav-group-label,
  .side-foot {
    display: none;
  }
  .side-link {
    justify-content: center;
    padding: 12px;
  }
  .search-input {
    width: 120px;
  }
}
</style>
