import { Injectable, Logger, type NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'

/**
 * 快速失败中间件
 * 用于在开发和测试环境中快速捕获和报告错误
 */
@Injectable()
export class FailFastMiddleware implements NestMiddleware {
  private readonly logger = new Logger(FailFastMiddleware.name)

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now()

    // 捕获未处理的promise rejection
    const _originalPromiseReject = process.listeners('unhandledRejection')
    const unhandledRejectionHandler = (reason: any, _promise: Promise<any>) => {
      this.logger.error(`❌ Unhandled Promise Rejection: ${reason}`, {
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString(),
      })

      // 在测试和开发环境中，立即失败
      if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
        throw new Error(`Unhandled promise rejection in middleware: ${reason}`)
      }
    }

    process.on('unhandledRejection', unhandledRejectionHandler)

    // 捕获未处理的异常
    const _originalException = process.listeners('uncaughtException')
    const uncaughtExceptionHandler = (error: Error) => {
      this.logger.error(`❌ Uncaught Exception: ${error.message}`, {
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
      })

      // 在测试和开发环境中，立即失败
      if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
        throw error
      }
    }

    process.on('uncaughtException', uncaughtExceptionHandler)

    // 监控响应
    const originalEnd = res.end
    res.end = function (...args: any[]) {
      const duration = Date.now() - startTime

      // 记录慢请求
      if (duration > 5000) {
        // 5秒
        Logger.warn(`🐌 Slow request detected: ${duration}ms`, {
          url: req.url,
          method: req.method,
          statusCode: res.statusCode,
        })
      }

      // 检查错误响应
      if (res.statusCode >= 500) {
        Logger.error(`🔴 Server Error Response: ${res.statusCode}`, {
          url: req.url,
          method: req.method,
          duration: `${duration}ms`,
        })
      }

      // 清理事件监听器
      process.removeListener('unhandledRejection', unhandledRejectionHandler)
      process.removeListener('uncaughtException', uncaughtExceptionHandler)

      // 调用原始的res.end
      originalEnd.apply(this, args)
    }

    // 设置超时
    const timeout = setTimeout(() => {
      this.logger.error(`⏰ Request timeout after 30s`, {
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
      })

      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request Timeout',
          message: 'Request took too long to process',
          timestamp: new Date().toISOString(),
        })
      }
    }, 30000) // 30秒超时

    // 清理超时
    res.on('finish', () => {
      clearTimeout(timeout)
    })

    next()
  }
}
