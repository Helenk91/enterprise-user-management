/**
 * 统一响应格式
 * 所有接口返回 { code, message, data }
 * code: 0 成功；其余为业务错误码
 */
class ApiResponse {
  static success(res, data = null, message = 'ok', status = 200) {
    return res.status(status).json({ code: 0, message, data });
  }

  static created(res, data = null, message = '创建成功') {
    return this.success(res, data, message, 201);
  }

  static fail(res, message = '请求失败', code = 400, status = 400) {
    return res.status(status).json({ code, message, data: null });
  }

  static badRequest(res, message = '参数错误') {
    return this.fail(res, message, 400, 400);
  }

  static unauthorized(res, message = '未登录或登录已过期') {
    return this.fail(res, message, 401, 401);
  }

  static forbidden(res, message = '没有权限执行此操作') {
    return this.fail(res, message, 403, 403);
  }

  static notFound(res, message = '资源不存在') {
    return this.fail(res, message, 404, 404);
  }

  static conflict(res, message = '资源冲突') {
    return this.fail(res, message, 409, 409);
  }

  static serverError(res, message = '服务器内部错误') {
    return this.fail(res, message, 500, 500);
  }
}

module.exports = ApiResponse;
