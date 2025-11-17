import { Module } from '@nestjs/common'
import { PluginMarketplaceService } from './plugin-marketplace.service'
import { PluginMarketplaceController } from './plugin-marketplace.controller'
import { PluginMarketplaceAdminController } from './plugin-marketplace-admin.controller'
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
  controllers: [PluginMarketplaceController, PluginMarketplaceAdminController],
  exports: [
    PluginMarketplaceService,
    PluginReviewService,
    PluginStatisticsService,
    PluginUploadService,
    PluginSearchService,
  ],
})
export class PluginMarketplaceModule {}
