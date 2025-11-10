import { Module } from '@nestjs/common'
import { AgentService } from './agent.service'
import { AgentCollaborationController } from './agent-collaboration.controller'
import { AgentCommunicationService } from './agent-communication.service'
import { AgentLearningService } from './agent-learning.service'
import { CollaborationService } from './collaboration.service'
import { TaskService } from './task.service'

@Module({
  providers: [
    AgentService,
    TaskService,
    CollaborationService,
    AgentLearningService,
    AgentCommunicationService,
  ],
  controllers: [AgentCollaborationController],
  exports: [
    AgentService,
    TaskService,
    CollaborationService,
    AgentLearningService,
    AgentCommunicationService,
  ],
})
export class AgentCollaborationModule {}
