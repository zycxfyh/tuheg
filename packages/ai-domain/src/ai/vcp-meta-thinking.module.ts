// 文件路径: packages/common-backend/src/ai/vcp-meta-thinking.module.ts
// 职责: VcpMetaThinkingService 的 NestJS 模块

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { VcpMetaThinkingService } from './vcp-meta-thinking.service'

@Module({
  imports: [ConfigModule],
  providers: [VcpMetaThinkingService],
  exports: [VcpMetaThinkingService],
})
export class VcpMetaThinkingModule {}
