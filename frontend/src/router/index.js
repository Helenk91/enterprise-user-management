/**
 * 路由配置 + 登录守卫（v3：接入全部业务/系统管理页面）
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { public: true, title: '登录' } },
  { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue'), meta: { public: true, title: '注册' } },

  // 工作台
  { path: '/', name: 'dashboard', component: () => import('../views/DashboardView.vue'), meta: { title: '数据概览' } },
  { path: '/users', name: 'users', component: () => import('../views/UserListView.vue'), meta: { title: '用户管理' } },
  { path: '/users/new', name: 'user-create', component: () => import('../views/UserFormView.vue'), meta: { title: '新增用户' } },
  { path: '/users/:id/edit', name: 'user-edit', component: () => import('../views/UserFormView.vue'), props: true, meta: { title: '编辑用户' } },
  { path: '/logs', name: 'logs', component: () => import('../views/LogsView.vue'), meta: { title: '操作日志' } },

  // 业务中心
  { path: '/tasks', name: 'tasks', component: () => import('../views/TasksView.vue'), meta: { title: '待办任务' } },
  { path: '/calendar', name: 'calendar', component: () => import('../views/CalendarView.vue'), meta: { title: '任务日历' } },
  { path: '/contacts', name: 'contacts', component: () => import('../views/ContactsView.vue'), meta: { title: '团队通讯录' } },
  { path: '/report', name: 'report', component: () => import('../views/ReportView.vue'), meta: { title: '综合报表' } },
  { path: '/notices', name: 'notices', component: () => import('../views/NoticesView.vue'), meta: { title: '通知公告' } },
  { path: '/messages', name: 'messages', component: () => import('../views/MessagesView.vue'), meta: { title: '消息中心' } },
  { path: '/files', name: 'files', component: () => import('../views/FilesView.vue'), meta: { title: '文件管理' } },

  // 系统管理
  { path: '/roles', name: 'roles', component: () => import('../views/RolesView.vue'), meta: { title: '角色权限' } },
  { path: '/menus', name: 'menus', component: () => import('../views/MenusView.vue'), meta: { title: '菜单管理' } },
  { path: '/dict', name: 'dict', component: () => import('../views/DictView.vue'), meta: { title: '数据字典' } },
  { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue'), meta: { title: '系统配置' } },
  { path: '/monitor', name: 'monitor', component: () => import('../views/MonitorView.vue'), meta: { title: '系统监控' } },
  { path: '/self-test', name: 'self-test', component: () => import('../views/SelfTestView.vue'), meta: { title: '系统自测' } },

  // 账户与安全
  { path: '/security', name: 'security', component: () => import('../views/SecurityView.vue'), meta: { title: '登录历史与会话' } },
  { path: '/profile', name: 'profile', component: () => import('../views/ProfileView.vue'), meta: { title: '个人中心' } },

  // 数据中心 / 工具 / 帮助
  { path: '/analytics', name: 'analytics', component: () => import('../views/AnalyticsView.vue'), meta: { title: '数据分析' } },
  { path: '/export', name: 'export', component: () => import('../views/ExportView.vue'), meta: { title: '数据导出' } },
  { path: '/data-screen', name: 'data-screen', component: () => import('../views/DataScreenView.vue'), meta: { title: '数据大屏' } },
  { path: '/tools', name: 'tools', component: () => import('../views/ToolsView.vue'), meta: { title: '系统工具' } },
  { path: '/docs', name: 'api-docs', component: () => import('../views/ApiDocsView.vue'), meta: { title: 'API 文档' } },
  { path: '/help', name: 'help', component: () => import('../views/HelpView.vue'), meta: { title: '帮助中心' } },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 全局前置守卫：未登录跳转登录页
router.beforeEach((to) => {
  const userStore = useUserStore()
  document.title = to.meta.title ? `${to.meta.title} · 企业管理系统` : '企业管理系统'

  if (!to.meta.public && !userStore.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.public && userStore.isLoggedIn && (to.name === 'login' || to.name === 'register')) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
