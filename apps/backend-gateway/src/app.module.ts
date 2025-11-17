import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
// 1. 明确导入所有需要的"联邦服务"
import { PrismaModule, HealthModule, OrchestrationModule, MultiTenantModule, ApiGatewayModule, PluginMarketplaceModule, PluginProtocolModule, AIAgentModule, DynamicOrchestrationModule, AdvancedCapabilitiesModule, VectorDatabaseModule, DataWarehouseModule } from '@tuheg/common-backend'

// 2. 明确导入所有本应用的"内部模块"
import { AuthModule } from './auth/auth.module'
import { GamesModule } from './games/games.module'
import { SettingsModule } from './settings/settings.module'
import { GatewayModule } from './gateway/gateway.module'
import { OrchestrationAPIModule } from './orchestration/orchestration.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [
    // 3. 在 imports 数组中，清晰地列出所有依赖
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule, // <-- [核心修复] 我们现在明确声明：此应用依赖数据库
    HealthModule,
    OrchestrationModule, // <-- 多Agent编排系统
    OrchestrationAPIModule, // <-- 编排API接口
    MultiTenantModule, // <-- 多租户系统
    ApiGatewayModule, // <-- API网关增强
    PluginMarketplaceModule, // <-- 插件市场平台
    PluginProtocolModule, // <-- 插件标准化协议
    AIAgentModule, // <-- AI Agent标准化协议
    DynamicOrchestrationModule, // <-- 动态Agent编排
    AdvancedCapabilitiesModule, // <-- 高级AI能力集成
    VectorDatabaseModule, // <-- 向量数据库增强
    DataWarehouseModule, // <-- 数据仓库和分析
    AuthModule,
    GamesModule,
    SettingsModule,
    GatewayModule,
  ],
  controllers: [AppController], // 确保 AppController 还在
  providers: [AppService], // 确保 AppService 还在
})
export class AppModule {}
