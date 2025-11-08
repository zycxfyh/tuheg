/**
 * 快速失败组件导出
 * 集中导出所有快速失败相关的中间件、过滤器、守卫等
 */

export { FailFastExceptionFilter } from './fail-fast.exception-filter'
export { FailFastGuard } from './fail-fast.guard'
export { FailFastInterceptor } from './fail-fast.interceptor'
export { FailFastMiddleware } from './fail-fast.middleware'
export { FailFastValidationPipe, strictValidationPipe } from './fail-fast.pipe'

/**
 * 快速失败配置
 * 用于NestJS应用的全局配置
 */
export const failFastConfig = {
  // 中间件
  middleware: [FailFastMiddleware],

  // 全局守卫
  guards: [FailFastGuard],

  // 全局拦截器
  interceptors: [FailFastInterceptor],

  // 全局管道
  pipes: [strictValidationPipe],

  // 全局过滤器
  filters: [FailFastExceptionFilter],
}

/**
 * 快速失败最佳实践说明
 *
 * 1. 立即失败原则：在开发和测试环境中，遇到错误立即停止执行
 * 2. 详细日志记录：记录所有错误、性能指标和异常情况
 * 3. 严格验证：对所有输入数据进行严格验证
 * 4. 性能监控：监控API响应时间和资源使用
 * 5. 安全检查：实施严格的身份验证和授权
 * 6. 超时控制：防止长时间运行的操作
 * 7. 资源清理：确保在错误情况下正确清理资源
 */
