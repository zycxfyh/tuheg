// 文件路径: packages/common-backend/src/ai/memory-hierarchy.module.ts
// 职责: MemoryHierarchyService 的 NestJS 模块
// 更新: 增加 VectorSearchService 依赖，支持VCPToolBox 4种记忆召回模式

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from '../prisma/prisma.module'
import { VectorSearchModule } from './vector-search.module'
import { MemoryHierarchyService } from './memory-hierarchy.service'

@Module({
  imports: [ConfigModule, PrismaModule, VectorSearchModule],
  providers: [MemoryHierarchyService],
  exports: [MemoryHierarchyService],
})
export class MemoryHierarchyModule {}
