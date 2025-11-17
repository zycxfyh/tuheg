import { Module } from '@nestjs/common'
import { AgentManagerService } from './services/agent-manager.service'
// 导入实现类（这些将在后续实现中创建）
import { AgentRegistryImpl } from './implementations/agent-registry.impl'
import { AgentDiscoveryServiceImpl } from './implementations/agent-discovery.impl'
import { AgentLoadBalancerImpl } from './implementations/agent-load-balancer.impl'
import { ToolRegistryImpl } from './implementations/tool-registry.impl'
import { ToolExecutorImpl } from './implementations/tool-executor.impl'
import { ToolPermissionManagerImpl } from './implementations/tool-permission-manager.impl'
import { ToolCacheImpl } from './implementations/tool-cache.impl'
import { ToolOrchestratorImpl } from './implementations/tool-orchestrator.impl'

/**
 * AI Agent模块
 *
 * 提供完整的AI Agent标准化协议实现，包括：
 * - Agent生命周期管理
 * - Agent注册和发现
 * - 插件化工具系统
 * - 工具执行和编排
 * - 权限管理和缓存
 */
@Module({
  providers: [
    // Agent管理器
    {
      provide: AgentManagerService,
      useFactory: (
        registry: AgentRegistryImpl,
        discovery: AgentDiscoveryServiceImpl,
        loadBalancer: AgentLoadBalancerImpl,
        toolRegistry: ToolRegistryImpl,
        toolExecutor: ToolExecutorImpl,
        permissionManager: ToolPermissionManagerImpl,
        toolCache: ToolCacheImpl,
        toolOrchestrator: ToolOrchestratorImpl
      ) => {
        return new AgentManagerService(
          registry,
          discovery,
          loadBalancer,
          toolRegistry,
          toolExecutor,
          permissionManager,
          toolCache,
          toolOrchestrator
        )
      },
      inject: [
        AgentRegistryImpl,
        AgentDiscoveryServiceImpl,
        AgentLoadBalancerImpl,
        ToolRegistryImpl,
        ToolExecutorImpl,
        ToolPermissionManagerImpl,
        ToolCacheImpl,
        ToolOrchestratorImpl
      ]
    },

    // 核心服务实现
    AgentRegistryImpl,
    AgentDiscoveryServiceImpl,
    AgentLoadBalancerImpl,
    ToolRegistryImpl,
    ToolExecutorImpl,
    ToolPermissionManagerImpl,
    ToolCacheImpl,
    ToolOrchestratorImpl
  ],
  exports: [
    AgentManagerService,
    AgentRegistryImpl,
    AgentDiscoveryServiceImpl,
    AgentLoadBalancerImpl,
    ToolRegistryImpl,
    ToolExecutorImpl,
    ToolPermissionManagerImpl,
    ToolCacheImpl,
    ToolOrchestratorImpl
  ]
})
export class AIAgentModule {}
