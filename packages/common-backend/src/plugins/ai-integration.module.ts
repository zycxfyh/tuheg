import { Module } from '@nestjs/common';
import { AiProviderService } from './ai-provider.service';
import { AiModelService } from './ai-model.service';
import { ModelRouterService } from './model-router.service';
import { AiMetricsService } from './ai-metrics.service';
import { AiTaskQueueService } from './ai-task-queue.service';
import { AiIntegrationController } from './ai-integration.controller';

@Module({
  providers: [
    AiProviderService,
    AiModelService,
    ModelRouterService,
    AiMetricsService,
    AiTaskQueueService,
  ],
  controllers: [AiIntegrationController],
  exports: [
    AiProviderService,
    AiModelService,
    ModelRouterService,
    AiMetricsService,
    AiTaskQueueService,
  ],
})
export class AiIntegrationModule {}
