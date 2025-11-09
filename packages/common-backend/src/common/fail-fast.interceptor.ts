import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common'
import { type Observable, throwError } from 'rxjs'
import { catchError, tap, timeout } from 'rxjs/operators'

/**
 * 快速失败拦截器
 * 监控API调用，记录性能指标，并在出现错误时快速失败
 */
@Injectable()
export class FailFastInterceptor implements NestInterceptor {
  private readonly logger = new Logger(FailFastInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { url, method, ip } = request
    const startTime = Date.now()

    this.logger.debug(`🚀 API call started: ${method} ${url}`, {
      ip,
      userAgent: request.get('User-Agent'),
      timestamp: new Date().toISOString(),
    })

    return next.handle().pipe(
      // 设置超时
      timeout(30000), // 30秒超时

      // 记录成功响应
      tap((_response) => {
        const duration = Date.now() - startTime
        this.logger.debug(`✅ API call completed: ${method} ${url}`, {
          duration: `${duration}ms`,
          statusCode: context.switchToHttp().getResponse().statusCode,
          timestamp: new Date().toISOString(),
        })

        // 检查性能阈值
        if (duration > 5000) {
          // 5秒
          this.logger.warn(`🐌 Slow API call detected: ${method} ${url}`, {
            duration: `${duration}ms`,
            threshold: '5000ms',
          })
        }
      }),

      // 处理错误
      catchError((error) => {
        const duration = Date.now() - startTime

        this.logger.error(`❌ API call failed: ${method} ${url}`, {
          duration: `${duration}ms`,
          error: error.message,
          stack: error.stack,
          ip,
          timestamp: new Date().toISOString(),
        })

        // 在测试环境中，重新抛出错误以立即失败
        if (process.env.NODE_ENV === 'test') {
          throw error
        }

        // 在开发环境中，也重新抛出以便调试
        if (process.env.NODE_ENV === 'development') {
          throw error
        }

        // 在生产环境中，返回错误
        return throwError(() => error)
      })
    )
  }
}
