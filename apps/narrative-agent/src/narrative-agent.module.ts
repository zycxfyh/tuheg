// 文件路径: apps/narrative-agent/src/narrative-agent.module.ts

import { Module } from '@nestjs/common'
// [核心修正] 从领域包导入所有需要的共享模块
import { AiProviderFactory, PromptManagerModule } from '@tuheg/ai-domain'
import { ConfigModule, EventBusModule, PrismaModule } from '@tuheg/infrastructure'
import { NarrativeService } from './narrative.service'
import { NarrativeAgentController } from './narrative-agent.controller'

@Module({
  imports: [
    ConfigModule, // 使用共享的类型安全配置模块
    PrismaModule,
    PromptManagerModule, // [核心] 将"图书馆部门"加入到"工具清单"中
    EventBusModule,
  ],
  controllers: [NarrativeAgentController],
  providers: [NarrativeService, DynamicAiSchedulerService, AiProviderFactory],
})
export class NarrativeAgentModule {}
