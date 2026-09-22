/**
 * 应用装配（企业级安全配置）
 * 中间件顺序：Helmet -> 限流 -> 日志 -> CORS -> JSON -> 路由 -> 404 -> 错误处理
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const routes = require('./routes');
const requestLogger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimit = require('./middleware/rateLimit');

const app = express();

// 安全响应头（隐藏技术栈、防点击劫持、MIME 嗅探等）
app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS 白名单：仅允许前端开发服务器
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin(origin, cb) {
      // 非浏览器请求（curl / 内部工具）无 origin，直接放行
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: false,
  })
);

// 请求体限制：防止超大 payload 攻击
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// 请求日志 + 全局限流
app.use(requestLogger);
app.use(rateLimit);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', service: 'user-management-api', time: new Date().toISOString() });
});

// 业务路由
app.use('/api', routes);

// 404 兜底
app.use((req, res) => {
  res.status(404).json({ code: 404, message: `接口不存在: ${req.method} ${req.originalUrl}`, data: null });
});

// 统一错误处理（必须放在最后）
app.use(errorHandler);

module.exports = app;
