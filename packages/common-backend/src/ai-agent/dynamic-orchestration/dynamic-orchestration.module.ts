import { Module } from '@nestjs/common'
import { DynamicOrchestrationManagerService } from './services/dynamic-orchestration-manager.service'
// 导入实现类（这些将在后续实现中创建）
import { TaskAnalyzerImpl } from './implementations/task-analyzer.impl'
import { TaskDecomposerImpl } from './implementations/task-decomposer.impl'
import { WorkflowEngineImpl } from './implementations/workflow-engine.impl'
import { AgentCompositionEngineImpl } from './implementations/agent-composition-engine.impl'
import { DynamicRouterImpl } from './implementations/dynamic-router.impl'
import { OrchestrationOptimizerImpl } from './implementations/orchestration-optimizer.impl'
import { OrchestrationStrategyImpl } from './implementations/orchestration-strategy.impl'
import { TaskSchedulerImpl } from './implementations/task-scheduler.impl'
import { ResourceAllocatorImpl } from './implementations/resource-allocator.impl'
import { StrategySelectorImpl } from './implementations/strategy-selector.impl'
import { AdaptiveOrchestratorImpl } from './implementations/adaptive-orchestrator.impl'

/**
 * 动态Agent编排模块
 *
 * 提供完整的动态编排功能，包括：
 * - 任务分析和分解
 * - 工作流引擎
 * - Agent组合和协作
 * - 动态路由和调度
 * - 自适应优化
 */
@Module({
  providers: [
    // 动态编排管理器
    {
      provide: DynamicOrchestrationManagerService,
      useFactory: (
        agentManager: any, // AgentManagerService
        taskAnalyzer: TaskAnalyzerImpl,
        taskDecomposer: TaskDecomposerImpl,
        workflowEngine: WorkflowEngineImpl,
        compositionEngine: AgentCompositionEngineImpl,
        dynamicRouter: DynamicRouterImpl,
        orchestrationOptimizer: OrchestrationOptimizerImpl,
        strategySelector: StrategySelectorImpl,
        taskScheduler: TaskSchedulerImpl,
        resourceAllocator: ResourceAllocatorImpl,
        adaptiveOrchestrator: AdaptiveOrchestratorImpl
      ) => {
        return new DynamicOrchestrationManagerService(
          agentManager,
          taskAnalyzer,
          taskDecomposer,
          workflowEngine,
          compositionEngine,
          dynamicRouter,
          orchestrationOptimizer,
          strategySelector,
          taskScheduler,
          resourceAllocator,
          adaptiveOrchestrator
        )
      },
      inject: [
        'AgentManagerService',
        TaskAnalyzerImpl,
        TaskDecomposerImpl,
        WorkflowEngineImpl,
        AgentCompositionEngineImpl,
        DynamicRouterImpl,
        OrchestrationOptimizerImpl,
        StrategySelectorImpl,
        TaskSchedulerImpl,
        ResourceAllocatorImpl,
        AdaptiveOrchestratorImpl
      ]
    },

    // 核心服务实现
    TaskAnalyzerImpl,
    TaskDecomposerImpl,
    WorkflowEngineImpl,
    AgentCompositionEngineImpl,
    DynamicRouterImpl,
    OrchestrationOptimizerImpl,
    OrchestrationStrategyImpl,
    TaskSchedulerImpl,
    ResourceAllocatorImpl,
    StrategySelectorImpl,
    AdaptiveOrchestratorImpl
  ],
  exports: [
    DynamicOrchestrationManagerService,
    TaskAnalyzerImpl,
    TaskDecomposerImpl,
    WorkflowEngineImpl,
    AgentCompositionEngineImpl,
    DynamicRouterImpl,
    OrchestrationOptimizerImpl,
    OrchestrationStrategyImpl,
    TaskSchedulerImpl,
    ResourceAllocatorImpl,
    StrategySelectorImpl,
    AdaptiveOrchestratorImpl
  ]
})
export class DynamicOrchestrationModule {}
