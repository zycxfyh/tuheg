import { Module } from '@nestjs/common'
import { MultimodalService } from './services/multimodal.service'
import { PersonalizationService } from './services/personalization.service'
import { ReasoningService } from './services/reasoning.service'
import { ModelFusionService } from './services/model-fusion.service'
import { ContextLearningService } from './services/context-learning.service'
import { AdvancedCapabilitiesController } from './controllers/advanced-capabilities.controller'

@Module({
  providers: [
    MultimodalService,
    PersonalizationService,
    ReasoningService,
    ModelFusionService,
    ContextLearningService,
  ],
  controllers: [AdvancedCapabilitiesController],
  exports: [
    MultimodalService,
    PersonalizationService,
    ReasoningService,
    ModelFusionService,
    ContextLearningService,
  ],
})
export class AdvancedCapabilitiesModule {}
