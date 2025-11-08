// 文件路径: packages/common-backend/src/health/health.module.ts

import { Module } from '@nestjs/common'
import { HealthController } from './health.controller'

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
