import { Module } from '@nestjs/common'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { AgentRegistryService } from './agent-registry.service'
import { IntelligentSchedulerService } from './intelligent-scheduler.service'
import { WorkflowOrchestratorService } from './workflow-orchestrator.service'

@Module({
  imports: [
    EventEmitterModule.forRoot() // 用于Agent事件通信
  ],
  providers: [
    AgentRegistryService,
    IntelligentSchedulerService,
    WorkflowOrchestratorService
  ],
  exports: [
    AgentRegistryService,
    IntelligentSchedulerService,
    WorkflowOrchestratorService
  ]
})
export class OrchestrationModule {}
