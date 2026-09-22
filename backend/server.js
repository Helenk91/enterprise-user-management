/**
 * 服务入口
 * 启动 HTTP 服务并初始化数据库连接校验
 */
const app = require('./app');
const config = require('./config');
const { pool } = require('./db');
const logger = require('./utils/logger');

async function bootstrap() {
  try {
    // 启动前校验数据库连通性
    await pool.query('SELECT 1');
    logger.info('数据库连接成功', { database: config.db.database });

    app.listen(config.server.port, () => {
      logger.info(`服务已启动: http://localhost:${config.server.port}`);
      logger.info(`环境: ${config.server.env}`);
    });
  } catch (err) {
    logger.error('数据库连接失败，服务未启动', { message: err.message });
    process.exit(1);
  }
}

bootstrap();
