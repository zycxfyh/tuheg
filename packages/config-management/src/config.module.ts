import { Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'
import { ConfigService } from './config.service'
import { envLoader } from './env-loader'

/**
 * 配置管理模块
 * 提供统一的配置管理功能
 */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [envLoader],
      cache: true,
      expandVariables: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
