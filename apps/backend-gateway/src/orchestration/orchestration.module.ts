import { Module } from '@nestjs/common'
import { OrchestrationController } from './orchestration.controller'

@Module({
  controllers: [OrchestrationController],
  providers: [],
  exports: []
})
export class OrchestrationAPIModule {}
