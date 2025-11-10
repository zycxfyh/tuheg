// ============================================================================
// VCP 模块 - 集成 VCPToolBox 核心功能
// ============================================================================

import { Module } from '@nestjs/common'
import { AgentCommunicationService } from './agent-communication.service'
import { AsyncWorkflowService } from './async-workflow.service'
import { CrossMemoryService } from './cross-memory.service'
import { TarVariableService } from './tar-variable.service'
import { VCPProtocolService } from './vcp-protocol.service'
import { WebSocketService } from './websocket.service'

@Module({
  providers: [
    TarVariableService,
    WebSocketService,
    VCPProtocolService,
    CrossMemoryService,
    AgentCommunicationService,
    AsyncWorkflowService,
  ],
  exports: [
    TarVariableService,
    WebSocketService,
    VCPProtocolService,
    CrossMemoryService,
    AgentCommunicationService,
    AsyncWorkflowService,
  ],
})
export class VCPModule {}
