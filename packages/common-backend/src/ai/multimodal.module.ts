// 文件路径: packages/common-backend/src/ai/multimodal.module.ts
// 职责: MultimodalService 的 NestJS 模块

import { Module } from '@nestjs/common';
import { MultimodalService } from './multimodal.service';

@Module({
  providers: [MultimodalService],
  exports: [MultimodalService],
})
export class MultimodalModule {}
