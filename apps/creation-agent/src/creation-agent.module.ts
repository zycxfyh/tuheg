// 文件路径: apps/creation-agent/src/creation-agent.module.ts

import { Module } from '@nestjs/common'

// 从 @tuheg/common-backend 导入所有需要的共享模块
import {
  AiProviderFactory,
  ConfigModule,
  DynamicAiSchedulerService,
  EventBusModule,
  PrismaModule,
  PromptInjectionGuard,
  PromptManagerModule,
} from '@tuheg/common-backend'
import { CreationService } from './creation.service'
// 导入本模块自己的器官
import { CreationAgentController } from './creation-agent.controller'

@Module({
  imports: [
    ConfigModule, // 使用共享的类型安全配置模块
    PrismaModule,
    PromptManagerModule,
    EventBusModule,
  ],
  controllers: [CreationAgentController],
  providers: [CreationService, DynamicAiSchedulerService, AiProviderFactory, PromptInjectionGuard],
})
export class CreationAgentModule {}
