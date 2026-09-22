<script setup>
/**
 * 帮助中心：快速上手 + 常见问题 + 技术架构
 */
import { ref } from 'vue'

const activeFaq = ref(0)

const faqs = [
  { q: '如何登录系统？', a: '使用管理员账号 admin@example.com / admin123 登录，或在登录页点击"立即注册"创建新账号。连续 5 次密码错误会被锁定 15 分钟。' },
  { q: '忘记密码怎么办？', a: '联系系统管理员，在"用户管理 → 重置密码"中为你的账号设置新密码（需 8 位以上且含大小写、数字、特殊字符）。' },
  { q: '为什么提示"登录已过期"？', a: 'JWT 令牌默认 24 小时有效。登出、修改密码或令牌过期后需重新登录；也可在"个人中心 → 账户安全"查看并管理在线会话。' },
  { q: '如何新建一个任务？', a: '进入"待办任务"，点击右上角"新建任务"，填写标题、优先级与截止日期即可。支持在待办/进行中/已完成三列间拖拽流转。' },
  { q: '批量导入用户支持什么格式？', a: '每行一个用户：姓名,邮箱,手机号,密码,部门,地区。姓名和邮箱必填，密码留空默认 User@12345。' },
  { q: '系统数据存在哪里？', a: '数据存储于本机 MySQL（库名 userdb），共 16 张业务表。可在"系统工具"页查看每张表的行数与结构。' },
  { q: '如何把系统部署到服务器？', a: '本系统前后端分离：前端 Vite 构建后由 Nginx 托管，后端 Node/Express 提供 API，MySQL 提供存储。具体部署文档见项目根目录 README.md。' },
  { q: '接口安全如何保障？', a: '所有 API 均需 Bearer Token；登出令牌进入黑名单立即失效；登录接口限流 10 次/分钟；RBAC 角色权限细粒度鉴权；敏感操作全部写审计日志。' },
]

const quickStarts = [
  { icon: '◈', title: '查看数据概览', desc: '仪表盘包含 8 组数据视图：统计卡、月度趋势、角色/部门分布、操作分布、在线用户与最近动态。' },
  { icon: '▤', title: '管理用户账号', desc: '用户列表支持搜索、分页、批量启用/禁用/删除、CSV 导出与批量导入，单用户可重置密码。' },
  { icon: '☑', title: '使用任务看板', desc: '创建个人任务并按优先级组织，拖拽卡片完成状态流转，逾期任务自动标红。' },
  { icon: '⚿', title: '配置角色权限', desc: '在角色权限页为角色勾选权限点（RBAC），实现按模块的细粒度访问控制。' },
  { icon: '◉', title: '监控系统状态', desc: '系统监控页每 5 秒刷新 CPU/内存/负载/在线用户；系统工具页提供一键深度诊断。' },
  { icon: '✉', title: '发布通知公告', desc: '公告发布后自动出现在顶栏铃铛，最新 5 条直达用户，支持普通/重要/紧急三级优先级。' },
]

const architecture = [
  { layer: '前端', tech: 'Vue 3 + Vite + Pinia + Vue Router + ECharts', detail: '白色科技设计系统 · 组合式 API · 路由守卫 · axios 拦截器' },
  { layer: '后端', tech: 'Node.js + Express + JWT', detail: 'MVC 分层 · RBAC 中间件 · 登录锁定/限流 · 黑名单 · 审计日志' },
  { layer: '数据库', tech: 'MySQL 8（userdb · 16 表）', detail: '用户/日志/会话/公告/任务/消息/文件/字典/角色/权限/菜单/配置' },
  { layer: '部署', tech: '前后端分离 · 可上传 Linux 服务器', detail: 'Nginx 托管静态资源 + 反向代理 API · systemd 守护进程' },
]
</script>

<template>
  <div>
    <div class="page-head">
      <h2>帮助中心</h2>
      <span class="sub">快速上手 · 常见问题 · 技术架构</span>
    </div>

    <!-- 快速上手 -->
    <section class="glass-card mb-16">
      <div class="card-head"><div class="card-title">快速上手</div></div>
      <div class="quick-grid">
        <div v-for="s in quickStarts" :key="s.title" class="quick-card">
          <span class="quick-icon">{{ s.icon }}</span>
          <div class="quick-main">
            <div class="quick-title">{{ s.title }}</div>
            <div class="quick-desc">{{ s.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 常见问题 -->
    <section class="glass-card mb-16">
      <div class="card-head"><div class="card-title">常见问题</div><span class="pill pill-info">{{ faqs.length }} 条</span></div>
      <div class="faq-list">
        <div v-for="(f, i) in faqs" :key="i" class="faq-item" :class="{ open: activeFaq === i }">
          <button class="faq-q" @click="activeFaq = activeFaq === i ? -1 : i">
            <span class="faq-icon">{{ activeFaq === i ? '−' : '+' }}</span>
            {{ f.q }}
          </button>
          <div v-if="activeFaq === i" class="faq-a">{{ f.a }}</div>
        </div>
      </div>
    </section>

    <!-- 技术架构 -->
    <section class="glass-card">
      <div class="card-head"><div class="card-title">技术架构</div></div>
      <div class="arch-list">
        <div v-for="a in architecture" :key="a.layer" class="arch-row">
          <span class="arch-layer">{{ a.layer }}</span>
          <div class="arch-main">
            <div class="arch-tech">{{ a.tech }}</div>
            <div class="arch-detail text-sm">{{ a.detail }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border-subtle);
}
.card-title { font-size: 15px; font-weight: 700; }
.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  padding: 16px 18px;
}
.quick-card {
  display: flex;
  gap: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px;
  background: var(--bg-panel);
  transition: all 0.16s;
}
.quick-card:hover { box-shadow: var(--shadow-lift); border-color: var(--border-subtle); }
.quick-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--gradient-soft);
  border: 1px solid rgba(37, 99, 235, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  color: var(--primary);
  flex-shrink: 0;
}
.quick-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
.quick-desc { font-size: 12.5px; color: var(--text-secondary); line-height: 1.6; }
.faq-list { padding: 8px 18px 16px; }
.faq-item { border-bottom: 1px solid var(--border-subtle); }
.faq-item:last-child { border-bottom: none; }
.faq-q {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 4px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
}
.faq-q:hover { color: var(--primary); }
.faq-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--gradient-soft);
  border: 1px solid rgba(37, 99, 235, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--primary);
  flex-shrink: 0;
}
.faq-a {
  padding: 0 36px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
}
.arch-list { padding: 8px 18px 16px; }
.arch-row {
  display: flex;
  gap: 14px;
  padding: 14px 4px;
  border-bottom: 1px solid var(--border-subtle);
}
.arch-row:last-child { border-bottom: none; }
.arch-layer {
  width: 60px;
  height: 30px;
  border-radius: 8px;
  background: var(--gradient-main);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.arch-tech { font-weight: 600; font-size: 13.5px; }
.arch-detail { color: var(--text-muted); margin-top: 3px; }
</style>
