import { Module } from '@nestjs/common'
import { AiIntegrationController } from './ai-integration.controller'
import { AiMetricsService } from './ai-metrics.service'
import { AiModelService } from './ai-model.service'
import { AiProviderService } from './ai-provider.service'
import { AiTaskQueueService } from './ai-task-queue.service'
import { ModelRouterService } from './model-router.service'

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
