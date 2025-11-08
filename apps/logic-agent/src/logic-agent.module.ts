// 文件路径: apps/logic-agent/src/logic-agent.module.ts

import { Module } from '@nestjs/common'
// [核心修正] 从 @tuheg/common-backend 的总出口 (index.ts) 导入所有需要的共享模块
import {
  AiProviderFactory,
  ConfigModule,
  DynamicAiSchedulerService,
  EventBusModule,
  PrismaModule,
  PromptInjectionGuard,
  PromptManagerModule, // [核心] 导入我们新建的"图书馆部门"
} from '@tuheg/common-backend'
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
