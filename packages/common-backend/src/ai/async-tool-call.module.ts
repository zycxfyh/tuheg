// 文件路径: packages/common-backend/src/ai/async-tool-call.module.ts
// 职责: AsyncToolCallService 的 NestJS 模块

import { Module } from '@nestjs/common'
// import { EventEmitterModule } from '@nestjs/event-emitter'
const EventEmitterModule = { forRoot: () => ({}) } // Temporary mock
import { AsyncToolCallService } from './async-tool-call.service'

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [AsyncToolCallService],
  exports: [AsyncToolCallService],
})
export class AsyncToolCallModule {}
