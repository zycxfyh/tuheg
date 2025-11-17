import { Module } from '@nestjs/common'
import { DataWarehouseManagerService } from './services/data-warehouse-manager.service'
import { UserBehaviorAnalyzerService } from './services/user-behavior-analyzer.service'
import { AIContentEvaluatorService } from './services/ai-content-evaluator.service'
import { DataWarehouseAnalyticsServiceImpl } from './services/data-warehouse-analytics.service'
import { DataWarehouseController } from './controllers/data-warehouse.controller'

@Module({
  providers: [
    DataWarehouseManagerService,
    UserBehaviorAnalyzerService,
    AIContentEvaluatorService,
    {
      provide: 'DataWarehouseAnalyticsService',
      useClass: DataWarehouseAnalyticsServiceImpl,
    },
  ],
  controllers: [DataWarehouseController],
  exports: [
    'DataWarehouseAnalyticsService',
  ],
})
export class DataWarehouseModule {}
