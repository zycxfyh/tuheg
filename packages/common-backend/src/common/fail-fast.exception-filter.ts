import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'

/**
 * 快速失败异常过滤器
 * 在开发和测试环境中立即失败，记录详细错误信息
 */
@Catch()
export class FailFastExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(FailFastExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    // 确定状态码
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    // 构建错误响应
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: exception instanceof HttpException ? exception.message : 'Internal server error',
    }

    // 详细记录错误信息
    this.logger.error(`🚨 Exception caught: ${exception}`, {
      status,
      url: request.url,
      method: request.method,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      body: request.body,
      query: request.query,
      params: request.params,
      headers: request.headers,
      stack: exception instanceof Error ? exception.stack : undefined,
      timestamp: new Date().toISOString(),
    })

    // 在测试和开发环境中，抛出错误以立即失败
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      if (exception instanceof Error) {
        // 重新抛出原始错误
        throw exception
      } else {
        // 为非Error对象创建新错误
        throw new Error(`Non-Error exception caught: ${exception}`)
      }
    }

    // 在生产环境中，返回标准错误响应
    response.status(status).json(errorResponse)
  }
}
