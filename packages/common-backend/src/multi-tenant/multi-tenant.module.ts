import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { TenantService } from './tenant.service'
import { TenantController } from './tenant.controller'
import { TenantMiddleware } from './tenant.middleware'
import { TenantGuard } from './tenant.guard'
import { TenantUsageService } from './tenant-usage.service'

@Module({
  providers: [
    TenantService,
    TenantGuard,
    TenantUsageService
  ],
  controllers: [TenantController],
  exports: [
    TenantService,
    TenantGuard,
    TenantMiddleware,
    TenantUsageService
  ]
})
export class MultiTenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 应用租户中间件到所有路由
    consumer.apply(TenantMiddleware).forRoutes('*')
  }
}
