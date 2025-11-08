import { Module } from '@nestjs/common'
import { PluginMarketplaceService } from './plugin-marketplace.service'
import { PluginMarketplaceController } from './plugin-marketplace.controller'
import { PluginReviewService } from './plugin-review.service'
import { PluginStatisticsService } from './plugin-statistics.service'
import { PluginUploadService } from './plugin-upload.service'
import { PluginSearchService } from './plugin-search.service'

@Module({
  providers: [
    PluginMarketplaceService,
    PluginReviewService,
    PluginStatisticsService,
    PluginUploadService,
    PluginSearchService,
  ],
  controllers: [PluginMarketplaceController],
  exports: [
    PluginMarketplaceService,
    PluginReviewService,
    PluginStatisticsService,
    PluginUploadService,
    PluginSearchService,
  ],
})
export class PluginMarketplaceModule {}
