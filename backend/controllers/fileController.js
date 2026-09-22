/**
 * 文件管理控制器
 */
const fileService = require('../services/fileService');
const ApiResponse = require('../utils/response');
const validator = require('../utils/validator');
const logger = require('../utils/logger');

class FileController {
  /**
   * GET /api/files/tree  （文件夹树）
   */
  async tree(req, res, next) {
    try {
      const folders = await fileService.folders();
      return ApiResponse.success(res, folders);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/files?folderId=&keyword=
   */
  async list(req, res, next) {
    try {
      const list = await fileService.listFiles(req.query.folderId, req.query.keyword);
      return ApiResponse.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/files/stats
   */
  async stats(req, res, next) {
    try {
      const data = await fileService.stats();
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/files/folder
   */
  async createFolder(req, res, next) {
    try {
      const err = validator.requiredString(req.body?.name, '文件夹名称');
      if (err) return ApiResponse.badRequest(res, err);
      const folder = await fileService.createFolder(req.body.name, req.body.parentId);
      return ApiResponse.created(res, folder, '文件夹已创建');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/files
   */
  async create(req, res, next) {
    try {
      const err = validator.requiredString(req.body?.name, '文件名');
      if (err) return ApiResponse.badRequest(res, err);
      const file = await fileService.createFile({ ...req.body, ownerId: req.user.id });
      logger.logToDb({
        action: 'FILE_CREATE',
        method: req.method,
        path: req.originalUrl,
        detail: `上传文件：${file.name}`,
        userName: req.user.name,
        ip: req.ip,
      });
      return ApiResponse.created(res, file, '文件已保存');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/files/:id/download
   */
  async download(req, res, next) {
    try {
      await fileService.bumpDownload(Number(req.params.id));
      return ApiResponse.success(res, null, '下载已记录');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/files/:id
   */
  async remove(req, res, next) {
    try {
      const ok = await fileService.removeFile(Number(req.params.id));
      if (!ok) return ApiResponse.notFound(res, '文件不存在');
      return ApiResponse.success(res, null, '文件已删除');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/files/folder/:id
   */
  async removeFolder(req, res, next) {
    try {
      const ok = await fileService.removeFolder(Number(req.params.id));
      if (!ok) return ApiResponse.notFound(res, '文件夹不存在');
      return ApiResponse.success(res, null, '文件夹已删除（含内部文件）');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FileController();
