// 文件路径: apps/logic-agent/src/logic-agent.module.ts

import { Module } from '@nestjs/common'
// 从不同领域包导入需要的模块
import { AiProviderFactory, DynamicAiSchedulerService, PromptInjectionGuard, PromptManagerModule } from '@tuheg/ai-domain'
import { ConfigModule, EventBusModule, PrismaModule } from '@tuheg/infrastructure'
import { LogicService } from './logic.service'
import { LogicAgentController } from './logic-agent.controller'
import { RuleEngineService } from './rule-engine.service'

@Module({
  imports: [
    ConfigModule, // 使用共享的类型安全配置模块
    PrismaModule,
    EventBusModule,
    PromptManagerModule, // [核心] 将"图书馆部门"加入到本模块的"依赖清单"中
  ],
  controllers: [LogicAgentController],
  providers: [
    LogicService,
    RuleEngineService,
    DynamicAiSchedulerService,
    AiProviderFactory,
    PromptInjectionGuard,
    // [注释] PromptManagerService 现在由导入的 PromptManagerModule 自动提供
  ],
})
export class LogicAgentModule {}
