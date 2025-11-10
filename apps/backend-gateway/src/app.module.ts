import { Module } from '@nestjs/common'
import { ThrottlerModule } from '@nestjs/throttler'
// 1. 明确导入所有需要的"联邦服务"
import { ConfigModule } from '@tuheg/config-management'
import { DatabaseModule } from '@tuheg/database'
import { AppController } from './app.controller'
import { AppService } from './app.service'
// 2. 明确导入所有本应用的"内部模块"
import { AuthModule } from './auth/auth.module'
import { GamesModule } from './games/games.module'
import { GatewayModule } from './gateway/gateway.module'
import { SettingsModule } from './settings/settings.module'
import { WebhooksModule } from './webhooks/webhooks.module'

@Module({
  imports: [
    // 3. 在 imports 数组中，清晰地列出所有依赖
    ConfigModule, // 使用共享的类型安全配置模块
    DatabaseModule, // 使用数据库模块
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    GamesModule,
    SettingsModule,
    GatewayModule,
    WebhooksModule,
  ],
  controllers: [AppController], // 确保 AppController 还在
  providers: [AppService], // 确保 AppService 还在
})
export class AppModule {}
