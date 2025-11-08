// 文件路径: packages/common-backend/src/ai/time-aware-vector-search.module.ts
// 职责: TimeAwareVectorSearchService 的 NestJS 模块

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from '../prisma/prisma.module'
import { VectorSearchModule } from './vector-search.module'
import { TimeAwareVectorSearchService } from './time-aware-vector-search.service'

@Module({
  imports: [ConfigModule, PrismaModule, VectorSearchModule],
  providers: [TimeAwareVectorSearchService],
  exports: [TimeAwareVectorSearchService],
})
export class TimeAwareVectorSearchModule {}
