import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { TaskService } from './task.service';
import { CollaborationService } from './collaboration.service';
import { AgentLearningService } from './agent-learning.service';
import { AgentCollaborationController } from './agent-collaboration.controller';
import { AgentCommunicationService } from './agent-communication.service';

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
