/**
 * 模拟数据生成脚本
 * - 用户补到 200 位（含已有 12 位 → 新增 188 位）
 * - 为 admin 生成 12 条任务（9-10 月，覆盖高/中/低优先级与各状态）
 * - 生成 6 条公告（发布/草稿）
 * - 生成 8 条发给 admin 的消息
 * 用法：node seedData.js
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const config = require('./config');

const SURNAMES = ['欧阳', '司马', '诸葛', '上官', '令狐', '独孤', '东方', '百里', '轩辕', '慕容'];
const MID = ['伟', '芳', '娜', '敏', '静', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀英', '霞', '平', '刚', '桂英', '英'];
const MALE_NAMES = ['伟', '磊', '军', '洋', '勇', '杰', '涛', '明', '超', '平', '刚', '斌', '鹏', '强', '龙', '宇', '浩', '凯', '飞', '波'];
const FEMALE_NAMES = ['芳', '娜', '敏', '静', '艳', '秀英', '霞', '桂英', '英', '婷', '丽', '雪', '琳', '媛', '悦', '蕾', '洁', '珊', '颖', '慧'];
const DEPTS = ['技术部', '市场部', '销售部', '财务部', '人事部', '产品部', '运营部', '法务部', '客服部', '设计部'];
const REGIONS = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '长沙', '苏州', '重庆', '天津', '青岛', '郑州'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pad(n) {
  return String(n).padStart(3, '0');
}

async function main() {
  const pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    charset: config.db.charset,
    dateStrings: true,
  });

  const [countRow] = await pool.query('SELECT COUNT(*) AS cnt FROM users');
  const current = countRow[0].cnt;
  console.log(`当前用户数: ${current}`);

  // ===== 1. 用户补到 200 =====
  const need = Math.max(200 - current, 0);
  const hash = bcrypt.hashSync('User@12345', 10); // 统一密码（满足强度策略）
  let inserted = 0;
  for (let i = 1; i <= need; i++) {
    const idx = current + i;
    const surname = pick(SURNAMES);
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const given = gender === 'male' ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
    const name = surname + given;
    const email = `user_${pad(idx)}@example.com`;
    const dept = pick(DEPTS);
    const region = pick(REGIONS);
    const role = Math.random() < 0.03 ? 'admin' : 'user';
    const phone = `13${String(Math.floor(100000000 + Math.random() * 899999999))}`;
    const daysAgo = Math.floor(Math.random() * 90);
    const birthday = `${1985 + Math.floor(Math.random() * 15)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`;
    await pool.query(
      `INSERT INTO users (email, password, name, role, status, gender, birthday, phone, department, region, bio, created_at)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [email, hash, name, role, gender, birthday, phone, dept, region, `来自${region}的${dept}成员`, daysAgo]
    );
    inserted++;
  }
  console.log(`新增用户: ${inserted}`);

  // ===== 2. admin 的任务（覆盖 9-10 月）=====
  const TITLES = [
    ['整理 Q4 业务规划文档', 'high', 'doing', '2026-10-05', '输出 Q4 目标与资源预算'],
    ['客户回访名单梳理', 'medium', 'todo', '2026-09-28', '整理重点客户回访顺序'],
    ['发布季度安全公告', 'high', 'todo', '2026-09-30', '全员知悉密码策略更新'],
    ['完成数据看板联调', 'low', 'done', '2026-09-18', '大屏指标与接口对齐'],
    ['备份数据库快照', 'high', 'done', '2026-09-15', '全库导出并异地保存'],
    ['招聘面试安排', 'medium', 'doing', '2026-10-08', '初筛 5 份简历'],
    ['系统监控告警阈值调优', 'medium', 'todo', '2026-10-12', 'CPU/内存阈值核对'],
    ['周报提交', 'low', 'done', '2026-09-20', '本周工作小结'],
    ['权限矩阵审计', 'high', 'todo', '2026-10-15', '核对角色权限点'],
    ['前端样式走查', 'low', 'doing', '2026-09-25', '白色主题各页面统一性'],
    ['年度安全培训材料', 'medium', 'todo', '2026-10-20', '钓鱼邮件防范课件'],
    ['服务器日志轮转配置', 'low', 'todo', '2026-09-29', '按周归档 access log'],
  ];
  for (const [title, priority, status, due, desc] of TITLES) {
    await pool.query(
      `INSERT INTO tasks (user_id, title, description, priority, status, due_date)
       VALUES (1, ?, ?, ?, ?, ?)`,
      [title, desc, priority, status, due]
    );
  }
  console.log('admin 任务: +12 条');

  // ===== 3. 公告 =====
  const NOTICES = [
    ['系统完成安全加固升级', 'announcement', 'published', 'admin', 'JWT 黑名单、登录锁定、全局限流已上线，请及时修改弱密码。'],
    ['国庆假期值班安排', 'notice', 'published', 'admin', '10 月 1-7 日值班表已发布，请各小组核对。'],
    ['本周五系统维护窗口', 'notice', 'published', 'admin', '9 月 25 日 22:00-23:00 数据库维护，期间服务可能短暂中断。'],
    ['新员工入职指引更新', 'notice', 'draft', 'admin', '入职流程文档已更新，待审核后发布。'],
    ['企业微信工作台试运行', 'announcement', 'published', 'admin', '消息中心已接入企业微信提醒，欢迎体验。'],
    ['密码策略调整预告', 'notice', 'draft', 'admin', '下月起强制启用 MFA 二次验证。'],
  ];
  for (const [title, type, status, author, content] of NOTICES) {
    await pool.query(
      `INSERT INTO notices (title, content, type, status, author, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [title, content, type, status, author]
    );
  }
  console.log('公告: +6 条');

  // ===== 4. 消息（发给 admin）=====
  const MESSAGES = [
    ['系统维护提醒', '明晚 22:00 数据库维护，请提前保存工作。', 0],
    ['新公告已发布', '《系统完成安全加固升级》已发布，请注意查看。', 0],
    ['任务逾期提醒', '你有 1 个任务已逾期，请及时处理。', 0],
    ['欢迎使用消息中心', '现在支持已读/未读管理，试试看吧。', 1],
    ['权限变更通知', '你的角色权限已同步，管理员角色权限无变化。', 1],
    ['季度总结征集', '请各小组在月底前提交季度总结。', 0],
    ['值班表确认', '国庆值班表请在本周五前确认。', 0],
    ['系统更新日志', 'v4.0 更新：新增任务日历/通讯录/综合报表。', 1],
  ];
  for (const [title, content, isRead] of MESSAGES) {
    await pool.query(
      `INSERT INTO messages (to_user_id, title, content, is_read, created_at)
       VALUES (1, ?, ?, ?, NOW())`,
      [title, content, isRead]
    );
  }
  console.log('消息: +8 条');

  const [[u]] = await pool.query('SELECT COUNT(*) AS cnt FROM users');
  const [[t]] = await pool.query('SELECT COUNT(*) AS cnt FROM tasks');
  const [[n]] = await pool.query('SELECT COUNT(*) AS cnt FROM notices');
  const [[m]] = await pool.query('SELECT COUNT(*) AS cnt FROM messages');
  console.log(`==== 完成：用户 ${u.cnt} / 任务 ${t.cnt} / 公告 ${n.cnt} / 消息 ${m.cnt} ====`);
  await pool.end();
}

main().catch((err) => {
  console.error('seedData 失败:', err.message);
  process.exit(1);
});
