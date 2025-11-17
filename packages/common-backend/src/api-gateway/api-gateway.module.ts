import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { ApiGraphQLModule } from './graphql.module'
import { ApiGatewayController } from './api-gateway.controller'
import { VersionManagementService } from './version-management.service'
import { RateLimitMiddleware } from './rate-limit.middleware'
import { CacheModule } from '../cache/cache.module'

@Module({
  imports: [
    ApiGraphQLModule,
    CacheModule
  ],
  controllers: [ApiGatewayController],
  providers: [
    VersionManagementService,
    RateLimitMiddleware
  ],
  exports: [
    VersionManagementService,
    RateLimitMiddleware,
    ApiGraphQLModule
  ]
})
export class ApiGatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 应用限流中间件到所有API路由
    consumer
      .apply(RateLimitMiddleware)
      .exclude(
        'api/status', // 状态检查不限流
        'api/spec', // API规范不限流
        'health/(.*)', // 健康检查不限流
      )
      .forRoutes('*')
  }
}
