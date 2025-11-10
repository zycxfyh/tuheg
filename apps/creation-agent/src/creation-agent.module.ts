// 文件路径: apps/creation-agent/src/creation-agent.module.ts

import { Module } from '@nestjs/common'

// 从不同领域包导入需要的模块
import { AiProviderFactory } from '@tuheg/ai-providers'
import { ConfigModule } from '@tuheg/config-management'
import { DatabaseModule } from '@tuheg/database'
// TODO: 需要从ai-domain或其他包导入这些服务
// import { DynamicAiSchedulerService, PromptInjectionGuard, PromptManagerModule } from '@tuheg/ai-services'
import { CreationService } from './creation.service'
// 导入本模块自己的器官
import { CreationAgentController } from './creation-agent.controller'

@Module({
  imports: [
    ConfigModule, // 使用共享的类型安全配置模块
    DatabaseModule, // 使用数据库模块
    // TODO: 添加其他必要的模块
    // PromptManagerModule,
    // EventBusModule,
  ],
  controllers: [CreationAgentController],
  providers: [
    CreationService,
    AiProviderFactory,
    // TODO: 需要从相应的包导入这些服务
    // DynamicAiSchedulerService,
    // PromptInjectionGuard
  ],
})
export class CreationAgentModule {}
